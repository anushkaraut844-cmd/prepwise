import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";

const query = queryGeneric;
const mutation = mutationGeneric;

export const create = mutation({
  args: {
    userId: v.string(),
    tokenHash: v.string(),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = ctx.db.normalizeId("users", args.userId);
    if (!userId) {
      throw new Error("Invalid user.");
    }

    const sessionId = await ctx.db.insert("sessions", {
      userId,
      tokenHash: args.tokenHash,
      expiresAt: args.expiresAt,
    });

    return { id: sessionId };
  },
});

export const getByTokenHash = query({
  args: { tokenHash: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token_hash", (q) => q.eq("tokenHash", args.tokenHash))
      .unique();

    if (!session) return null;

    return {
      id: session._id,
      userId: session.userId,
      expiresAt: session.expiresAt,
    };
  },
});

export const deleteByTokenHash = mutation({
  args: { tokenHash: v.string() },
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_token_hash", (q) => q.eq("tokenHash", args.tokenHash))
      .collect();

    await Promise.all(sessions.map((session) => ctx.db.delete(session._id)));

    return null;
  },
});
