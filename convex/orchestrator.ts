"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { runWebAgent } from "./agents/webAgent";
import { runFinancialAgent } from "./agents/financialAgent";
import { runLegalAgent } from "./agents/legalAgent";
import { runCompanyAgent } from "./agents/companyAgent";
import { runMarketAgent } from "./agents/marketAgent";
import { runDataroomAgent } from "./agents/dataroomAgent";
import { resolveIdentity } from "./agents/identityAgent";
import { analyzeAndScore } from "./agents/analyzer";
import { Id } from "./_generated/dataModel";
import { AgentContext, CompanyIdentity, Finding } from "./agents/types";

export const runInvestigation = action({
  args: { investigationId: v.id("investigations") },
  handler: async (ctx, args) => {
    const investigation = await ctx.runQuery(api.investigations.get, {
      id: args.investigationId,
    });
    if (!investigation) throw new Error("Investigation not found");

    await ctx.runMutation(api.investigations.updateStatus, {
      id: args.investigationId,
      status: "researching",
    });

    let identity: CompanyIdentity | undefined;
    await ctx.runMutation(api.investigations.updateAgentStatus, {
      id: args.investigationId,
      agent: "identity",
      status: "running",
    });
    try {
      const resolved = await resolveIdentity({
        investigationId: args.investigationId,
        companyName: investigation.companyName,
      });
      identity = resolved.identity;
      await ctx.runMutation(api.investigations.setIdentity, {
        id: args.investigationId,
        identity,
      });
      if (resolved.findings.length > 0) {
        await ctx.runMutation(api.findings.createMany, {
          findings: resolved.findings,
        });
      }
      await ctx.runMutation(api.investigations.updateAgentStatus, {
        id: args.investigationId,
        agent: "identity",
        status: "complete",
      });
    } catch (error) {
      console.error("Identity agent failed:", error);
      await ctx.runMutation(api.investigations.updateAgentStatus, {
        id: args.investigationId,
        agent: "identity",
        status: "failed",
      });
    }

    const agentCtx: AgentContext = {
      investigationId: args.investigationId,
      companyName: investigation.companyName,
      identity,
    };

    const agents = [
      { name: "web" as const, fn: () => runWebAgent(agentCtx) },
      { name: "financial" as const, fn: () => runFinancialAgent(agentCtx) },
      { name: "legal" as const, fn: () => runLegalAgent(agentCtx) },
      { name: "company" as const, fn: () => runCompanyAgent(agentCtx) },
      { name: "market" as const, fn: () => runMarketAgent(agentCtx) },
      {
        name: "dataroom" as const,
        fn: async () => {
          const files = await ctx.runQuery(
            api.dataRoomFiles.getByInvestigation,
            { investigationId: args.investigationId }
          );
          const docs = files
            .filter((f) => f.extractedText)
            .map((f) => ({
              fileName: f.fileName,
              extractedText: f.extractedText!,
            }));
          return runDataroomAgent(agentCtx, docs);
        },
      },
    ];

    const allFindings: Finding[] = [];

    const results = await Promise.allSettled(
      agents.map(async (agent) => {
        await ctx.runMutation(api.investigations.updateAgentStatus, {
          id: args.investigationId,
          agent: agent.name,
          status: "running",
        });

        try {
          const findings = await agent.fn();
          if (findings.length > 0) {
            await ctx.runMutation(api.findings.createMany, { findings });
          }
          await ctx.runMutation(api.investigations.updateAgentStatus, {
            id: args.investigationId,
            agent: agent.name,
            status: "complete",
          });
          return findings;
        } catch (error) {
          await ctx.runMutation(api.investigations.updateAgentStatus, {
            id: args.investigationId,
            agent: agent.name,
            status: "failed",
          });
          console.error(`Agent ${agent.name} failed:`, error);
          return [];
        }
      })
    );

    for (const result of results) {
      if (result.status === "fulfilled") {
        allFindings.push(...result.value);
      }
    }

    await ctx.runMutation(api.investigations.updateStatus, {
      id: args.investigationId,
      status: "analyzing",
    });

    try {
      const storedFindings = await ctx.runQuery(
        api.findings.getByInvestigation,
        { investigationId: args.investigationId }
      );

      const latest = await ctx.runQuery(api.investigations.get, {
        id: args.investigationId,
      });

      const report = await analyzeAndScore(
        investigation.companyName,
        storedFindings,
        latest?.identity
      );

      await ctx.runMutation(api.reports.create, {
        investigationId: args.investigationId,
        overallScore: report.overallScore,
        scores: report.scores,
        redFlags: report.redFlags.map((rf) => ({
          claim: rf.claim,
          severity: rf.severity,
          findingIds: rf.findingIds as Id<"findings">[],
        })),
        summary: report.summary,
      });

      await ctx.runMutation(api.investigations.updateStatus, {
        id: args.investigationId,
        status: "complete",
      });
    } catch (error) {
      console.error("Analysis failed:", error);
      await ctx.runMutation(api.investigations.updateStatus, {
        id: args.investigationId,
        status: "failed",
        error: error instanceof Error ? error.message : "Analysis failed",
      });
    }
  },
});
