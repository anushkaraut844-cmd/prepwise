import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    passwordHash: v.string(),
  }).index("by_email", ["email"]),

  sessions: defineTable({
    userId: v.id("users"),
    tokenHash: v.string(),
    expiresAt: v.number(),
  })
    .index("by_token_hash", ["tokenHash"])
    .index("by_user_id", ["userId"]),

  interviews: defineTable({
    role: v.string(),
    type: v.string(),
    level: v.string(),
    techstack: v.array(v.string()),
    questions: v.array(v.string()),
    userId: v.id("users"),
    finalized: v.boolean(),
    coverImage: v.optional(v.string()),
    createdAt: v.string(),
  }).index("by_user_id", ["userId"]),

  feedback: defineTable({
    interviewId: v.id("interviews"),
    userId: v.id("users"),
    totalScore: v.number(),
    categoryScores: v.array(
      v.object({
        name: v.string(),
        score: v.number(),
        comment: v.string(),
      })
    ),
    strengths: v.array(v.string()),
    areasForImprovement: v.array(v.string()),
    finalAssessment: v.string(),
    createdAt: v.string(),
  })
    .index("by_interview_id", ["interviewId"])
    .index("by_user_id", ["userId"]),
});
