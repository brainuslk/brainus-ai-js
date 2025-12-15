/**
 * Express.js - Query Example
 *
 * WHY CREATE AN ENDPOINT?
 * Only if you're building an API for clients (browser/mobile apps).
 * If you're just running server-side scripts, use nodejs-query.ts instead!
 */

import express from "express";
import { BrainusAI } from "@brainus/ai";

const app = express();
app.use(express.json());

const client = new BrainusAI({
  apiKey: process.env.BRAINUS_API_KEY!, // Secret - stays on server
});

// API endpoint for client apps to call
app.post("/api/query", async (req, res) => {
  try {
    const { query, storeId, filters } = req.body;

    const result = await client.query({
      query,
      storeId,
      filters,
    });

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});

// ============================================
// Example Client Request
// ============================================

async function exampleQuery() {
  const response = await fetch("http://localhost:3000/api/query", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: "What is Object-Oriented Programming?",
      filters: { subject: "ICT", grade: "12" },
    }),
  });

  const data = await response.json();
  console.log("Answer:", data.answer);
  console.log("Citations:", data.citations);
}
