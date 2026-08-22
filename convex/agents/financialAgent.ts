import { askAIJson } from "./ai";
import { AgentContext, Finding, formatIdentityBrief } from "./types";

interface SECFiling {
  companyName: string;
  formType: string;
  dateFiled: string;
  primaryDocument: string;
  accessionNumber: string;
}

async function searchSEC(companyName: string): Promise<SECFiling[]> {
  const searchUrl = `https://efts.sec.gov/LATEST/search-index?q=%22${encodeURIComponent(companyName)}%22&dateRange=custom&startdt=2022-01-01&forms=10-K,10-Q`;

  try {
    const fullTextRes = await fetch(
      `https://efts.sec.gov/LATEST/search-index?q=%22${encodeURIComponent(companyName)}%22&forms=10-K,10-Q&dateRange=custom&startdt=2022-01-01`,
      { headers: { "User-Agent": "DueDiligenceEngine research@example.com" } }
    );

    const companySearchRes = await fetch(
      `https://efts.sec.gov/LATEST/search-index?company=${encodeURIComponent(companyName)}&forms=10-K,10-Q`,
      { headers: { "User-Agent": "DueDiligenceEngine research@example.com" } }
    );

    const edgarRes = await fetch(
      `https://www.sec.gov/cgi-bin/browse-edgar?company=${encodeURIComponent(companyName)}&CIK=&type=10-K&dateb=&owner=include&count=5&search_text=&action=getcompany`,
      { headers: { "User-Agent": "DueDiligenceEngine research@example.com" } }
    );

    const eftsRes = await fetch(
      `https://efts.sec.gov/LATEST/search-index?q=%22${encodeURIComponent(companyName)}%22&forms=10-K,10-Q`,
      { headers: { "User-Agent": "DueDiligenceEngine research@example.com" } }
    );

    if (eftsRes.ok) {
      const data = await eftsRes.json();
      if (data.hits?.hits?.length > 0) {
        return data.hits.hits.slice(0, 5).map((hit: any) => ({
          companyName: hit._source?.display_names?.[0] ?? companyName,
          formType: hit._source?.form_type ?? "10-K",
          dateFiled: hit._source?.file_date ?? "",
          primaryDocument: hit._source?.file_name ?? "",
          accessionNumber: hit._source?.accession_no ?? "",
        }));
      }
    }
  } catch {
    // SEC APIs may be unavailable; continue with AI analysis
  }

  return [];
}

export async function runFinancialAgent(ctx: AgentContext): Promise<Finding[]> {
  const filings = await searchSEC(ctx.companyName);

  const prompt = filings.length > 0
    ? `Analyze these SEC filings for "${ctx.companyName}" and extract financial health findings:\n\n${JSON.stringify(filings, null, 2)}`
    : `No SEC filings found for "${ctx.companyName}". This likely means it's a private company. Provide what financial analysis observations you can based on the company name and any publicly known information. Note the limitation that no public financial data was found.`;

  const extracted = await askAIJson<
    Array<{
      title: string;
      content: string;
      category: string;
      confidence: number;
    }>
  >([
    {
      role: "system",
      content: `You are a financial analyst performing due diligence.

${formatIdentityBrief(ctx.identity)}

Extract financial findings. Each finding:
- title: short headline
- content: 1-2 sentences
- category: one of "revenue", "profitability", "debt", "cash_flow", "growth", "risk_factors", "accounting"
- confidence: 0-1

No SEC filing does not mean the company is fake; it usually means private. Use only funding/financial facts for THIS entity. Return JSON: {"findings":[...]} with at most 5 findings.`,
    },
    { role: "user", content: prompt },
  ]);

  return extracted.map((e) => ({
    investigationId: ctx.investigationId,
    source: "financial" as const,
    category: e.category,
    title: e.title,
    content: e.content,
    sourceUrl: filings.length > 0
      ? `https://www.sec.gov/cgi-bin/browse-edgar?company=${encodeURIComponent(ctx.companyName)}&CIK=&type=10-K&dateb=&owner=include&count=5&search_text=&action=getcompany`
      : undefined,
    sourceLabel: filings.length > 0 ? "SEC EDGAR" : "AI Analysis (no public filings found)",
    confidence: e.confidence,
  }));
}
