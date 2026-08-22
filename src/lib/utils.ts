import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getScoreColor(score: number): string {
  if (score >= 80) return "text-score-excellent";
  if (score >= 65) return "text-score-good";
  if (score >= 50) return "text-score-average";
  if (score >= 35) return "text-score-poor";
  return "text-score-critical";
}

export function getScoreBgColor(score: number): string {
  if (score >= 80) return "bg-score-excellent";
  if (score >= 65) return "bg-score-good";
  if (score >= 50) return "bg-score-average";
  if (score >= 35) return "bg-score-poor";
  return "bg-score-critical";
}

export function getScoreLabel(score: number): string {
  if (score >= 80) return "Excellent";
  if (score >= 65) return "Good";
  if (score >= 50) return "Average";
  if (score >= 35) return "Poor";
  return "Critical";
}
