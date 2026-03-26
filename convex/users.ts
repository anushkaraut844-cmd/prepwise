import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";

const query = queryGeneric;
const mutation = mutationGeneric;

export const create = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    passwordHash: v.string(),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (existingUser) {
      throw new Error("User already exists.");
    }

    const userId = await ctx.db.insert("users", args);

    return {
      id: userId,
      name: args.name,
      email: args.email,
    };
  },
});

export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (!user) return null;

    return {
      id: user._id,
      name: user.name,
      email: user.email,
      passwordHash: user.passwordHash,
    };
  },
});

export const getById = query({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    const userId = ctx.db.normalizeId("users", args.id);
    if (!userId) return null;

    const user = await ctx.db.get(userId);
    if (!user) return null;

    return {
      id: user._id,
      name: user.name,
      email: user.email,
    };
  },
});
