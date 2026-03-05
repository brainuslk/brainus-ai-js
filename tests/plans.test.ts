import { describe, it, expect, vi, afterEach } from 'vitest'
import { BrainusAI } from '../src/client'
import { AuthenticationError } from '../src/errors'
import { VALID_API_KEY, PLANS_RESPONSE, mockFetch } from './helpers'

const PLANS_URL = 'https://api.brainus.lk/api/v1/dev/plans'

function makeClient() {
  return new BrainusAI({ apiKey: VALID_API_KEY, maxRetries: 0 })
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('BrainusAI.getPlans()', () => {
  it('returns array of plans', async () => {
    vi.stubGlobal('fetch', mockFetch(200, PLANS_RESPONSE))
    const plans = await makeClient().getPlans()
    expect(plans).toHaveLength(2)
  })

  it('maps snake_case plan fields to camelCase', async () => {
    vi.stubGlobal('fetch', mockFetch(200, PLANS_RESPONSE))
    const plans = await makeClient().getPlans()
    const free = plans[0]
    expect(free.id).toBe('plan_free')
    expect(free.name).toBe('Free')
    expect(free.rateLimitPerMinute).toBe(10)
    expect(free.rateLimitPerDay).toBe(100)
    expect(free.monthlyQuota).toBe(100)
    expect(free.priceLkr).toBeNull()
    expect(free.isActive).toBe(true)
  })

  it('maps allowedModels correctly', async () => {
    vi.stubGlobal('fetch', mockFetch(200, PLANS_RESPONSE))
    const plans = await makeClient().getPlans()
    expect(plans[0].allowedModels).toEqual(['brainusai-fast'])
    expect(plans[1].allowedModels).toContain('brainusai-thinking')
  })

  it('maps features correctly', async () => {
    vi.stubGlobal('fetch', mockFetch(200, PLANS_RESPONSE))
    const plans = await makeClient().getPlans()
    expect(plans[1].features).toEqual({ priority_support: true })
  })

  it('returns empty array for empty plans list', async () => {
    vi.stubGlobal('fetch', mockFetch(200, { plans: [] }))
    const plans = await makeClient().getPlans()
    expect(plans).toEqual([])
  })

  it('defaults allowedModels to [] when absent', async () => {
    vi.stubGlobal('fetch', mockFetch(200, {
      plans: [{ id: 'x', name: 'X', rate_limit_per_minute: 5, rate_limit_per_day: 50, is_active: true }],
    }))
    const plans = await makeClient().getPlans()
    expect(plans[0].allowedModels).toEqual([])
  })

  it('defaults features to {} when absent', async () => {
    vi.stubGlobal('fetch', mockFetch(200, {
      plans: [{ id: 'x', name: 'X', rate_limit_per_minute: 5, rate_limit_per_day: 50, is_active: true }],
    }))
    const plans = await makeClient().getPlans()
    expect(plans[0].features).toEqual({})
  })

  it('uses GET method', async () => {
    const fetchMock = mockFetch(200, PLANS_RESPONSE)
    vi.stubGlobal('fetch', fetchMock)
    await makeClient().getPlans()
    expect(fetchMock.mock.calls[0][1].method).toBe('GET')
  })

  it('calls the correct endpoint', async () => {
    const fetchMock = mockFetch(200, PLANS_RESPONSE)
    vi.stubGlobal('fetch', fetchMock)
    await makeClient().getPlans()
    expect(fetchMock.mock.calls[0][0]).toBe(PLANS_URL)
  })

  it('401 throws AuthenticationError', async () => {
    vi.stubGlobal('fetch', mockFetch(401, { detail: 'Invalid API key' }))
    await expect(makeClient().getPlans()).rejects.toBeInstanceOf(AuthenticationError)
  })
})
