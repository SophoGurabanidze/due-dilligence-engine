import { askAIJson } from "./ai";
import { AgentContext, Finding, formatIdentityBrief } from "./types";

export async function runDataroomAgent(
  ctx: AgentContext,
  documents: Array<{ fileName: string; extractedText: string }>
): Promise<Finding[]> {
  if (documents.length === 0) return [];

  const docSummary = documents
    .map((d, i) => `[Document ${i}] ${d.fileName}\n${d.extractedText.slice(0, 3000)}`)
    .join("\n\n===\n\n");

  const extracted = await askAIJson<
    Array<{
      title: string;
      content: string;
      category: string;
      documentIndex: number;
      confidence: number;
    }>
  >([
    {
      role: "system",
      content: `You are a due diligence analyst reviewing data room documents.

${formatIdentityBrief(ctx.identity)}

Extract key findings. Each finding:
- title: short headline
- content: 1-2 sentences
- category: one of "financial_data", "contracts", "ip", "hr", "operations", "compliance", "risk"
- documentIndex: which document it came from
- confidence: 0-1

Return JSON: {"findings":[...]} with at most 5 findings.`,
    },
    { role: "user", content: docSummary },
  ]);

  return extracted.map((e) => {
    const doc = documents[e.documentIndex];
    return {
      investigationId: ctx.investigationId,
      source: "dataroom" as const,
      category: e.category,
      title: e.title,
      content: e.content,
      sourceLabel: doc ? `Data Room: ${doc.fileName}` : "Data Room Document",
      confidence: e.confidence,
    };
  });
}
