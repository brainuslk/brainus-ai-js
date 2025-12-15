# BrainUs AI SDK - Examples

Simple examples showing how to query the BrainUs AI API with the SDK.

## Examples

### 1. Node.js (Direct SDK Usage)

File: [`nodejs-query.ts`](./nodejs-query.ts)

Basic usage of the SDK in Node.js:

```typescript
import { BrainusAI } from "@brainus/ai";

const client = new BrainusAI({
  apiKey: process.env.BRAINUS_API_KEY!,
});

const result = await client.query({
  query: "What is Object-Oriented Programming?",
});

console.log(result.answer);
```

### 2. Next.js App Router

File: [`nextjs-query.ts`](./nextjs-query.ts)

API route and client component for Next.js:

```typescript
// API Route
const client = new BrainusAI({ apiKey: process.env.BRAINUS_API_KEY! });

export async function POST(request: NextRequest) {
  const { query } = await request.json();
  const result = await client.query({ query });
  return NextResponse.json(result);
}
```

### 3. Express.js

File: [`express-query.ts`](./express-query.ts)

Simple Express server with query endpoint:

```typescript
const client = new BrainusAI({ apiKey: process.env.BRAINUS_API_KEY! });

app.post("/api/query", async (req, res) => {
  const result = await client.query({ query: req.body.query });
  res.json(result);
});
```

### 4. React

File: [`react-query.tsx`](./react-query.tsx)

React component with query functionality:

```typescript
const [result, setResult] = useState(null);

const handleQuery = async () => {
  const response = await fetch("/api/query", {
    method: "POST",
    body: JSON.stringify({ query }),
  });
  const data = await response.json();
  setResult(data);
};
```

## Running Examples

1. Set your API key:

```bash
export BRAINUS_API_KEY="brainus_..."
```

2. Run an example:

```bash
npx tsx examples/nodejs-query.ts
```

## Query Options

All examples support these options:

```typescript
await client.query({
  query: "Your question here",
  storeId: "your_store_id", // Optional
  filters: {
    // Optional
    subject: "ICT",
    grade: "12",
    language: "English",
  },
  model: "gemini-2.5-flash", // Optional
});
```

## Learn More

- [Full Documentation](https://developers.brainus.lk/docs/sdks/javascript)
- [Get API Key](https://developers.brainus.lk/dashboard/keys)
- [GitHub Repository](https://github.com/brainuslk/brainus-ai-js)
