/**
 * Next.js - Query Example
 *
 * WHY USE AN API ROUTE?
 * Your BRAINUS_API_KEY must stay secret on the server.
 * Never expose it in client-side code!
 *
 * API Route = Server-side (safe) → Client calls this endpoint
 */

import { BrainusAI } from "@brainus/ai";
import { NextRequest, NextResponse } from "next/server";

// ============================================
// API Route: app/api/query/route.ts
// (SERVER-SIDE - Protects your API key)
// ============================================

const client = new BrainusAI({
  apiKey: process.env.BRAINUS_API_KEY!, // Secret - stays on server
});

export async function POST(request: NextRequest) {
  try {
    const { query, storeId, filters } = await request.json();

    const result = await client.query({
      query,
      storeId,
      filters,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ============================================
// Client Component: app/components/QueryForm.tsx
// ============================================

("use client");

import { useState } from "react";

export function QueryForm() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      const data = await response.json();
      setResult(data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask a question..."
        />
        <button type="submit" disabled={loading}>
          {loading ? "Loading..." : "Ask"}
        </button>
      </form>

      {result?.answer && (
        <div>
          <h3>Answer:</h3>
          <p>{result.answer}</p>

          {result.hasCitations && (
            <div>
              <h4>Sources:</h4>
              <ul>
                {result.citations.map((c: any) => (
                  <li key={c.documentId}>
                    {c.documentName} (Pages: {c.pages.join(", ")})
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
