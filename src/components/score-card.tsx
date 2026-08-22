"use client";

import { getScoreColor, getScoreLabel, getScoreBgColor } from "@/lib/utils";

interface ScoreCardProps {
  overallScore: number;
  scores: {
    financial: number;
    management: number;
    market: number;
    legal: number;
    competitive: number;
  };
}

const categoryLabels: Record<string, string> = {
  financial: "Financial Health",
  management: "Management",
  market: "Market",
  legal: "Legal Risk",
  competitive: "Competitive Position",
};

export function ScoreCard({ overallScore, scores }: ScoreCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-6 flex items-center gap-6">
        <div className="flex flex-col items-center">
          <div
            className={`flex h-24 w-24 items-center justify-center rounded-full border-4 ${
              overallScore >= 65
                ? "border-score-excellent"
                : overallScore >= 50
                  ? "border-score-average"
                  : "border-score-critical"
            }`}
          >
            <span className={`text-3xl font-bold ${getScoreColor(overallScore)}`}>
              {overallScore}
            </span>
          </div>
          <span className="mt-2 text-sm text-muted-foreground">
            Investment Score
          </span>
        </div>
        <div className="flex-1">
          <h2 className="mb-1 text-xl font-bold">
            {getScoreLabel(overallScore)}
          </h2>
          <p className="text-sm text-muted-foreground">
            Based on analysis of financial data, management, market position,
            legal exposure, and competitive landscape.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {Object.entries(scores).map(([key, value]) => (
          <div key={key} className="flex items-center gap-4">
            <span className="w-40 text-sm text-muted-foreground">
              {categoryLabels[key] ?? key}
            </span>
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-secondary">
              <div
                className={`h-full rounded-full transition-all duration-700 ${getScoreBgColor(value)}`}
                style={{ width: `${value}%` }}
              />
            </div>
            <span className={`w-10 text-right text-sm font-semibold ${getScoreColor(value)}`}>
              {value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
