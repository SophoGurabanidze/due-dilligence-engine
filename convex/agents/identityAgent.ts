import { askAIJson } from "./ai";
import { AgentContext, CompanyIdentity, Finding } from "./types";

interface TavilyResult {
  title: string;
  url: string;
  content: string;
}

interface IdentityFinding {
  title: string;
  content: string;
  sourceIndex?: number;
  confidence: number;
}

interface IdentityResponse extends CompanyIdentity {
  findings?: IdentityFinding[];
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
      max_results: 6,
      include_answer: false,
      search_depth: "advanced",
    }),
  });

  if (!res.ok) return [];
  const data = await res.json();
  return data.results ?? [];
}

export async function resolveIdentity(
  ctx: AgentContext
): Promise<{ identity: CompanyIdentity; findings: Finding[] }> {
  const queries = [
    `"${ctx.companyName}" official website founders headquarters legal name`,
    `"${ctx.companyName}" company registration entity subsidiaries`,
    `"${ctx.companyName}" robotics OR logistics OR AI company`,
    `"${ctx.companyName}" Inc OR Ltd different company same name`,
  ];

  const allResults: TavilyResult[] = [];
  for (const q of queries) {
    allResults.push(...(await searchTavily(q)));
  }

  const unique = allResults
    .filter((r, i, arr) => arr.findIndex((x) => x.url === r.url) === i)
    .slice(0, 12);

  const sourceText = unique.length
    ? unique
        .map((r, i) => `[${i}] ${r.title}\nURL: ${r.url}\n${r.content.slice(0, 500)}`)
        .join("\n\n---\n\n")
    : `No search results. Still return a conservative identity object.`;

  const resolvedRaw = await askAIJson<IdentityResponse | IdentityFinding[]>([
    {
      role: "system",
      content: `You resolve company identity for investment due diligence on "${ctx.companyName}".

Your job is entity resolution, not scoring. Identify the most likely operating company matching the query, list legal names/aliases, people, products, and OTHER companies with the same or similar name that must not be mixed in.

Rules:
- Prefer the company that matches the user's query most specifically (products, HQ, industry).
- If several unrelated companies share the name, pick the best-fit target and list the others under confusableEntities.
- Do not say a company is a placeholder just because US/UK registries are empty. Chinese, HK, Korean, German, Japanese entities count.
- Do not invent registration numbers. Leave fields empty if unknown.
- Keep strings short.

Return JSON:
{
  "canonicalName": "string",
  "aliases": ["string"],
  "headquarters": "string",
  "products": ["string"],
  "legalEntities": [{"name":"string","jurisdiction":"string","registrationNumber":"string","status":"string"}],
  "people": [{"name":"string","role":"string"}],
  "confusableEntities": [{"name":"string","distinction":"string"}],
  "notes": "1-3 sentences on which entity was selected and why",
  "confidence": 0-1,
  "findings": [{"title":"string","content":"string","sourceIndex":0,"confidence":0-1}]
}
Max 4 findings. Findings should cover identity, people, legal entities, and confusable lookalikes.`,
    },
    { role: "user", content: sourceText },
  ]);

  const fallbackIdentity: IdentityResponse = {
    canonicalName: ctx.companyName,
    aliases: [],
    products: [],
    legalEntities: [],
    people: [],
    confusableEntities: [],
    notes: "Identity could not be parsed; treat as unresolved.",
    confidence: 0.2,
  };

  const resolved: IdentityResponse = Array.isArray(resolvedRaw)
    ? {
        ...fallbackIdentity,
        notes: "Identity model returned findings only; treat as unresolved.",
        confidence: 0.3,
        findings: resolvedRaw,
      }
    : (resolvedRaw ?? fallbackIdentity);

  const identity: CompanyIdentity = {
    canonicalName: resolved.canonicalName || ctx.companyName,
    aliases: resolved.aliases ?? [],
    headquarters: resolved.headquarters,
    products: resolved.products ?? [],
    legalEntities: resolved.legalEntities ?? [],
    people: resolved.people ?? [],
    confusableEntities: resolved.confusableEntities ?? [],
    notes: resolved.notes || "",
    confidence: resolved.confidence ?? 0.5,
  };

  const findings: Finding[] = (resolved.findings ?? []).map((e) => {
    const src = e.sourceIndex !== undefined ? unique[e.sourceIndex] : undefined;
    return {
      investigationId: ctx.investigationId,
      source: "identity" as const,
      category: "entity_resolution",
      title: e.title,
      content: e.content,
      sourceUrl: src?.url,
      sourceLabel: src?.title ?? "Identity resolution",
      confidence: e.confidence,
    };
  });

  return { identity, findings };
}
