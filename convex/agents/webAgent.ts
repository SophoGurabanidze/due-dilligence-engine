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
      search_depth: "basic",
    }),
  });

  if (!res.ok) return [];
  const data = await res.json();
  return data.results ?? [];
}

export async function runWebAgent(ctx: AgentContext): Promise<Finding[]> {
  const target = ctx.identity?.canonicalName || ctx.companyName;
  const productHint = ctx.identity?.products?.[0];
  const queries = [
    `"${target}" latest news${productHint ? ` ${productHint}` : ""}`,
    `"${target}" funding investment`,
    `"${target}" customers deployment controversy`,
  ];

  const allResults: TavilyResult[] = [];
  for (const q of queries) {
    const results = await searchTavily(q);
    allResults.push(...results);
  }

  if (allResults.length === 0) return [];

  const unique = allResults.filter(
    (r, i, arr) => arr.findIndex((x) => x.url === r.url) === i
  ).slice(0, 8);

  const summaryInput = unique
    .map((r, i) => `[${i}] ${r.title}\nURL: ${r.url}\n${r.content.slice(0, 400)}`)
    .join("\n\n---\n\n");

  const extracted = await askAIJson<
    Array<{
      title: string;
      content: string;
      category: string;
      sourceIndex: number;
      confidence: number;
    }>
  >([
    {
      role: "system",
      content: `You are an investment due diligence analyst for one specific company.

${formatIdentityBrief(ctx.identity)}

Extract at most 5 key findings from web search results. Each finding:
- title: short headline
- content: 1-2 sentences relevant to an investment decision
- category: one of "news", "reputation", "growth", "controversy", "partnerships"
- sourceIndex: which source it came from (index number)
- confidence: 0-1

Discard any result that is about a confusable/lookalike company. Return JSON: {"findings":[...]}.`,
    },
    { role: "user", content: summaryInput },
  ]);

  return extracted.map((e) => {
    const src = unique[e.sourceIndex] ?? unique[0];
    return {
      investigationId: ctx.investigationId,
      source: "web" as const,
      category: e.category,
      title: e.title,
      content: e.content,
      sourceUrl: src?.url,
      sourceLabel: src?.title ?? "Web Search",
      confidence: e.confidence,
    };
  });
}
