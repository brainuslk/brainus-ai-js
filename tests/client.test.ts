import { describe, it, expect, vi, afterEach } from 'vitest'
import { BrainusAI } from '../src/client'
import { AuthenticationError } from '../src/errors'
import { VALID_API_KEY, mockFetch, QUERY_RESPONSE } from './helpers'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('BrainusAI - initialization', () => {
  it('accepts a valid brainus_ prefixed key', () => {
    expect(() => new BrainusAI({ apiKey: VALID_API_KEY })).not.toThrow()
  })

  it('throws for empty api key', () => {
    expect(() => new BrainusAI({ apiKey: '' })).toThrow(Error)
  })

  it('throws for wrong prefix sk_live_', () => {
    expect(() => new BrainusAI({ apiKey: 'sk_live_abc123' })).toThrow(Error)
  })

  it('throws for bare string without prefix', () => {
    expect(() => new BrainusAI({ apiKey: 'my_api_key' })).toThrow(Error)
  })

  it('throws for openai-style key', () => {
    expect(() => new BrainusAI({ apiKey: 'sk-proj-abc123' })).toThrow(Error)
  })

  it('uses default baseUrl', () => {
    const client = new BrainusAI({ apiKey: VALID_API_KEY })
    expect((client as any).baseUrl).toBe('https://api.brainus.lk')
  })

  it('uses custom baseUrl', () => {
    const client = new BrainusAI({ apiKey: VALID_API_KEY, baseUrl: 'http://localhost:8000' })
    expect((client as any).baseUrl).toBe('http://localhost:8000')
  })

  it('uses default timeout of 30000ms', () => {
    const client = new BrainusAI({ apiKey: VALID_API_KEY })
    expect((client as any).timeout).toBe(30000)
  })

  it('uses custom timeout', () => {
    const client = new BrainusAI({ apiKey: VALID_API_KEY, timeout: 60000 })
    expect((client as any).timeout).toBe(60000)
  })

  it('uses default maxRetries of 3', () => {
    const client = new BrainusAI({ apiKey: VALID_API_KEY })
    expect((client as any).maxRetries).toBe(3)
  })

  it('uses custom maxRetries', () => {
    const client = new BrainusAI({ apiKey: VALID_API_KEY, maxRetries: 1 })
    expect((client as any).maxRetries).toBe(1)
  })

  it('sends X-API-Key header on requests', async () => {
    const fetchMock = mockFetch(200, QUERY_RESPONSE)
    vi.stubGlobal('fetch', fetchMock)

    const client = new BrainusAI({ apiKey: VALID_API_KEY })
    await client.query({ query: 'test' })

    const [, init] = fetchMock.mock.calls[0]
    expect((init as RequestInit).headers).toMatchObject({ 'X-API-Key': VALID_API_KEY })
  })
})
