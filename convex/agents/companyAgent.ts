import { askAIJson } from "./ai";
import { AgentContext, Finding, formatIdentityBrief } from "./types";

interface OpenCorpCompany {
  name: string;
  company_number: string;
  jurisdiction_code: string;
  incorporation_date: string;
  dissolution_date: string | null;
  company_type: string;
  registry_url: string;
  current_status: string;
  officers?: Array<{
    name: string;
    position: string;
    start_date: string;
    end_date: string | null;
  }>;
}

async function searchOpenCorporates(
  companyName: string
): Promise<OpenCorpCompany[]> {
  try {
    const res = await fetch(
      `https://api.opencorporates.com/v0.4/companies/search?q=${encodeURIComponent(companyName)}&format=json`,
      { headers: { "Content-Type": "application/json" } }
    );

    if (!res.ok) return [];

    const data = await res.json();
    const companies = data?.results?.companies ?? [];

    return companies.slice(0, 5).map((c: any) => {
      const co = c.company;
      return {
        name: co.name,
        company_number: co.company_number,
        jurisdiction_code: co.jurisdiction_code,
        incorporation_date: co.incorporation_date,
        dissolution_date: co.dissolution_date,
        company_type: co.company_type,
        registry_url: co.registry_url ?? co.opencorporates_url,
        current_status: co.current_status,
        officers: co.officers?.map((o: any) => ({
          name: o.officer?.name,
          position: o.officer?.position,
          start_date: o.officer?.start_date,
          end_date: o.officer?.end_date,
        })),
      };
    });
  } catch {
    return [];
  }
}

export async function runCompanyAgent(ctx: AgentContext): Promise<Finding[]> {
  const searchNames = [
    ctx.identity?.canonicalName || ctx.companyName,
    ...(ctx.identity?.aliases ?? []),
    ...(ctx.identity?.legalEntities.map((e) => e.name) ?? []),
  ].filter((name, i, arr) => name && arr.indexOf(name) === i).slice(0, 3);

  const companies = (
    await Promise.all(searchNames.map((name) => searchOpenCorporates(name)))
  ).flat();

  const prompt = companies.length > 0
    ? `Analyze this corporate registry data for the TARGET entity only:\n\n${JSON.stringify(companies, null, 2)}`
    : `OpenCorporates returned no records for "${ctx.companyName}". That is NOT proof the company has no legal identity. Use the identity brief. Note the coverage gap (OpenCorporates is weak on China/Korea local filings).`;

  const extracted = await askAIJson<
    Array<{
      title: string;
      content: string;
      category: string;
      companyIndex?: number;
      confidence: number;
    }>
  >([
    {
      role: "system",
      content: `You are a corporate analyst performing due diligence.

${formatIdentityBrief(ctx.identity)}

Extract findings about company structure, management, and history. Each finding:
- title: short headline
- content: 1-2 sentences
- category: one of "incorporation", "management", "structure", "history", "directors", "dissolution"
- companyIndex: which company record it references (if any)
- confidence: 0-1

Do not call the company a placeholder if people or legal entities are identified. Do not mix lookalike companies. Return JSON: {"findings":[...]} with at most 5 findings.`,
    },
    { role: "user", content: prompt },
  ]);

  return extracted.map((e) => {
    const companyRef =
      e.companyIndex !== undefined ? companies[e.companyIndex] : undefined;
    return {
      investigationId: ctx.investigationId,
      source: "company" as const,
      category: e.category,
      title: e.title,
      content: e.content,
      sourceUrl: companyRef?.registry_url,
      sourceLabel: companyRef
        ? `OpenCorporates: ${companyRef.name}`
        : "Company Analysis",
      confidence: e.confidence,
    };
  });
}
