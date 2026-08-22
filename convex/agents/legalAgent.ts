import { askAIJson } from "./ai";
import { AgentContext, Finding, formatIdentityBrief } from "./types";

interface CourtCase {
  caseName: string;
  court: string;
  dateFiled: string;
  docketNumber: string;
  absoluteUrl: string;
}

async function searchCourtListener(companyName: string): Promise<CourtCase[]> {
  try {
    const res = await fetch(
      `https://www.courtlistener.com/api/rest/v4/search/?q=%22${encodeURIComponent(companyName)}%22&type=o&order_by=score+desc`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!res.ok) return [];

    const data = await res.json();
    if (!data.results?.length) return [];

    return data.results.slice(0, 10).map((r: any) => ({
      caseName: r.caseName ?? r.case_name ?? "Unknown Case",
      court: r.court ?? "",
      dateFiled: r.dateFiled ?? r.date_filed ?? "",
      docketNumber: r.docketNumber ?? r.docket_number ?? "",
      absoluteUrl: r.absolute_url
        ? `https://www.courtlistener.com${r.absolute_url}`
        : "",
    }));
  } catch {
    return [];
  }
}

export async function runLegalAgent(ctx: AgentContext): Promise<Finding[]> {
  const cases = await searchCourtListener(ctx.companyName);

  const prompt = cases.length > 0
    ? `Analyze these court cases. Keep only cases that clearly belong to the TARGET entity:\n\n${JSON.stringify(cases, null, 2)}`
    : `No US federal court cases found for "${ctx.companyName}". This is a limited screen (CourtListener / US federal only). It is NOT evidence of a clean legal history, especially if HQ is outside the US.`;

  const extracted = await askAIJson<
    Array<{
      title: string;
      content: string;
      category: string;
      caseIndex?: number;
      confidence: number;
    }>
  >([
    {
      role: "system",
      content: `You are a legal analyst performing due diligence.

${formatIdentityBrief(ctx.identity)}

Each finding:
- title: short headline
- content: 1-2 sentences
- category: one of "litigation", "regulatory", "ip_disputes", "labor", "compliance", "coverage_gap"
- caseIndex: which case it references (if any)
- confidence: 0-1

Never convert "no US federal hits" into "no legal issues". Call out remaining jurisdictions (China, HK, Japan, Korea, EU, UK, state courts, IP, sanctions). Discard lookalike-company cases. Return JSON: {"findings":[...]} with at most 5 findings.`,
    },
    { role: "user", content: prompt },
  ]);

  return extracted.map((e) => {
    const caseRef = e.caseIndex !== undefined ? cases[e.caseIndex] : undefined;
    return {
      investigationId: ctx.investigationId,
      source: "legal" as const,
      category: e.category,
      title: e.title,
      content: e.content,
      sourceUrl: caseRef?.absoluteUrl,
      sourceLabel: caseRef ? `CourtListener: ${caseRef.caseName}` : "Legal Analysis",
      confidence: e.confidence,
    };
  });
}
