import { describe, it, expect, vi, afterEach } from 'vitest'
import { BrainusAI } from '../src/client'
import {
  AuthenticationError,
  RateLimitError,
  QuotaExceededError,
  APIError,
} from '../src/errors'
import {
  VALID_API_KEY,
  QUERY_RESPONSE,
  mockFetch,
  mockFetchNetworkError,
  mockFetchWithRetries,
} from './helpers'

const QUERY_URL = 'https://api.brainus.lk/api/v1/dev/query'

function makeClient(overrides = {}) {
  return new BrainusAI({ apiKey: VALID_API_KEY, maxRetries: 0, ...overrides })
}

afterEach(() => {
  vi.unstubAllGlobals()
})

// ---------------------------------------------------------------------------
// Happy path
// ---------------------------------------------------------------------------

describe('BrainusAI.query() - happy path', () => {
  it('returns answer string', async () => {
    vi.stubGlobal('fetch', mockFetch(200, QUERY_RESPONSE))
    const resp = await makeClient().query({ query: 'What is Python?' })
    expect(resp.answer).toBe('Python is a high-level programming language.')
  })

  it('maps snake_case citation fields to camelCase', async () => {
    vi.stubGlobal('fetch', mockFetch(200, QUERY_RESPONSE))
    const resp = await makeClient().query({ query: 'test' })
    const c = resp.citations[0]
    expect(c.documentId).toBe('doc_001')
    expect(c.documentName).toBe('Python Basics.pdf')
    expect(c.chunkText).toBe('Python is a high-level...')
    expect(c.pages).toEqual([1, 2])
  })

  it('maps has_citations to hasCitations', async () => {
    vi.stubGlobal('fetch', mockFetch(200, QUERY_RESPONSE))
    const resp = await makeClient().query({ query: 'test' })
    expect(resp.hasCitations).toBe(true)
  })

  it('returns empty citations array when none returned', async () => {
    vi.stubGlobal('fetch', mockFetch(200, { answer: 'No results.', citations: [], has_citations: false }))
    const resp = await makeClient().query({ query: 'test' })
    expect(resp.citations).toEqual([])
    expect(resp.hasCitations).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Request body construction
// ---------------------------------------------------------------------------

describe('BrainusAI.query() - request body', () => {
  it('sends query text in body', async () => {
    const fetchMock = mockFetch(200, QUERY_RESPONSE)
    vi.stubGlobal('fetch', fetchMock)
    await makeClient().query({ query: 'What is Python?' })
    const body = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(body.query).toBe('What is Python?')
  })

  it('sends store_id when provided', async () => {
    const fetchMock = mockFetch(200, QUERY_RESPONSE)
    vi.stubGlobal('fetch', fetchMock)
    await makeClient().query({ query: 'test', storeId: 'store_abc' })
    const body = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(body.store_id).toBe('store_abc')
  })

  it('omits store_id when not provided', async () => {
    const fetchMock = mockFetch(200, QUERY_RESPONSE)
    vi.stubGlobal('fetch', fetchMock)
    await makeClient().query({ query: 'test' })
    const body = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(body).not.toHaveProperty('store_id')
  })

  it('sends model when provided', async () => {
    const fetchMock = mockFetch(200, QUERY_RESPONSE)
    vi.stubGlobal('fetch', fetchMock)
    await makeClient().query({ query: 'test', model: 'brainusai-thinking' })
    const body = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(body.model).toBe('brainusai-thinking')
  })

  it('omits model when not provided', async () => {
    const fetchMock = mockFetch(200, QUERY_RESPONSE)
    vi.stubGlobal('fetch', fetchMock)
    await makeClient().query({ query: 'test' })
    const body = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(body).not.toHaveProperty('model')
  })

  it('sends filters when provided', async () => {
    const fetchMock = mockFetch(200, QUERY_RESPONSE)
    vi.stubGlobal('fetch', fetchMock)
    await makeClient().query({ query: 'test', filters: { subject: 'ICT', grade: '12' } })
    const body = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(body.filters).toMatchObject({ subject: 'ICT', grade: '12' })
  })

  it('omits filters when not provided', async () => {
    const fetchMock = mockFetch(200, QUERY_RESPONSE)
    vi.stubGlobal('fetch', fetchMock)
    await makeClient().query({ query: 'test' })
    const body = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(body).not.toHaveProperty('filters')
  })

  it('uses POST method', async () => {
    const fetchMock = mockFetch(200, QUERY_RESPONSE)
    vi.stubGlobal('fetch', fetchMock)
    await makeClient().query({ query: 'test' })
    expect(fetchMock.mock.calls[0][1].method).toBe('POST')
  })

  it('calls the correct endpoint', async () => {
    const fetchMock = mockFetch(200, QUERY_RESPONSE)
    vi.stubGlobal('fetch', fetchMock)
    await makeClient().query({ query: 'test' })
    expect(fetchMock.mock.calls[0][0]).toBe(QUERY_URL)
  })
})

// ---------------------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------------------

describe('BrainusAI.query() - error handling', () => {
  it('401 throws AuthenticationError and does not retry', async () => {
    const fetchMock = mockFetch(401, { detail: 'Invalid API key' })
    vi.stubGlobal('fetch', fetchMock)
    const client = new BrainusAI({ apiKey: VALID_API_KEY, maxRetries: 3 })
    await expect(client.query({ query: 'test' })).rejects.toBeInstanceOf(AuthenticationError)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('429 throws RateLimitError and does not retry', async () => {
    const fetchMock = mockFetch(429, { detail: 'Rate limit exceeded' })
    vi.stubGlobal('fetch', fetchMock)
    const client = new BrainusAI({ apiKey: VALID_API_KEY, maxRetries: 3 })
    await expect(client.query({ query: 'test' })).rejects.toBeInstanceOf(RateLimitError)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('429 with Retry-After header sets retryAfter on error', async () => {
    vi.stubGlobal('fetch', mockFetch(429, { detail: 'Rate limit exceeded' }, { 'retry-after': '30' }))
    const err = await makeClient().query({ query: 'test' }).catch((e) => e)
    expect(err).toBeInstanceOf(RateLimitError)
    expect((err as RateLimitError).retryAfter).toBe(30)
  })

  it('429 without Retry-After header has retryAfter undefined', async () => {
    vi.stubGlobal('fetch', mockFetch(429, { detail: 'Rate limit exceeded' }))
    const err = await makeClient().query({ query: 'test' }).catch((e) => e)
    expect((err as RateLimitError).retryAfter).toBeUndefined()
  })

  it('403 with quota in message throws QuotaExceededError', async () => {
    vi.stubGlobal('fetch', mockFetch(403, { detail: 'Monthly quota exceeded' }))
    await expect(makeClient().query({ query: 'test' })).rejects.toBeInstanceOf(QuotaExceededError)
  })

  it('403 without quota throws APIError with status 403', async () => {
    vi.stubGlobal('fetch', mockFetch(403, { detail: 'Forbidden' }))
    const err = await makeClient().query({ query: 'test' }).catch((e) => e)
    expect(err).toBeInstanceOf(APIError)
    expect((err as APIError).statusCode).toBe(403)
  })

  it('400 missing store_id error includes helpful message', async () => {
    vi.stubGlobal('fetch', mockFetch(400, { detail: 'No store_id provided and no default store configured' }))
    const err = await makeClient().query({ query: 'test' }).catch((e) => e)
    expect(err).toBeInstanceOf(APIError)
    expect((err as APIError).message).toContain('store_id')
  })

  it('500 throws APIError', async () => {
    vi.stubGlobal('fetch', mockFetch(500, { detail: 'Internal server error' }))
    await expect(makeClient().query({ query: 'test' })).rejects.toBeInstanceOf(APIError)
  })

  it('500 is retried up to maxRetries times then throws', async () => {
    const fetchMock = mockFetch(500, { detail: 'Server error' })
    vi.stubGlobal('fetch', fetchMock)
    // loop runs for attempt=0,1,2 (attempt <= maxRetries) = 3 total calls
    const client = new BrainusAI({ apiKey: VALID_API_KEY, maxRetries: 2 })
    await expect(client.query({ query: 'test' })).rejects.toBeInstanceOf(APIError)
    expect(fetchMock).toHaveBeenCalledTimes(3)
  }, 15000)

  it('succeeds after initial 500s if a retry succeeds', async () => {
    vi.stubGlobal('fetch', mockFetchWithRetries(1, QUERY_RESPONSE))
    const client = new BrainusAI({ apiKey: VALID_API_KEY, maxRetries: 2 })
    const resp = await client.query({ query: 'test' })
    expect(resp.answer).toBe('Python is a high-level programming language.')
  })

  it('network error throws APIError', async () => {
    vi.stubGlobal('fetch', mockFetchNetworkError('Network failure'))
    await expect(makeClient().query({ query: 'test' })).rejects.toBeInstanceOf(Error)
  })
})
