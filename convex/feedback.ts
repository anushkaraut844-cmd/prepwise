import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";

const query = queryGeneric;
const mutation = mutationGeneric;

const categoryScore = v.object({
  name: v.string(),
  score: v.number(),
  comment: v.string(),
});

const serializeFeedback = (feedback: {
  _id: string;
  interviewId: string;
  userId: string;
  totalScore: number;
  categoryScores: {
    name: string;
    score: number;
    comment: string;
  }[];
  strengths: string[];
  areasForImprovement: string[];
  finalAssessment: string;
  createdAt: string;
}) => ({
  id: feedback._id,
  interviewId: feedback.interviewId,
  userId: feedback.userId,
  totalScore: feedback.totalScore,
  categoryScores: feedback.categoryScores,
  strengths: feedback.strengths,
  areasForImprovement: feedback.areasForImprovement,
  finalAssessment: feedback.finalAssessment,
  createdAt: feedback.createdAt,
});

export const upsert = mutation({
  args: {
    interviewId: v.string(),
    userId: v.string(),
    totalScore: v.number(),
    categoryScores: v.array(categoryScore),
    strengths: v.array(v.string()),
    areasForImprovement: v.array(v.string()),
    finalAssessment: v.string(),
    createdAt: v.string(),
    feedbackId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const interviewId = ctx.db.normalizeId("interviews", args.interviewId);
    const userId = ctx.db.normalizeId("users", args.userId);

    if (!interviewId || !userId) {
      throw new Error("Invalid feedback relation.");
    }

    const feedbackData = {
      interviewId,
      userId,
      totalScore: args.totalScore,
      categoryScores: args.categoryScores,
      strengths: args.strengths,
      areasForImprovement: args.areasForImprovement,
      finalAssessment: args.finalAssessment,
      createdAt: args.createdAt,
    };

    if (args.feedbackId) {
      const feedbackId = ctx.db.normalizeId("feedback", args.feedbackId);
      if (!feedbackId) {
        throw new Error("Invalid feedback id.");
      }

      await ctx.db.replace(feedbackId, feedbackData);
      return { id: feedbackId };
    }

    const feedbackId = await ctx.db.insert("feedback", feedbackData);
    return { id: feedbackId };
  },
});

export const getByInterviewAndUser = query({
  args: {
    interviewId: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const interviewId = ctx.db.normalizeId("interviews", args.interviewId);
    const userId = ctx.db.normalizeId("users", args.userId);

    if (!interviewId || !userId) return null;

    const feedbackEntries = await ctx.db
      .query("feedback")
      .withIndex("by_interview_id", (q) => q.eq("interviewId", interviewId))
      .collect();

    const feedback = feedbackEntries.find((entry) => entry.userId === userId);
    if (!feedback) return null;

    return serializeFeedback(feedback);
  },
});
