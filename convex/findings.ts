import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("findings", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const createMany = mutation({
  args: {
    findings: v.array(
      v.object({
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
      })
    ),
  },
  handler: async (ctx, args) => {
    const ids = [];
    for (const finding of args.findings) {
      const id = await ctx.db.insert("findings", {
        ...finding,
        createdAt: Date.now(),
      });
      ids.push(id);
    }
    return ids;
  },
});

export const getByInvestigation = query({
  args: { investigationId: v.id("investigations") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("findings")
      .withIndex("by_investigation", (q) =>
        q.eq("investigationId", args.investigationId)
      )
      .collect();
  },
});

export const get = query({
  args: { id: v.id("findings") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});
