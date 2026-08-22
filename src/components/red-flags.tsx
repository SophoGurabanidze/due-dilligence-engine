"use client";

import { useState } from "react";
import { AlertTriangle, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";

interface RedFlag {
  claim: string;
  severity: "critical" | "high" | "medium" | "low";
  findingIds: string[];
}

interface FindingRecord {
  _id: string;
  source: string;
  title: string;
  content: string;
  sourceUrl?: string;
  sourceLabel: string;
}

const severityConfig = {
  critical: { bg: "bg-red-500/10", border: "border-red-500/40", text: "text-red-400", label: "CRITICAL" },
  high: { bg: "bg-orange-500/10", border: "border-orange-500/40", text: "text-orange-400", label: "HIGH" },
  medium: { bg: "bg-yellow-500/10", border: "border-yellow-500/40", text: "text-yellow-400", label: "MEDIUM" },
  low: { bg: "bg-blue-500/10", border: "border-blue-500/40", text: "text-blue-400", label: "LOW" },
};

function RedFlagItem({
  flag,
  findings,
}: {
  flag: RedFlag;
  findings: FindingRecord[];
}) {
  const [expanded, setExpanded] = useState(false);
  const config = severityConfig[flag.severity];

  const relatedFindings = findings.filter((f) =>
    flag.findingIds.includes(f._id)
  );

  return (
    <div className={`rounded-lg border ${config.border} ${config.bg} p-4`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-start gap-3 text-left"
      >
        <AlertTriangle className={`mt-0.5 h-5 w-5 shrink-0 ${config.text}`} />
        <div className="flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span
              className={`rounded px-1.5 py-0.5 text-xs font-bold ${config.text} ${config.bg}`}
            >
              {config.label}
            </span>
          </div>
          <p className="font-medium text-foreground">{flag.claim}</p>
        </div>
        {relatedFindings.length > 0 &&
          (expanded ? (
            <ChevronUp className="mt-1 h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="mt-1 h-4 w-4 text-muted-foreground" />
          ))}
      </button>

      {expanded && relatedFindings.length > 0 && (
        <div className="mt-3 space-y-2 border-t border-border/50 pt-3">
          <p className="text-xs font-medium uppercase text-muted-foreground">
            Supporting Evidence
          </p>
          {relatedFindings.map((finding) => (
            <div
              key={finding._id}
              className="rounded-md bg-background/50 p-3"
            >
              <p className="text-sm font-medium">{finding.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {finding.content}
              </p>
              <div className="mt-2 flex items-center gap-1">
                <span className="text-xs text-muted-foreground">
                  Source: {finding.sourceLabel}
                </span>
                {finding.sourceUrl && (
                  <a
                    href={finding.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-1 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    View <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function RedFlagsList({
  redFlags,
  findings,
}: {
  redFlags: RedFlag[];
  findings: FindingRecord[];
}) {
  if (redFlags.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h2 className="mb-4 flex items-center gap-2 text-xl font-bold">
        <AlertTriangle className="h-5 w-5 text-destructive" />
        Red Flags
      </h2>
      <div className="space-y-3">
        {redFlags.map((flag, i) => (
          <RedFlagItem key={i} flag={flag} findings={findings} />
        ))}
      </div>
    </div>
  );
}
