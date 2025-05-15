import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a new resume
export const create = mutation({
    args: {
        title: v.string(),
        content: v.string(),
        jobDescription: v.optional(v.string()),
        template: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!user) throw new Error("User not found");

        const now = Date.now();
        return await ctx.db.insert("resumes", {
            userId: user.clerkId,
            title: args.title,
            content: args.content,
            createdAt: now,
            updatedAt: now,
            jobDescription: args.jobDescription,
            template: args.template,
        });
    },
});

// Get all resumes for the current user
export const getAll = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!user) throw new Error("User not found");

        return await ctx.db
            .query("resumes")
            .withIndex("by_user_id", (q) => q.eq("userId", user.clerkId))
            .order("desc")
            .collect();
    },
});

// Get a specific resume by ID
export const getById = query({
    args: { id: v.id("resumes") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!user) throw new Error("User not found");

        const resume = await ctx.db.get(args.id);
        if (!resume) throw new Error("Resume not found");

        // Make sure the user owns this resume
        if (resume.userId !== user.clerkId) throw new Error("Unauthorized");

        return resume;
    },
});

// Update a resume
export const update = mutation({
    args: {
        id: v.id("resumes"),
        title: v.optional(v.string()),
        content: v.optional(v.string()),
        jobDescription: v.optional(v.string()),
        template: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!user) throw new Error("User not found");

        const resume = await ctx.db.get(args.id);
        if (!resume) throw new Error("Resume not found");

        // Make sure the user owns this resume
        if (resume.userId !== user.clerkId) throw new Error("Unauthorized");

        const updates: any = {
            updatedAt: Date.now(),
        };

        if (args.title !== undefined) updates.title = args.title;
        if (args.content !== undefined) updates.content = args.content;
        if (args.jobDescription !== undefined) updates.jobDescription = args.jobDescription;
        if (args.template !== undefined) updates.template = args.template;

        return await ctx.db.patch(args.id, updates);
    },
});

// Delete a resume
export const remove = mutation({
    args: { id: v.id("resumes") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!user) throw new Error("User not found");

        const resume = await ctx.db.get(args.id);
        if (!resume) throw new Error("Resume not found");

        // Make sure the user owns this resume
        if (resume.userId !== user.clerkId) throw new Error("Unauthorized");

        return await ctx.db.delete(args.id);
    },
});

// Generate a resume based on job description using AI (placeholder)
export const generateResume = mutation({
    args: {
        currentResumeContent: v.string(),
        jobDescription: v.string(),
        template: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!user) throw new Error("User not found");

        // In a real implementation, you would call OpenAI API here
        // For now, we'll return a mock optimized resume

        const mockGeneratedResume = `# Jane Doe
## Frontend Developer

### Contact
* Email: jane.doe@example.com
* LinkedIn: linkedin.com/in/janedoe
* GitHub: github.com/janedoe

### Summary
Passionate frontend developer with 3+ years of experience building responsive and user-friendly web applications. Proficient in React, TypeScript, and Next.js with a focus on creating accessible and performant user interfaces.

### Skills
* Frontend: React, Next.js, TypeScript, JavaScript, HTML, CSS
* State Management: Redux, Context API
* UI Frameworks: Tailwind CSS, Material UI
* Testing: Jest, React Testing Library
* Other: Git, CI/CD, Agile methodologies

### Experience
**Frontend Developer**, TechCorp Inc. (2021-Present)
* Led the development of a new customer dashboard using Next.js and Tailwind CSS, improving user engagement by 40%
* Implemented responsive designs for mobile and tablet views, increasing mobile usage by 25%
* Collaborated with UX designers to create accessible components following WCAG guidelines

**Junior Developer**, StartupXYZ (2020-2021)
* Developed interactive UI components using React and TypeScript
* Contributed to the company's component library, improving development efficiency

### Education
**Bachelor of Science in Computer Science**
University of Technology (2016-2020)`;

        const now = Date.now();

        // Extract a title from the job description
        const titleMatch = args.jobDescription.match(/([A-Za-z]+(\s+[A-Za-z]+){0,3})\s+Developer/i);
        const title = titleMatch
            ? `${titleMatch[0]} Resume`
            : "Optimized Resume";

        // Extract skills from job description
        const skillKeywords = ["React", "JavaScript", "TypeScript", "Node.js", "CSS", "HTML", "Next.js"];
        const skills = skillKeywords.filter(skill =>
            args.jobDescription.toLowerCase().includes(skill.toLowerCase())
        );

        return await ctx.db.insert("resumes", {
            userId: user.clerkId,
            title,
            content: mockGeneratedResume,
            createdAt: now,
            updatedAt: now,
            jobDescription: args.jobDescription,
            template: args.template || "professional",
            skills,
            feedback: "This resume has been optimized to highlight your relevant skills and experience based on the job description. Key changes include highlighting your React experience and emphasizing your work with modern JavaScript frameworks."
        });
    },
}); 