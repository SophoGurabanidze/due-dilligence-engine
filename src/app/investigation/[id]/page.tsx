"use client";

import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { IdentityCard } from "@/components/identity-card";
import { AgentProgressPanel } from "@/components/agent-progress";
import { ScoreCard } from "@/components/score-card";
import { RedFlagsList } from "@/components/red-flags";
import { FindingsList } from "@/components/findings-list";
import { Loader2, AlertCircle } from "lucide-react";

export default function InvestigationPage() {
  const params = useParams();
  const id = params.id as Id<"investigations">;

  const investigation = useQuery(api.investigations.get, { id });
  const findings = useQuery(api.findings.getByInvestigation, {
    investigationId: id,
  });
  const report = useQuery(api.reports.getByInvestigation, {
    investigationId: id,
  });

  if (!investigation) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isResearching =
    investigation.status === "pending" ||
    investigation.status === "researching" ||
    investigation.status === "analyzing";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">{investigation.companyName}</h1>
        <p className="mt-1 text-muted-foreground">
          Investigation started{" "}
          {new Date(investigation.createdAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {investigation.status === "failed" && (
        <div className="flex items-center gap-3 rounded-xl border border-destructive/50 bg-destructive/10 p-4">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <div>
            <p className="font-medium text-destructive">Investigation Failed</p>
            {investigation.error && (
              <p className="text-sm text-destructive/80">{investigation.error}</p>
            )}
          </div>
        </div>
      )}

      {investigation.identity && (
        <IdentityCard identity={investigation.identity} />
      )}

      {isResearching && (
        <AgentProgressPanel agentStatuses={investigation.agentStatuses} />
      )}

      {report && (
        <>
          <ScoreCard
            overallScore={report.overallScore}
            scores={report.scores}
          />
          <RedFlagsList redFlags={report.redFlags} findings={findings ?? []} />
        </>
      )}

      {investigation.status === "analyzing" && !report && (
        <div className="flex items-center gap-3 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4">
          <Loader2 className="h-5 w-5 animate-spin text-yellow-400" />
          <p className="text-yellow-200">
            Analyzing findings and generating investment report...
          </p>
        </div>
      )}

      {findings && findings.length > 0 && (
        <FindingsList findings={findings} />
      )}

      {report?.summary && (
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-3 text-xl font-bold">Executive Summary</h2>
          <p className="whitespace-pre-wrap leading-relaxed text-muted-foreground">
            {report.summary}
          </p>
        </div>
      )}
    </div>
  );
}
