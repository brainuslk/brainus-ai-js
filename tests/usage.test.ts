import { describe, it, expect, vi, afterEach } from 'vitest'
import { BrainusAI } from '../src/client'
import { AuthenticationError } from '../src/errors'
import { VALID_API_KEY, USAGE_RESPONSE, mockFetch } from './helpers'

const USAGE_URL = 'https://api.brainus.lk/api/v1/dev/usage'

function makeClient() {
  return new BrainusAI({ apiKey: VALID_API_KEY, maxRetries: 0 })
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('BrainusAI.getUsage()', () => {
  it('maps snake_case fields to camelCase', async () => {
    vi.stubGlobal('fetch', mockFetch(200, USAGE_RESPONSE))
    const stats = await makeClient().getUsage()
    expect(stats.totalRequests).toBe(42)
    expect(stats.totalTokens).toBe(8500)
    expect(stats.totalCostUsd).toBeCloseTo(0.034)
    expect(stats.quotaRemaining).toBe(958)
    expect(stats.quotaPercentage).toBeCloseTo(4.2)
    expect(stats.periodStart).toBe('2026-03-01')
    expect(stats.periodEnd).toBe('2026-03-31')
  })

  it('maps nested plan info to camelCase', async () => {
    vi.stubGlobal('fetch', mockFetch(200, USAGE_RESPONSE))
    const stats = await makeClient().getUsage()
    expect(stats.plan).toBeDefined()
    expect(stats.plan!.name).toBe('Pro')
    expect(stats.plan!.rateLimitPerMinute).toBe(60)
    expect(stats.plan!.rateLimitPerDay).toBe(1000)
    expect(stats.plan!.monthlyQuota).toBe(1000)
  })

  it('byEndpoint mapped correctly', async () => {
    vi.stubGlobal('fetch', mockFetch(200, USAGE_RESPONSE))
    const stats = await makeClient().getUsage()
    expect(stats.byEndpoint).toEqual({ '/api/v1/dev/query': 42 })
  })

  it('optional fields absent when not in response', async () => {
    vi.stubGlobal('fetch', mockFetch(200, { total_requests: 0, by_endpoint: {} }))
    const stats = await makeClient().getUsage()
    expect(stats.totalTokens).toBeUndefined()
    expect(stats.totalCostUsd).toBeUndefined()
    expect(stats.plan).toBeUndefined()
    expect(stats.quotaRemaining).toBeUndefined()
    expect(stats.periodStart).toBeUndefined()
  })

  it('byEndpoint defaults to empty object when absent', async () => {
    vi.stubGlobal('fetch', mockFetch(200, { total_requests: 0 }))
    const stats = await makeClient().getUsage()
    expect(stats.byEndpoint).toEqual({})
  })

  it('uses GET method', async () => {
    const fetchMock = mockFetch(200, USAGE_RESPONSE)
    vi.stubGlobal('fetch', fetchMock)
    await makeClient().getUsage()
    expect(fetchMock.mock.calls[0][1].method).toBe('GET')
  })

  it('calls the correct endpoint', async () => {
    const fetchMock = mockFetch(200, USAGE_RESPONSE)
    vi.stubGlobal('fetch', fetchMock)
    await makeClient().getUsage()
    expect(fetchMock.mock.calls[0][0]).toBe(USAGE_URL)
  })

  it('401 throws AuthenticationError', async () => {
    vi.stubGlobal('fetch', mockFetch(401, { detail: 'Invalid API key' }))
    await expect(makeClient().getUsage()).rejects.toBeInstanceOf(AuthenticationError)
  })
})
