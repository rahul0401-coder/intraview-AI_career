import { query } from "./_generated/server";

export const getSystemStats = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        // Check if admin
        const currentUser = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!currentUser || currentUser.role !== "admin") {
            throw new Error("Only admins can view system stats");
        }

        // Get current timestamp
        const now = Date.now();

        // Get counts
        const [users, interviews, customQuestions] = await Promise.all([
            ctx.db.query("users").collect(),
            ctx.db.query("interviews").collect(),
            ctx.db.query("customQuestions").collect(),
        ]);

        // Calculate statistics
        const stats = {
            totalUsers: users.length,
            usersByRole: {
                candidates: users.filter(u => u.role === "candidate").length,
                interviewers: users.filter(u => u.role === "interviewer").length,
                admins: users.filter(u => u.role === "admin").length,
            },
            totalInterviews: interviews.length,
            interviewsByStatus: {
                scheduled: interviews.filter(i =>
                    i.status === "scheduled" && i.startTime > now
                ).length,
                completed: interviews.filter(i =>
                    i.status === "completed" ||
                    (i.endTime && i.endTime < now)
                ).length,
                inProgress: interviews.filter(i =>
                    (i.status === "in_progress" || i.status === "active") ||
                    (i.startTime <= now && (!i.endTime || i.endTime > now))
                ).length,
            },
            totalCustomQuestions: customQuestions.length,
        };

        return stats;
    },
});

export const getRecentActivity = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        // Check if admin
        const currentUser = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!currentUser || currentUser.role !== "admin") {
            throw new Error("Only admins can view activity logs");
        }

        // Get recent interviews and comments
        const [recentInterviews, recentComments] = await Promise.all([
            ctx.db
                .query("interviews")
                .order("desc")
                .take(10),
            ctx.db
                .query("comments")
                .order("desc")
                .take(10),
        ]);

        // Combine and sort activities
        const activities = [
            ...recentInterviews.map(interview => ({
                type: "interview",
                data: interview,
                timestamp: interview.startTime,
            })),
            ...recentComments.map(comment => ({
                type: "feedback",
                data: comment,
                timestamp: comment._creationTime,
            })),
        ].sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 10);

        return activities;
    },
});

export const getAllMockInterviews = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        // Check if admin
        const currentUser = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!currentUser || currentUser.role !== "admin") {
            throw new Error("Only admins can view all mock interviews");
        }

        console.log("Admin user accessing mock interviews:", currentUser.name);

        // Get all mock interviews (not just completed ones for debugging)
        const mockInterviews = await ctx.db
            .query("mockInterviews")
            // Remove filter for debugging
            // .filter((q) => q.eq(q.field("status"), "completed"))
            .order("desc")
            .collect();

        console.log(`Found ${mockInterviews.length} mock interviews in total`);

        // Log status counts for debugging
        const statusCounts: { [key: string]: number } = {};
        mockInterviews.forEach(interview => {
            const status = interview.status || 'undefined';
            statusCounts[status] = (statusCounts[status] || 0) + 1;
        });
        console.log("Interview status counts:", statusCounts);

        // Get all users
        const users = await ctx.db.query("users").collect();

        // Map user details to interviews
        const interviewsWithUserDetails = await Promise.all(
            mockInterviews.map(async (interview) => {
                const user = users.find(u => u.clerkId === interview.userId);
                return {
                    ...interview,
                    userName: user?.name || "Unknown User",
                    userEmail: user?.email || "Unknown Email",
                    userImage: user?.image || "",
                };
            })
        );

        return interviewsWithUserDetails;
    },
}); 