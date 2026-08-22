"use client";

import { Fingerprint } from "lucide-react";

interface IdentityCardProps {
  identity?: {
    canonicalName: string;
    aliases: string[];
    headquarters?: string;
    products: string[];
    legalEntities: Array<{
      name: string;
      jurisdiction?: string;
      registrationNumber?: string;
      status?: string;
    }>;
    people: Array<{ name: string; role: string }>;
    confusableEntities: Array<{ name: string; distinction: string }>;
    notes: string;
    confidence: number;
  };
}

export function IdentityCard({ identity }: IdentityCardProps) {
  if (!identity) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h2 className="mb-3 flex items-center gap-2 text-xl font-bold">
        <Fingerprint className="h-5 w-5 text-primary" />
        Resolved Entity
      </h2>
      <p className="mb-4 text-sm text-muted-foreground">{identity.notes}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs uppercase text-muted-foreground">Canonical name</p>
          <p className="font-medium">{identity.canonicalName}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-muted-foreground">Headquarters</p>
          <p className="font-medium">{identity.headquarters || "Unknown"}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-muted-foreground">People</p>
          <p className="text-sm">
            {identity.people.length
              ? identity.people.map((p) => `${p.name} (${p.role})`).join(", ")
              : "Not identified"}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase text-muted-foreground">Products</p>
          <p className="text-sm">
            {identity.products.length ? identity.products.join(", ") : "Unknown"}
          </p>
        </div>
      </div>
      {identity.legalEntities.length > 0 && (
        <div className="mt-4">
          <p className="mb-1 text-xs uppercase text-muted-foreground">
            Legal entities
          </p>
          <ul className="space-y-1 text-sm">
            {identity.legalEntities.map((e, i) => (
              <li key={i}>
                {e.name}
                {e.jurisdiction ? ` · ${e.jurisdiction}` : ""}
                {e.registrationNumber ? ` · ${e.registrationNumber}` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}
      {identity.confusableEntities.length > 0 && (
        <div className="mt-4 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3">
          <p className="mb-1 text-xs font-medium uppercase text-yellow-300">
            Do not mix with
          </p>
          <ul className="space-y-1 text-sm text-yellow-100/90">
            {identity.confusableEntities.map((c, i) => (
              <li key={i}>
                <span className="font-medium">{c.name}</span> — {c.distinction}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
