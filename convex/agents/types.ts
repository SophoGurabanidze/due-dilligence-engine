import { Id } from "../_generated/dataModel";

export interface Finding {
  investigationId: Id<"investigations">;
  source:
    | "web"
    | "financial"
    | "legal"
    | "company"
    | "market"
    | "dataroom"
    | "identity";
  category: string;
  title: string;
  content: string;
  sourceUrl?: string;
  sourceLabel: string;
  confidence: number;
  rawData?: string;
}

export interface LegalEntity {
  name: string;
  jurisdiction?: string;
  registrationNumber?: string;
  status?: string;
}

export interface IdentityPerson {
  name: string;
  role: string;
}

export interface ConfusableEntity {
  name: string;
  distinction: string;
}

export interface CompanyIdentity {
  canonicalName: string;
  aliases: string[];
  headquarters?: string;
  products: string[];
  legalEntities: LegalEntity[];
  people: IdentityPerson[];
  confusableEntities: ConfusableEntity[];
  notes: string;
  confidence: number;
}

export interface AgentContext {
  investigationId: Id<"investigations">;
  companyName: string;
  identity?: CompanyIdentity;
}

export function formatIdentityBrief(identity?: CompanyIdentity): string {
  if (!identity) {
    return "Identity is not yet resolved. Do not conclude the company is fake or a placeholder just because a Western registry search returned nothing.";
  }

  const aliases = identity.aliases.length
    ? identity.aliases.join("; ")
    : "none listed";
  const products = identity.products.length
    ? identity.products.join("; ")
    : "unknown";
  const entities = identity.legalEntities.length
    ? identity.legalEntities
        .map(
          (e) =>
            `${e.name}${e.jurisdiction ? ` (${e.jurisdiction})` : ""}${e.registrationNumber ? ` #${e.registrationNumber}` : ""}`
        )
        .join("; ")
    : "none confirmed";
  const people = identity.people.length
    ? identity.people.map((p) => `${p.name} (${p.role})`).join("; ")
    : "none confirmed";
  const exclude = identity.confusableEntities.length
    ? identity.confusableEntities
        .map((c) => `${c.name}: ${c.distinction}`)
        .join("; ")
    : "none identified";

  return `TARGET ENTITY (use only this company):
Canonical name: ${identity.canonicalName}
Aliases: ${aliases}
Headquarters: ${identity.headquarters ?? "unknown"}
Products: ${products}
Legal entities: ${entities}
People: ${people}
Notes: ${identity.notes}

DO NOT MIX with these similarly named companies:
${exclude}

Rules:
- Ignore news, products, customers, funding, and lawsuits that belong to a confusable entity.
- If a source is ambiguous, exclude it rather than merging it into this company.
- Missing OpenCorporates/SEC/CourtListener hits does not mean the company has no legal identity.`;
}
