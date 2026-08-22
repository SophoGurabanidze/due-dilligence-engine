"use client";

import { useState } from "react";
import { ExternalLink, ChevronDown, ChevronUp } from "lucide-react";

interface FindingRecord {
  _id: string;
  source: string;
  category: string;
  title: string;
  content: string;
  sourceUrl?: string;
  sourceLabel: string;
  confidence: number;
}

const sourceLabels: Record<string, string> = {
  identity: "Identity",
  web: "Web & News",
  financial: "Financial",
  legal: "Legal",
  company: "Company",
  market: "Market",
  dataroom: "Data Room",
};

const sourceColors: Record<string, string> = {
  identity: "bg-fuchsia-500/20 text-fuchsia-300",
  web: "bg-blue-500/20 text-blue-300",
  financial: "bg-green-500/20 text-green-300",
  legal: "bg-red-500/20 text-red-300",
  company: "bg-purple-500/20 text-purple-300",
  market: "bg-yellow-500/20 text-yellow-300",
  dataroom: "bg-cyan-500/20 text-cyan-300",
};

export function FindingsList({ findings }: { findings: FindingRecord[] }) {
  const [expandedSource, setExpandedSource] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const sources = [...new Set(findings.map((f) => f.source))];
  const filtered =
    filter === "all" ? findings : findings.filter((f) => f.source === filter);

  const grouped = filtered.reduce(
    (acc, f) => {
      if (!acc[f.source]) acc[f.source] = [];
      acc[f.source].push(f);
      return acc;
    },
    {} as Record<string, FindingRecord[]>
  );

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h2 className="mb-4 text-xl font-bold">All Findings</h2>

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => setFilter("all")}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            filter === "all"
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-muted-foreground hover:text-foreground"
          }`}
        >
          All ({findings.length})
        </button>
        {sources.map((src) => (
          <button
            key={src}
            onClick={() => setFilter(src)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              filter === src
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {sourceLabels[src] ?? src} (
            {findings.filter((f) => f.source === src).length})
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {Object.entries(grouped).map(([source, items]) => (
          <div key={source}>
            <button
              onClick={() =>
                setExpandedSource(expandedSource === source ? null : source)
              }
              className="mb-2 flex w-full items-center justify-between text-left"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`rounded px-2 py-0.5 text-xs font-medium ${sourceColors[source] ?? "bg-muted text-muted-foreground"}`}
                >
                  {sourceLabels[source] ?? source}
                </span>
                <span className="text-sm text-muted-foreground">
                  {items.length} finding{items.length !== 1 ? "s" : ""}
                </span>
              </div>
              {expandedSource === source ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </button>

            {expandedSource === source && (
              <div className="space-y-2 pl-2">
                {items.map((finding) => (
                  <div
                    key={finding._id}
                    className="rounded-lg border border-border bg-secondary/30 p-4"
                  >
                    <div className="mb-1 flex items-start justify-between gap-2">
                      <h4 className="font-medium">{finding.title}</h4>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {Math.round(finding.confidence * 100)}% confidence
                      </span>
                    </div>
                    <p className="mb-2 text-sm text-muted-foreground">
                      {finding.content}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {finding.sourceLabel}
                      </span>
                      {finding.sourceUrl && (
                        <a
                          href={finding.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          View Source <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
