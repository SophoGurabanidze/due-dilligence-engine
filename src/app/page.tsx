"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Shield, Search, FileText, AlertTriangle, TrendingUp } from "lucide-react";

export default function Home() {
  const [companyName, setCompanyName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const createInvestigation = useMutation(api.investigations.create);
  const runInvestigation = useAction(api.orchestrator.runInvestigation);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) return;
    setIsLoading(true);
    try {
      const id = await createInvestigation({ companyName: companyName.trim() });
      router.push(`/investigation/${id}`);
      runInvestigation({ investigationId: id });
    } catch (err) {
      console.error(err);
      setIsLoading(false);
    }
  };

  const examples = ["Figure AI", "Rippling", "Anduril"];

  const features = [
    {
      icon: Search,
      title: "Multi-Source Research",
      description: "Searches news, financials, legal records, company registries, and more",
    },
    {
      icon: TrendingUp,
      title: "Investment Scoring",
      description: "Quantified scores across financial health, management, market, legal risk",
    },
    {
      icon: AlertTriangle,
      title: "Red Flag Detection",
      description: "AI identifies inconsistencies and risk signals across all data sources",
    },
    {
      icon: FileText,
      title: "Source-Cited Evidence",
      description: "Every claim links to its source — no black-box AI conclusions",
    },
  ];

  return (
    <div className="flex flex-col items-center pt-16">
      <div className="mb-4 flex items-center gap-3">
        <Shield className="h-12 w-12 text-primary" />
      </div>
      <h1 className="mb-3 text-center text-4xl font-bold tracking-tight sm:text-5xl">
        AI Due Diligence Engine
      </h1>
      <p className="mb-10 max-w-xl text-center text-lg text-muted-foreground">
        Enter a company name. Get a comprehensive, source-cited investment analysis in minutes.
      </p>

      <form onSubmit={handleSubmit} className="mb-16 w-full max-w-lg">
        <div className="flex gap-3">
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="e.g. Figure AI"
            className="flex-1 rounded-lg border border-input bg-secondary px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!companyName.trim() || isLoading}
            className="rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {isLoading ? "Starting..." : "Investigate"}
          </button>
        </div>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {examples.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setCompanyName(name)}
              className="rounded-full border border-border bg-secondary px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
            >
              Try {name}
            </button>
          ))}
        </div>
      </form>

      <div className="grid w-full max-w-4xl grid-cols-1 gap-6 sm:grid-cols-2">
        {features.map((f) => (
          <div
            key={f.title}
            className="rounded-xl border border-border bg-card p-6"
          >
            <f.icon className="mb-3 h-6 w-6 text-primary" />
            <h3 className="mb-1 font-semibold">{f.title}</h3>
            <p className="text-sm text-muted-foreground">{f.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
