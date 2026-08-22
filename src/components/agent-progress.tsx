"use client";

import {
  Globe,
  DollarSign,
  Scale,
  Building2,
  TrendingUp,
  FolderOpen,
  CheckCircle2,
  Loader2,
  Clock,
  XCircle,
  Fingerprint,
} from "lucide-react";

interface AgentStatuses {
  identity?: string;
  web: string;
  financial: string;
  legal: string;
  company: string;
  market: string;
  dataroom: string;
}

const agentConfig = [
  { key: "identity", label: "Identity", icon: Fingerprint },
  { key: "web", label: "Web & News", icon: Globe },
  { key: "financial", label: "Financial Data", icon: DollarSign },
  { key: "legal", label: "Legal Records", icon: Scale },
  { key: "company", label: "Company Registry", icon: Building2 },
  { key: "market", label: "Market & Competitors", icon: TrendingUp },
  { key: "dataroom", label: "Data Room", icon: FolderOpen },
] as const;

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case "running":
      return <Loader2 className="h-4 w-4 animate-spin text-blue-400" />;
    case "complete":
      return <CheckCircle2 className="h-4 w-4 text-score-excellent" />;
    case "failed":
      return <XCircle className="h-4 w-4 text-destructive" />;
    default:
      return <Clock className="h-4 w-4 text-muted-foreground" />;
  }
}

export function AgentProgressPanel({
  agentStatuses,
}: {
  agentStatuses?: AgentStatuses;
}) {
  if (!agentStatuses) return null;

  const completed = Object.values(agentStatuses).filter(
    (s) => s === "complete" || s === "failed"
  ).length;

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold">Research Progress</h2>
        <span className="text-sm text-muted-foreground">
          {completed} / {agentConfig.length} agents
        </span>
      </div>
      <div className="mb-4 h-2 overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{
            width: `${(completed / agentConfig.length) * 100}%`,
          }}
        />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {agentConfig.map((agent) => {
          const status =
            agentStatuses[agent.key as keyof AgentStatuses] ?? "pending";
          return (
            <div
              key={agent.key}
              className="flex items-center gap-3 rounded-lg border border-border bg-secondary/50 p-3"
            >
              <agent.icon className="h-4 w-4 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{agent.label}</p>
              </div>
              <StatusIcon status={status} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
