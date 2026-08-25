import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: { companyName: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    return await ctx.db.insert("investigations", {
      userId: identity.subject,
      companyName: args.companyName,
      status: "pending",
      agentStatuses: {
        identity: "pending",
        web: "pending",
        financial: "pending",
        legal: "pending",
        company: "pending",
        market: "pending",
        dataroom: "pending",
      },
      createdAt: Date.now(),
    });
  },
});

export const get = query({
  args: { id: v.id("investigations") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const listByUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    return await ctx.db
      .query("investigations")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .collect();
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("investigations"),
    status: v.union(
      v.literal("pending"),
      v.literal("researching"),
      v.literal("analyzing"),
      v.literal("complete"),
      v.literal("failed")
    ),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const update: Record<string, unknown> = { status: args.status };
    if (args.error !== undefined) update.error = args.error;
    await ctx.db.patch(args.id, update);
  },
});

export const updateAgentStatus = mutation({
  args: {
    id: v.id("investigations"),
    agent: v.string(),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const investigation = await ctx.db.get(args.id);
    if (!investigation) throw new Error("Investigation not found");

    const agentStatuses = investigation.agentStatuses ?? {
      identity: "pending",
      web: "pending",
      financial: "pending",
      legal: "pending",
      company: "pending",
      market: "pending",
      dataroom: "pending",
    };

    await ctx.db.patch(args.id, {
      agentStatuses: {
        ...agentStatuses,
        [args.agent]: args.status,
      },
    });
  },
});

export const setIdentity = mutation({
  args: {
    id: v.id("investigations"),
    identity: v.object({
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
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { identity: args.identity });
  },
});

export const resetForRetry = mutation({
  args: { id: v.id("investigations") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: "pending",
      error: undefined,
      agentStatuses: {
        identity: "pending",
        web: "pending",
        financial: "pending",
        legal: "pending",
        company: "pending",
        market: "pending",
        dataroom: "pending",
      },
    });
  },
});
