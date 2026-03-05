/**
 * Main client for the Brainus AI SDK
 */

import type {
  BrainusAIConfig,
  QueryRequest,
  QueryResponse,
  UsageStats,
  Plan,
} from "./types";
import {
  AuthenticationError,
  RateLimitError,
  QuotaExceededError,
  APIError,
} from "./errors";
import { VERSION } from "./version";

// Internal types matching backend snake_case responses
interface _BackendCitation {
  document_id: string;
  document_name: string;
  pages?: number[];
  metadata?: Record<string, unknown>;
  chunk_text?: string;
}

interface _BackendQueryResponse {
  answer: string;
  citations: _BackendCitation[];
  has_citations: boolean;
}

interface _BackendPlanInfo {
  name: string;
  rate_limit_per_minute: number;
  rate_limit_per_day: number;
  monthly_quota?: number;
}

interface _BackendUsageResponse {
  total_requests: number;
  total_tokens?: number;
  total_cost_usd?: number;
  by_endpoint?: Record<string, number>;
  quota_remaining?: number;
  quota_percentage?: number;
  plan?: _BackendPlanInfo;
  period_start?: string;
  period_end?: string;
}

interface _BackendPlan {
  id: string;
  name: string;
  description?: string;
  rate_limit_per_minute: number;
  rate_limit_per_day: number;
  monthly_quota?: number;
  price_lkr?: number;
  allowed_models?: string[];
  features?: Record<string, unknown>;
  is_active: boolean;
}

interface _BackendPlansResponse {
  plans: _BackendPlan[];
}

export class BrainusAI {
  private apiKey: string;
  private baseUrl: string;
  private timeout: number;
  private maxRetries: number;

  /**
   * Initialize the Brainus AI client
   *
   * @example
   * ```ts
   * // Explicit API key
   * const client = new BrainusAI({ apiKey: 'brainus_...' })
   *
   * // From environment variable BRAINUS_API_KEY
   * const client = new BrainusAI()
   * ```
   */
  constructor(config: BrainusAIConfig = {}) {
    const apiKey =
      config.apiKey ??
      (typeof process !== "undefined" ? process.env?.BRAINUS_API_KEY : undefined) ??
      "";

    if (!apiKey || !apiKey.startsWith("brainus_")) {
      throw new Error(
        "Invalid API key. Pass apiKey or set the BRAINUS_API_KEY environment variable."
      );
    }

    this.apiKey = apiKey;
    this.baseUrl = config.baseUrl ?? "https://api.brainus.lk";
    this.timeout = config.timeout ?? 30000;
    this.maxRetries = config.maxRetries ?? 3;
  }

  /**
   * Query the Brainus AI system
   *
   * @example
   * ```ts
   * const response = await client.query({
   *   query: 'What is Object-Oriented Programming?',
   *   storeId: 'abc123', // Optional
   *   model: 'gemini-2.5-flash', // Optional
   *   filters: { subject: 'ICT', grade: '12' }
   * })
   *
   * console.log(response.answer)
   * response.citations.forEach(citation => {
   *   console.log(`Source: ${citation.documentName}, Pages: ${citation.pages}`)
   * })
   * ```
   */
  async query(request: QueryRequest): Promise<QueryResponse> {
    const body: Record<string, unknown> = {
      query: request.query,
    };

    if (request.storeId !== undefined) {
      body.store_id = request.storeId;
    }

    if (request.filters !== undefined) {
      body.filters = request.filters;
    }

    if (request.model !== undefined) {
      body.model = request.model;
    }

    const response = await this.makeRequest<_BackendQueryResponse>(
      "POST",
      "/api/v1/dev/query",
      body
    );

    return {
      answer: response.answer,
      citations: (response.citations ?? []).map((c) => ({
        documentId: c.document_id,
        documentName: c.document_name,
        pages: c.pages ?? [],
        metadata: c.metadata ?? {},
        chunkText: c.chunk_text,
      })),
      hasCitations: response.has_citations,
    };
  }

  /**
   * Get current usage statistics for your API key
   *
   * @example
   * ```ts
   * const stats = await client.getUsage()
   * console.log(`Total requests: ${stats.totalRequests}`)
   * console.log(`Quota used: ${stats.quotaPercentage}%`)
   * ```
   */
  async getUsage(): Promise<UsageStats> {
    const response = await this.makeRequest<_BackendUsageResponse>(
      "GET",
      "/api/v1/dev/usage"
    );

    return {
      totalRequests: response.total_requests,
      totalTokens: response.total_tokens,
      totalCostUsd: response.total_cost_usd,
      byEndpoint: response.by_endpoint ?? {},
      quotaRemaining: response.quota_remaining,
      quotaPercentage: response.quota_percentage,
      plan: response.plan
        ? {
            name: response.plan.name,
            rateLimitPerMinute: response.plan.rate_limit_per_minute,
            rateLimitPerDay: response.plan.rate_limit_per_day,
            monthlyQuota: response.plan.monthly_quota,
          }
        : undefined,
      periodStart: response.period_start,
      periodEnd: response.period_end,
    };
  }

  /**
   * Get available API plans
   *
   * @example
   * ```ts
   * const plans = await client.getPlans()
   * plans.forEach(plan => {
   *   console.log(`${plan.name}: ${plan.rateLimitPerMinute} req/min`)
   * })
   * ```
   */
  async getPlans(): Promise<Plan[]> {
    const response = await this.makeRequest<_BackendPlansResponse>(
      "GET",
      "/api/v1/dev/plans"
    );

    return response.plans.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      rateLimitPerMinute: p.rate_limit_per_minute,
      rateLimitPerDay: p.rate_limit_per_day,
      monthlyQuota: p.monthly_quota,
      priceLkr: p.price_lkr,
      allowedModels: p.allowed_models ?? [],
      features: p.features ?? {},
      isActive: p.is_active,
    }));
  }

  /**
   * Make an HTTP request to the API with error handling and retries
   */
  private async makeRequest<T>(
    method: string,
    endpoint: string,
    body?: unknown
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await fetch(url, {
          method,
          headers: {
            "X-API-Key": this.apiKey,
            "Content-Type": "application/json",
            "User-Agent": `@brainus/ai/${VERSION}`,
          },
          body: body ? JSON.stringify(body, null, 0) : undefined,
          signal: AbortSignal.timeout(this.timeout),
        });

        if (!response.ok) {
          await this.handleErrorResponse(response);
        }

        return (await response.json()) as T;
      } catch (error) {
        lastError = error as Error;

        // Don't retry for auth errors, rate limit errors, or client errors
        if (
          error instanceof AuthenticationError ||
          error instanceof RateLimitError ||
          error instanceof QuotaExceededError ||
          (error instanceof APIError &&
            error.statusCode &&
            error.statusCode < 500)
        ) {
          throw error;
        }

        // Wait before retrying (exponential backoff)
        if (attempt < this.maxRetries) {
          await this.sleep(Math.min(1000 * Math.pow(2, attempt), 10000));
        }
      }
    }

    throw new APIError(
      `Request failed after ${this.maxRetries + 1} attempts: ${
        lastError?.message
      }`
    );
  }

  /**
   * Handle error responses from the API
   */
  private async handleErrorResponse(response: Response): Promise<never> {
    let errorMessage: string;

    try {
      const errorData = (await response.json()) as {
        detail?: string;
        message?: string;
      };
      errorMessage =
        errorData.detail || errorData.message || response.statusText;
    } catch {
      errorMessage = response.statusText;
    }

    switch (response.status) {
      case 401:
        throw new AuthenticationError(errorMessage);
      case 429: {
        const retryAfter = response.headers.get("Retry-After");
        throw new RateLimitError(
          errorMessage,
          retryAfter ? parseInt(retryAfter, 10) : undefined
        );
      }
      case 400:
        if (
          errorMessage.includes(
            "No store_id provided and no default store configured"
          )
        ) {
          throw new APIError(
            "No store_id provided and no default store configured. Please provide a store_id in your request.",
            400
          );
        }
        throw new APIError(errorMessage, response.status);
      case 403:
        if (errorMessage.toLowerCase().includes("quota")) {
          throw new QuotaExceededError(errorMessage);
        }
        throw new APIError(errorMessage, response.status);
      default:
        throw new APIError(errorMessage, response.status);
    }
  }

  /**
   * Sleep for a specified duration
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
