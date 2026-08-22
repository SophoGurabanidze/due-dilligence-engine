import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("reports", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const getByInvestigation = query({
  args: { investigationId: v.id("investigations") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("reports")
      .withIndex("by_investigation", (q) =>
        q.eq("investigationId", args.investigationId)
      )
      .first();
  },
});
