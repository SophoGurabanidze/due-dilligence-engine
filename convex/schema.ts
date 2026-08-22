import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  investigations: defineTable({
    userId: v.string(),
    companyName: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("researching"),
      v.literal("analyzing"),
      v.literal("complete"),
      v.literal("failed")
    ),
    agentStatuses: v.optional(
      v.object({
        identity: v.optional(v.string()),
        web: v.string(),
        financial: v.string(),
        legal: v.string(),
        company: v.string(),
        market: v.string(),
        dataroom: v.string(),
      })
    ),
    identity: v.optional(
      v.object({
        canonicalName: v.string(),
        aliases: v.array(v.string()),
        headquarters: v.optional(v.string()),
        products: v.array(v.string()),
        legalEntities: v.array(
          v.object({
            name: v.string(),
            jurisdiction: v.optional(v.string()),
            registrationNumber: v.optional(v.string()),
            status: v.optional(v.string()),
          })
        ),
        people: v.array(
          v.object({
            name: v.string(),
            role: v.string(),
          })
        ),
        confusableEntities: v.array(
          v.object({
            name: v.string(),
            distinction: v.string(),
          })
        ),
        notes: v.string(),
        confidence: v.number(),
      })
    ),
    error: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"]),

  findings: defineTable({
    investigationId: v.id("investigations"),
    source: v.union(
      v.literal("web"),
      v.literal("financial"),
      v.literal("legal"),
      v.literal("company"),
      v.literal("market"),
      v.literal("dataroom"),
      v.literal("identity")
    ),
    category: v.string(),
    title: v.string(),
    content: v.string(),
    sourceUrl: v.optional(v.string()),
    sourceLabel: v.string(),
    confidence: v.number(),
    rawData: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_investigation", ["investigationId"]),

  reports: defineTable({
    investigationId: v.id("investigations"),
    overallScore: v.number(),
    scores: v.object({
      financial: v.number(),
      management: v.number(),
      market: v.number(),
      legal: v.number(),
      competitive: v.number(),
    }),
    redFlags: v.array(
      v.object({
        claim: v.string(),
        severity: v.union(
          v.literal("critical"),
          v.literal("high"),
          v.literal("medium"),
          v.literal("low")
        ),
        findingIds: v.array(v.id("findings")),
      })
    ),
    summary: v.string(),
    createdAt: v.number(),
  }).index("by_investigation", ["investigationId"]),

  dataRoomFiles: defineTable({
    investigationId: v.id("investigations"),
    storageId: v.id("_storage"),
    fileName: v.string(),
    fileType: v.string(),
    extractedText: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_investigation", ["investigationId"]),
});
