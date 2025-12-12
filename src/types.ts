/**
 * Type definitions for the Brainus AI SDK
 */

export interface BrainusAIConfig {
  /** Your Brainus AI API key (brainus_...) */
  apiKey: string;
  /** Base URL for the API (default: production gateway) */
  baseUrl?: string;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Maximum number of retry attempts */
  maxRetries?: number;
}

export interface QueryFilters {
  /** Subject filter (e.g., ICT, Science) */
  subject?: string;
  /** Grade level filter (e.g., 10, 11, 12) */
  grade?: string;
  /** Year filter (e.g., 2023, 2024) */
  year?: string;
  /** Category filter (Past Paper, Textbook, etc.) */
  category?: string;
  /** Language filter (English, Sinhala, Tamil) */
  language?: string;
}

export interface QueryRequest {
  /** The question or query text */
  query: string;
  /** File search store ID (optional - uses default if not provided) */
  storeId?: string;
  /** Optional metadata filters */
  filters?: QueryFilters;
  /** Gemini model to use (must be in your plan's allowed_models) */
  model?: string;
}

export interface Citation {
  /** Unique document identifier */
  documentId: string;
  /** Name of the source document */
  documentName: string;
  /** Page numbers referenced */
  pages: number[];
  /** Document metadata */
  metadata: Record<string, unknown>;
  /** Relevant text chunk (optional) */
  chunkText?: string;
}

export interface QueryResponse {
  /** The generated answer */
  answer: string;
  /** Source citations */
  citations: Citation[];
  /** Whether citations are available */
  hasCitations: boolean;
}

export interface PlanInfo {
  /** Plan name */
  name: string;
  /** Rate limit per minute */
  rateLimitPerMinute: number;
  /** Rate limit per day */
  rateLimitPerDay: number;
  /** Monthly quota (optional) */
  monthlyQuota?: number;
}

export interface UsageStats {
  /** Total requests this period */
  totalRequests: number;
  /** Total tokens used (optional) */
  totalTokens?: number;
  /** Total cost in USD (optional) */
  totalCostUsd?: number;
  /** Request count per endpoint */
  byEndpoint: Record<string, number>;
  /** Remaining quota (optional) */
  quotaRemaining?: number;
  /** Percentage of quota used (optional) */
  quotaPercentage?: number;
  /** Plan information (optional) */
  plan?: PlanInfo;
  /** Period start date (optional) */
  periodStart?: string;
  /** Period end date (optional) */
  periodEnd?: string;
}

export interface Plan {
  /** Plan ID */
  id: string;
  /** Plan name */
  name: string;
  /** Description */
  description?: string;
  /** Rate limit per minute */
  rateLimitPerMinute: number;
  /** Rate limit per day */
  rateLimitPerDay: number;
  /** Monthly quota (null = unlimited) */
  monthlyQuota?: number;
  /** Price in LKR (null = free) */
  priceLkr?: number;
  /** Allowed models for this plan */
  allowedModels: string[];
  /** Additional features */
  features: Record<string, unknown>;
  /** Whether plan is active */
  isActive: boolean;
}
