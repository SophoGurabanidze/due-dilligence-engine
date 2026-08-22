"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Link from "next/link";
import { Clock, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

const statusConfig = {
  pending: { icon: Clock, label: "Pending", color: "text-muted-foreground" },
  researching: { icon: Loader2, label: "Researching...", color: "text-blue-400" },
  analyzing: { icon: Loader2, label: "Analyzing...", color: "text-yellow-400" },
  complete: { icon: CheckCircle2, label: "Complete", color: "text-score-excellent" },
  failed: { icon: AlertCircle, label: "Failed", color: "text-destructive" },
};

export default function InvestigationsPage() {
  const investigations = useQuery(api.investigations.listByUser) ?? [];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">My Investigations</h1>
      {investigations.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <p className="text-muted-foreground">No investigations yet.</p>
          <Link href="/" className="mt-2 inline-block text-primary hover:underline">
            Start your first investigation
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {investigations.map((inv) => {
            const status = statusConfig[inv.status];
            const Icon = status.icon;
            return (
              <Link
                key={inv._id}
                href={`/investigation/${inv._id}`}
                className="flex items-center justify-between rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/50"
              >
                <div>
                  <h2 className="text-lg font-semibold">{inv.companyName}</h2>
                  <p className="text-sm text-muted-foreground">
                    {new Date(inv.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div className={`flex items-center gap-2 ${status.color}`}>
                  <Icon
                    className={`h-4 w-4 ${inv.status === "researching" || inv.status === "analyzing" ? "animate-spin" : ""}`}
                  />
                  <span className="text-sm font-medium">{status.label}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
