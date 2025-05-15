import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create or update a user profile
export const saveUserProfile = mutation({
    args: {
        industry: v.string(),
        yearsOfExperience: v.number(),
        skills: v.array(v.string()),
        bio: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!user) throw new Error("User not found");

        // Check if profile already exists
        const existingProfile = await ctx.db
            .query("userSkillsProfile")
            .withIndex("by_user_id", (q) => q.eq("userId", user.clerkId))
            .first();

        if (existingProfile) {
            // Update existing profile
            return await ctx.db.patch(existingProfile._id, {
                industry: args.industry,
                yearsOfExperience: args.yearsOfExperience,
                skills: args.skills,
                bio: args.bio,
                updatedAt: Date.now(),
            });
        } else {
            // Create new profile
            return await ctx.db.insert("userSkillsProfile", {
                userId: user.clerkId,
                industry: args.industry,
                yearsOfExperience: args.yearsOfExperience,
                skills: args.skills,
                bio: args.bio,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });
        }
    },
});

// Get a user profile
export const getUserProfile = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!user) return null;

        return await ctx.db
            .query("userSkillsProfile")
            .withIndex("by_user_id", (q) => q.eq("userId", user.clerkId))
            .first();
    },
});

// Get profiles by industry
export const getProfilesByIndustry = query({
    args: { industry: v.string() },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        return await ctx.db
            .query("userSkillsProfile")
            .withIndex("by_industry", (q) => q.eq("industry", args.industry))
            .collect();
    },
}); 