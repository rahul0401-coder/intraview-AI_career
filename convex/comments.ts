import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// add a new comment
export const addComment = mutation({
  args: {
    interviewId: v.id("interviews"),
    content: v.string(),
    rating: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    // Get the interview details to get the candidate ID
    const interview = await ctx.db.get(args.interviewId);
    if (!interview) throw new Error("Interview not found");

    // Get the interviewer's name
    const interviewer = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!interviewer) throw new Error("Interviewer not found");

    // Get the candidate's name
    const candidate = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", interview.candidateId))
      .first();
    if (!candidate) throw new Error("Candidate not found");

    // Create the comment with all required fields
    return await ctx.db.insert("comments", {
      interviewId: args.interviewId,
      content: args.content,
      rating: args.rating,
      interviewerId: identity.subject,
      interviewerName: interviewer.name,
      candidateName: candidate.name,
    });
  },
});

// get all comments for an interview
export const getComments = query({
  args: { interviewId: v.id("interviews") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const comments = await ctx.db
      .query("comments")
      .withIndex("by_interview_id", (q) => q.eq("interviewId", args.interviewId))
      .collect();

    return comments;
  },
});

// get feedback for a specific candidate
export const getCandidateFeedback = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    // First get all interviews for this candidate
    const interviews = await ctx.db
      .query("interviews")
      .withIndex("by_candidate_id", (q) => q.eq("candidateId", identity.subject))
      .collect();

    // Get all comments for these interviews
    const feedbacks = [];
    for (const interview of interviews) {
      const comments = await ctx.db
        .query("comments")
        .withIndex("by_interview_id", (q) => q.eq("interviewId", interview._id))
        .collect();

      // Add interview title to each feedback
      const feedbacksWithTitle = comments.map(comment => ({
        ...comment,
        interviewTitle: interview.title,
        interviewDate: interview.startTime
      }));

      feedbacks.push(...feedbacksWithTitle);
    }

    // Sort by most recent interview first
    return feedbacks.sort((a, b) => b.interviewDate - a.interviewDate);
  },
});
