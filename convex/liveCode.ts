import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get the latest code for a specific interview
export const getLatestCode = query({
    args: { interviewId: v.string() },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        // Get the most recent code update for this interview
        const latestCode = await ctx.db
            .query("liveCodeSync")
            .withIndex("by_interview", (q) => q.eq("interviewId", args.interviewId))
            .order("desc")
            .first();

        return latestCode;
    },
});

// Update code in real-time
export const updateCode = mutation({
    args: {
        interviewId: v.string(),
        code: v.string(),
        language: v.union(v.literal("javascript"), v.literal("python"), v.literal("java")),
        questionId: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        // Insert the new code update with questionId if provided
        return await ctx.db.insert("liveCodeSync", {
            interviewId: args.interviewId,
            code: args.code,
            language: args.language,
            lastUpdated: Date.now(),
            updatedBy: identity.subject,
            questionId: args.questionId,
        });
    },
});

// Update selected question - for synchronizing which question is selected between interviewer and candidate
export const updateSelectedQuestion = mutation({
    args: {
        interviewId: v.string(),
        questionId: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        // Get the most recent code update
        const latestCode = await ctx.db
            .query("liveCodeSync")
            .withIndex("by_interview", (q) => q.eq("interviewId", args.interviewId))
            .order("desc")
            .first();

        // Insert the update with the new questionId
        // Using existing code or empty string if no previous code exists
        return await ctx.db.insert("liveCodeSync", {
            interviewId: args.interviewId,
            code: latestCode?.code || "",
            language: latestCode?.language || "javascript",
            lastUpdated: Date.now(),
            updatedBy: identity.subject,
            questionId: args.questionId,
        });
    },
});

// Subscribe to code changes for a specific interview
export const subscribeToCodeChanges = query({
    args: { interviewId: v.string() },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        // Get all code updates for this interview, ordered by timestamp
        const codeUpdates = await ctx.db
            .query("liveCodeSync")
            .withIndex("by_interview", (q) => q.eq("interviewId", args.interviewId))
            .order("desc")
            .take(1);

        return codeUpdates[0];
    },
}); 