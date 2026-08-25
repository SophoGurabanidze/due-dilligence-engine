"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { IdentityCard } from "@/components/identity-card";
import { AgentProgressPanel } from "@/components/agent-progress";
import { ScoreCard } from "@/components/score-card";
import { RedFlagsList } from "@/components/red-flags";
import { FindingsList } from "@/components/findings-list";
import { Loader2, AlertCircle, Copy, Check, RotateCcw } from "lucide-react";

export default function InvestigationPage() {
  const params = useParams();
  const id = params.id as Id<"investigations">;
  const [isRetrying, setIsRetrying] = useState(false);
  const [copied, setCopied] = useState(false);

  const investigation = useQuery(api.investigations.get, { id });
  const findings = useQuery(api.findings.getByInvestigation, {
    investigationId: id,
  });
  const report = useQuery(api.reports.getByInvestigation, {
    investigationId: id,
  });
  const runInvestigation = useAction(api.orchestrator.runInvestigation);
  const resetForRetry = useMutation(api.investigations.resetForRetry);
  const deleteFindings = useMutation(api.findings.deleteByInvestigation);
  const deleteReports = useMutation(api.reports.deleteByInvestigation);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await deleteReports({ investigationId: id });
      await deleteFindings({ investigationId: id });
      await resetForRetry({ id });
      await runInvestigation({ investigationId: id });
    } catch (err) {
      console.error(err);
      setIsRetrying(false);
    }
  };

  const handleCopySummary = async () => {
    if (!report?.summary) return;
    await navigator.clipboard.writeText(report.summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
      <div className="flex flex-wrap items-start justify-between gap-4">
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
        {(investigation.status === "failed" ||
          investigation.status === "complete") && (
          <button
            type="button"
            onClick={handleRetry}
            disabled={isRetrying}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-secondary px-4 py-2 text-sm font-medium transition-colors hover:border-primary/50 disabled:opacity-50"
          >
            <RotateCcw className={`h-4 w-4 ${isRetrying ? "animate-spin" : ""}`} />
            {isRetrying ? "Retrying..." : "Retry investigation"}
          </button>
        )}
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
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold">Executive Summary</h2>
            <button
              type="button"
              onClick={handleCopySummary}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-score-excellent" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <p className="whitespace-pre-wrap leading-relaxed text-muted-foreground">
            {report.summary}
          </p>
        </div>
      )}
    </div>
  );
}
