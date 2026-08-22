import { askAIJson } from "./ai";
import { AgentContext, Finding, formatIdentityBrief } from "./types";

interface TavilyResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

async function searchTavily(query: string): Promise<TavilyResult[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) return [];

  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      max_results: 5,
      include_answer: false,
      search_depth: "advanced",
    }),
  });

  if (!res.ok) return [];
  const data = await res.json();
  return data.results ?? [];
}

export async function runMarketAgent(ctx: AgentContext): Promise<Finding[]> {
  const target = ctx.identity?.canonicalName || ctx.companyName;
  const queries = [
    `"${target}" competitors market share industry`,
    `"${target}" market size TAM warehouse robotics logistics`,
  ];

  const allResults: TavilyResult[] = [];
  for (const q of queries) {
    const results = await searchTavily(q);
    allResults.push(...results);
  }

  const unique = allResults
    .filter((r, i, arr) => arr.findIndex((x) => x.url === r.url) === i)
    .slice(0, 8);

  const input = unique.length > 0
    ? unique
        .map((r, i) => `[${i}] ${r.title}\nURL: ${r.url}\n${r.content.slice(0, 400)}`)
        .join("\n\n---\n\n")
    : `No specific market data found for "${ctx.companyName}". Provide market analysis based on the company name and likely industry.`;

  const extracted = await askAIJson<
    Array<{
      title: string;
      content: string;
      category: string;
      sourceIndex?: number;
      confidence: number;
    }>
  >([
    {
      role: "system",
      content: `You are a market analyst performing competitive due diligence.

${formatIdentityBrief(ctx.identity)}

Extract at most 5 findings. Each finding:
- title: short headline
- content: 1-2 sentences
- category: one of "market_size", "competitors", "market_position", "trends", "barriers", "customer_concentration"
- sourceIndex: which source it references (if any)
- confidence: 0-1

Do not attribute TAM/CAGR to this company unless the source names the market definition. Discard lookalike-company evidence. Return JSON: {"findings":[...]}.`,
    },
    { role: "user", content: input },
  ]);

  return extracted.map((e) => {
    const src =
      e.sourceIndex !== undefined ? unique[e.sourceIndex] : undefined;
    return {
      investigationId: ctx.investigationId,
      source: "market" as const,
      category: e.category,
      title: e.title,
      content: e.content,
      sourceUrl: src?.url,
      sourceLabel: src?.title ?? "Market Analysis",
      confidence: e.confidence,
    };
  });
}
