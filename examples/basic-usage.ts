/**
 * Basic usage examples for the Brainus AI JavaScript/TypeScript SDK
 */

import { BrainusAI, AuthenticationError, RateLimitError } from "@brainus/ai";

// Get API key from environment variable
const apiKey = process.env.BRAINUS_API_KEY;
if (!apiKey) {
  console.error("Error: BRAINUS_API_KEY environment variable not set");
  process.exit(1);
}

// Initialize client
const client = new BrainusAI({ apiKey });

async function main() {
  try {
    // Example 1: Simple query
    console.log("Example 1: Simple query");
    console.log("-".repeat(50));
    const response = await client.query({
      query: "What is Object-Oriented Programming?",
      // storeId is optional - uses default if not provided
    });
    console.log(`Answer: ${response.answer}\n`);

    if (response.hasCitations) {
      console.log("Citations:");
      response.citations.forEach((citation) => {
        console.log(
          `  - ${citation.documentName} (Pages: ${citation.pages.join(", ")})`
        );
      });
    }
    console.log();

    // Example 2: Query with filters
    console.log("Example 2: Query with filters");
    console.log("-".repeat(50));
    const filteredResponse = await client.query({
      query: "Explain inheritance in programming",
      storeId: "your_store_id", // Optional
      model: "brainusai-thinking", // Optional
      filters: {
        subject: "ICT",
        grade: "12",
      },
    });
    console.log(`Answer: ${filteredResponse.answer.substring(0, 200)}...\n`);

    // Example 3: Get usage statistics
    console.log("Example 3: Usage statistics");
    console.log("-".repeat(50));
    const stats = await client.getUsage();
    console.log(`Total requests: ${stats.totalRequests}`);
    console.log(`Quota used: ${stats.quotaPercentage}%`);
    if (stats.quotaRemaining) {
      console.log(`Quota remaining: ${stats.quotaRemaining}`);
    }
    console.log();

    // Example 4: Get available plans
    console.log("Example 4: Available plans");
    console.log("-".repeat(50));
    const plans = await client.getPlans();
    plans.forEach((plan) => {
      console.log(`${plan.name}:`);
      console.log(`  Rate limit: ${plan.rateLimitPerMinute} req/min`);
      console.log(`  Monthly quota: ${plan.monthlyQuota || "Unlimited"}`);
      console.log(`  Price: LKR ${plan.priceLkr || 0}/month`);
      console.log(`  Allowed models: ${plan.allowedModels.join(", ")}`);
    });
    console.log();
  } catch (error) {
    if (error instanceof AuthenticationError) {
      console.error("Authentication error:", error.message);
    } else if (error instanceof RateLimitError) {
      console.error("Rate limit error:", error.message);
      if (error.retryAfter) {
        console.error(`Retry after ${error.retryAfter} seconds`);
      }
    } else {
      console.error("Error:", error);
    }
  }
}

main();












