import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createCustomQuestion = mutation({
    args: {
        title: v.string(),
        description: v.string(),
        interviewId: v.string(),
        starterCode: v.object({
            javascript: v.string(),
            python: v.string(),
            java: v.string(),
        }),
        examples: v.array(
            v.object({
                input: v.string(),
                output: v.string(),
                explanation: v.optional(v.string()),
            })
        ),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        return await ctx.db.insert("customQuestions", {
            ...args,
            interviewerId: identity.subject,
        });
    },
});

export const getCustomQuestions = query({
    args: {
        interviewId: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        // Return custom questions for this specific interview
        return await ctx.db
            .query("customQuestions")
            .withIndex("by_interview_id", (q) => q.eq("interviewId", args.interviewId))
            .collect();
    },
});

export const deleteCustomQuestion = mutation({
    args: { id: v.id("customQuestions") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const question = await ctx.db.get(args.id);
        if (!question) throw new Error("Question not found");
        if (question.interviewerId !== identity.subject) throw new Error("Unauthorized");

        await ctx.db.delete(args.id);
    },
}); 