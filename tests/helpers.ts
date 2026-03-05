/**
 * Shared test helpers for Brainus AI JS SDK tests.
 */

export const VALID_API_KEY = 'brainus_test_key_abc123'
export const BASE_URL = 'https://api.brainus.lk'

export const QUERY_RESPONSE = {
  answer: 'Python is a high-level programming language.',
  citations: [
    {
      document_id: 'doc_001',
      document_name: 'Python Basics.pdf',
      pages: [1, 2],
      metadata: { subject: 'ICT', grade: '12' },
      chunk_text: 'Python is a high-level...',
    },
  ],
  has_citations: true,
}

export const USAGE_RESPONSE = {
  total_requests: 42,
  total_tokens: 8500,
  total_cost_usd: 0.034,
  by_endpoint: { '/api/v1/dev/query': 42 },
  quota_remaining: 958,
  quota_percentage: 4.2,
  plan: {
    name: 'Pro',
    rate_limit_per_minute: 60,
    rate_limit_per_day: 1000,
    monthly_quota: 1000,
  },
  period_start: '2026-03-01',
  period_end: '2026-03-31',
}

export const PLANS_RESPONSE = {
  plans: [
    {
      id: 'plan_free',
      name: 'Free',
      description: 'Free tier',
      rate_limit_per_minute: 10,
      rate_limit_per_day: 100,
      monthly_quota: 100,
      price_lkr: null,
      allowed_models: ['brainusai-fast'],
      features: {},
      is_active: true,
    },
    {
      id: 'plan_pro',
      name: 'Pro',
      description: 'Pro tier',
      rate_limit_per_minute: 60,
      rate_limit_per_day: 1000,
      monthly_quota: 1000,
      price_lkr: 2500.0,
      allowed_models: ['brainusai-fast', 'brainusai-thinking'],
      features: { priority_support: true },
      is_active: true,
    },
  ],
}

/** Build a mock fetch that returns the given status + JSON body. */
export function mockFetch(
  status: number,
  body: unknown,
  headers: Record<string, string> = {}
) {
  const headerMap = new Map(Object.entries(headers))
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    statusText: statusText(status),
    json: async () => body,
    headers: {
      get: (key: string) => headerMap.get(key.toLowerCase()) ?? null,
    },
  })
}

/** Build a mock fetch that fails with a network error. */
export function mockFetchNetworkError(message = 'Network failure') {
  return vi.fn().mockRejectedValue(new TypeError(message))
}

/** Build a mock fetch that returns 5xx on first N calls, then succeeds. */
export function mockFetchWithRetries(failCount: number, successBody: unknown) {
  let calls = 0
  return vi.fn().mockImplementation(async () => {
    calls++
    if (calls <= failCount) {
      return {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ detail: 'Server error' }),
        headers: { get: () => null },
      }
    }
    return {
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => successBody,
      headers: { get: () => null },
    }
  })
}

function statusText(status: number): string {
  const map: Record<number, string> = {
    200: 'OK',
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
  }
  return map[status] ?? 'Unknown'
}
