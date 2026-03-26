import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";

const query = queryGeneric;
const mutation = mutationGeneric;

const serializeInterview = (interview: {
  _id: string;
  role: string;
  type: string;
  level: string;
  techstack: string[];
  questions: string[];
  userId: string;
  finalized: boolean;
  coverImage?: string;
  createdAt: string;
}) => ({
  id: interview._id,
  role: interview.role,
  type: interview.type,
  level: interview.level,
  techstack: interview.techstack,
  questions: interview.questions,
  userId: interview.userId,
  finalized: interview.finalized,
  coverImage: interview.coverImage,
  createdAt: interview.createdAt,
});

export const create = mutation({
  args: {
    role: v.string(),
    type: v.string(),
    level: v.string(),
    techstack: v.array(v.string()),
    questions: v.array(v.string()),
    userId: v.string(),
    finalized: v.boolean(),
    coverImage: v.string(),
    createdAt: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = ctx.db.normalizeId("users", args.userId);
    if (!userId) {
      throw new Error("Invalid user.");
    }

    const interviewId = await ctx.db.insert("interviews", {
      ...args,
      userId,
    });

    return { id: interviewId };
  },
});

export const getById = query({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    const interviewId = ctx.db.normalizeId("interviews", args.id);
    if (!interviewId) return null;

    const interview = await ctx.db.get(interviewId);
    if (!interview) return null;

    return serializeInterview(interview);
  },
});

export const getLatest = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const interviews = await ctx.db.query("interviews").collect();
    const limit = args.limit ?? 20;

    return interviews
      .filter((interview) => interview.finalized && interview.userId !== args.userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit)
      .map(serializeInterview);
  },
});

export const getByUserId = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const userId = ctx.db.normalizeId("users", args.userId);
    if (!userId) return [];

    const interviews = await ctx.db
      .query("interviews")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .collect();

    return interviews
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map(serializeInterview);
  },
});
