# AI Due Diligence Engine

AI-powered investment due diligence platform. Enter a company name and get a comprehensive, source-cited analysis with investment scores and red flags.

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment variables

Copy `.env.local` and fill in:

- **Convex**: Run `npx convex dev` to create a project and get your URL
- **Clerk**: Create a Clerk app at clerk.com, get publishable + secret keys
- **AI**: Set `OPENROUTER_API_KEY` (preferred), or `OPENAI_API_KEY` / `ANTHROPIC_API_KEY`. Optional: `OPENROUTER_MODEL` (defaults to `openai/gpt-4o`)
- **Tavily**: Get a free API key at tavily.com for web search

### 3. Configure Clerk + Convex

In your Clerk dashboard, create a JWT template for Convex. Set `CLERK_JWT_ISSUER_DOMAIN` in the Convex dashboard environment variables.

### 4. Run

```bash
npx convex dev   # starts Convex backend
npm run dev      # starts Next.js frontend
```

## Architecture

- **Next.js 14** (App Router) — frontend
- **Convex** — real-time backend, database, file storage
- **Clerk** — authentication
- **OpenRouter / OpenAI / Anthropic** — AI analysis with provider abstraction
- **Tavily** — web search
- **SEC EDGAR** — public financial filings
- **OpenCorporates** — company registry data
- **CourtListener** — federal court records

## CI

GitHub Actions runs typecheck and `next build` on every push to `main`.

CI uses placeholder Clerk/Convex public keys so the build does not need secrets. Live investigations still use keys on your Convex deployment, not GitHub.

1. User enters a company name
2. Six research agents run in parallel (web, financial, legal, company, market, data room)
3. Each agent fetches real data from external APIs
4. AI extracts structured findings with source citations
5. An analyzer scores the company across 5 dimensions and identifies red flags
6. Every red flag links to its supporting evidence, and every finding links to its original source
