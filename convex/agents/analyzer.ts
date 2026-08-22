import { askAIJson } from "./ai";
import { CompanyIdentity, formatIdentityBrief } from "./types";

interface StoredFinding {
  _id: string;
  source: string;
  category: string;
  title: string;
  content: string;
  sourceUrl?: string;
  sourceLabel: string;
  confidence: number;
}

interface AnalysisResult {
  overallScore: number;
  scores: {
    financial: number;
    management: number;
    market: number;
    legal: number;
    competitive: number;
  };
  redFlags: Array<{
    claim: string;
    severity: "critical" | "high" | "medium" | "low";
    findingIds: string[];
  }>;
  summary: string;
}

export async function analyzeAndScore(
  companyName: string,
  findings: StoredFinding[],
  identity?: CompanyIdentity
): Promise<AnalysisResult> {
  const findingsText = findings
    .map(
      (f, i) =>
        `[Finding ${i}, ID: ${f._id}, Source: ${f.source}/${f.category}]\nTitle: ${f.title}\n${f.content}\nSource: ${f.sourceLabel}\nConfidence: ${f.confidence}`
    )
    .join("\n\n---\n\n");

  const result = await askAIJson<AnalysisResult>([
    {
      role: "system",
      content: `You are a senior investment analyst producing a due diligence report for "${companyName}".

${formatIdentityBrief(identity)}

ENTITY RESOLUTION RULES (critical):
- If identity was resolved (legal names, HQ, founders, products), do NOT say the company is a placeholder, fake, or has no identifiable management.
- Missing OpenCorporates, SEC, or US federal court hits is a data-coverage gap, not proof of non-existence.
- Never mix products, customers, funding, or lawsuits from confusableEntities into this company's thesis.
- If a finding appears to belong to a lookalike company, discard it or flag it as possible entity contamination.
- Legal: a US federal-courts-only search is an incomplete screen. Do not write that legal history is clean. Say the screen was limited and remaining jurisdictions are unverified.
- Market TAM/CAGR figures must be attributed to a named source in the findings. If the source/definition is missing, treat the number as unverified and do not present it as fact.
- Prefer unanswered investment questions (revenue quality, cap table, burn, customer concentration, IP ownership, export controls) over "company may not exist".

Scoring 0-100 from evidence only:
- financial: Revenue health, profitability, debt, cash, accounting quality. Missing private-company financials should lower confidence, not invent distress.
- management: Team quality and track record IF identified. Do not score management near zero solely because a Western registry was empty.
- market: Market size/growth only when sourced. Attractive industry is not company traction.
- legal: Incomplete geographic coverage should cap this score; absence of US hits is not a high score.
- competitive: Position, moat, differentiation, concentration — using only this entity's products/customers.

Overall = financial 25% + management 20% + market 25% + legal 15% + competitive 15%.

RED FLAGS: inconsistencies, hidden risk, or entity contamination. Each must cite real finding IDs.
- critical / high / medium / low
- Max 5 red flags, one sentence each.
- If lookalike-company evidence was mixed in, that is a high red flag.

Write a 4-6 sentence executive summary that:
1. Names the resolved entity (legal name, HQ, founders if known)
2. States the real investment questions
3. Does not claim the company is unidentified if identity findings exist

Return JSON:
{
  "overallScore": number,
  "scores": { "financial": number, "management": number, "market": number, "legal": number, "competitive": number },
  "redFlags": [{ "claim": "string", "severity": "critical|high|medium|low", "findingIds": ["finding_id_1"] }],
  "summary": "string"
}`,
    },
    {
      role: "user",
      content: findings.length > 0
        ? `Here are all findings for ${companyName}:\n\n${findingsText}`
        : `No findings were gathered for ${companyName}. Produce a report noting the lack of available data, scoring conservatively, and flagging the data gap as a red flag. Do not invent a fake-company conclusion.`,
    },
  ]);

  return result;
}
