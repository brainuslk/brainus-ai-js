/**
 * Node.js - Direct SDK Usage
 *
 * USE THIS WHEN:
 * - Running server-side scripts
 * - Building CLI tools
 * - Backend automation
 *
 * NO API ENDPOINT NEEDED - Just use the SDK directly!
 */

import { BrainusAI } from "@brainus/ai";

const client = new BrainusAI({
  apiKey: process.env.BRAINUS_API_KEY!,
});

// ============================================
// Basic Query - Direct SDK call
// ============================================

async function basicQuery() {
  const result = await client.query({
    query: "What is Object-Oriented Programming?",
  });

  console.log(result.answer);
  console.log(result.citations);
}

// ============================================
// Query with Store ID
// ============================================

async function queryWithStore() {
  const result = await client.query({
    query: "Explain inheritance in programming",
    storeId: "your_store_id",
  });

  console.log(result.answer);
}

// ============================================
// Query with Filters
// ============================================

async function queryWithFilters() {
  const result = await client.query({
    query: "What is photosynthesis?",
    filters: {
      subject: "science",
      grade: "10",
      language: "english",
    },
  });

  console.log(result.answer);

  if (result.hasCitations) {
    result.citations.forEach((citation) => {
      console.log(
        `- ${citation.documentName} (Pages: ${citation.pages.join(", ")})`
      );
    });
  }
}

// ============================================
// Query with Model Selection
// ============================================

async function queryWithModel() {
  const result = await client.query({
    query: "Explain DNA structure",
    model: "gemini-2.5-flash",
    filters: {
      subject: "biology",
    },
  });

  console.log(result.answer);
}

// Run examples
async function main() {
  try {
    await basicQuery();
    // await queryWithStore();
    // await queryWithFilters();
    // await queryWithModel();
  } catch (error) {
    console.error("Error:", error);
  }
}

main();
