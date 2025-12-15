/**
 * React - Client-Side Query Example
 *
 * IMPORTANT: Never use the SDK directly in React!
 * Your API key would be exposed in the browser.
 *
 * Instead: Call your API endpoint (Next.js/Express) from the client
 */

import { useState } from "react";

// ============================================
// Query Component - Calls your API endpoint
// ============================================

function QueryComponent() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleQuery = async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Ask anything..."
      />
      <button onClick={handleQuery} disabled={loading}>
        {loading ? "Loading..." : "Ask"}
      </button>

      {result && (
        <div>
          <p>{result.answer}</p>
          {result.hasCitations &&
            result.citations.map((c: any) => (
              <div key={c.documentId}>
                {c.documentName} - Pages: {c.pages.join(", ")}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// With Filters Example
// ============================================

function QueryWithFilters() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleQuery = async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          filters: {
            subject: "ICT",
            grade: "12",
          },
        }),
      });

      const data = await response.json();
      setResult(data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Ask about ICT Grade 12..."
      />
      <button onClick={handleQuery} disabled={loading}>
        Ask
      </button>

      {result?.answer && <p>{result.answer}</p>}
    </div>
  );
}

export default QueryComponent;
