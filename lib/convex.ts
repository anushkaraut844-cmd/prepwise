import "server-only";

import { fetchMutation, fetchQuery } from "convex/nextjs";
import { makeFunctionReference } from "convex/server";

const queryRef = <Args extends Record<string, unknown>, ReturnValue>(
  name: string
) => makeFunctionReference<"query", Args, ReturnValue>(name);

const mutationRef = <Args extends Record<string, unknown>, ReturnValue>(
  name: string
) => makeFunctionReference<"mutation", Args, ReturnValue>(name);

export const convexQuery = fetchQuery;
export const convexMutation = fetchMutation;

export const convexApi = {
  users: {
    create: mutationRef<
      { name: string; email: string; passwordHash: string },
      { id: string; name: string; email: string }
    >("users:create"),
    getByEmail: queryRef<
      { email: string },
      {
        id: string;
        name: string;
        email: string;
        passwordHash: string;
      } | null
    >("users:getByEmail"),
    getById: queryRef<
      { id: string },
      {
        id: string;
        name: string;
        email: string;
      } | null
    >("users:getById"),
  },
  sessions: {
    create: mutationRef<
      { userId: string; tokenHash: string; expiresAt: number },
      { id: string }
    >("sessions:create"),
    getByTokenHash: queryRef<
      { tokenHash: string },
      { id: string; userId: string; expiresAt: number } | null
    >("sessions:getByTokenHash"),
    deleteByTokenHash: mutationRef<{ tokenHash: string }, null>(
      "sessions:deleteByTokenHash"
    ),
  },
  interviews: {
    create: mutationRef<
      {
        role: string;
        type: string;
        level: string;
        techstack: string[];
        questions: string[];
        userId: string;
        finalized: boolean;
        coverImage: string;
        createdAt: string;
      },
      { id: string }
    >("interviews:create"),
    getById: queryRef<{ id: string }, Interview | null>("interviews:getById"),
    getLatest: queryRef<
      { userId: string; limit?: number },
      Interview[]
    >("interviews:getLatest"),
    getByUserId: queryRef<{ userId: string }, Interview[]>(
      "interviews:getByUserId"
    ),
  },
  feedback: {
    upsert: mutationRef<
      {
        interviewId: string;
        userId: string;
        totalScore: number;
        categoryScores: Feedback["categoryScores"];
        strengths: string[];
        areasForImprovement: string[];
        finalAssessment: string;
        createdAt: string;
        feedbackId?: string;
      },
      { id: string }
    >("feedback:upsert"),
    getByInterviewAndUser: queryRef<
      { interviewId: string; userId: string },
      Feedback | null
    >("feedback:getByInterviewAndUser"),
  },
};
