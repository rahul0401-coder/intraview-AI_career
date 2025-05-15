import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    clerkId: v.string(),
    image: v.optional(v.string()),
    role: v.union(v.literal("candidate"), v.literal("interviewer"), v.literal("admin")),
  }).index("by_clerk_id", ["clerkId"]),

  interviews: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    startTime: v.number(),
    endTime: v.optional(v.number()),
    status: v.union(
      v.literal("scheduled"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("active"),
      v.literal("succeeded"),
      v.literal("upcoming")
    ),
    streamCallId: v.string(),
    candidateId: v.string(),
    interviewerIds: v.array(v.string()),
  })
    .index("by_candidate_id", ["candidateId"])
    .index("by_stream_call_id", ["streamCallId"]),

  comments: defineTable({
    content: v.string(),
    rating: v.number(),
    interviewerId: v.string(),
    interviewerName: v.optional(v.string()),
    candidateName: v.optional(v.string()),
    interviewId: v.id("interviews"),
  }).index("by_interview_id", ["interviewId"]),

  customQuestions: defineTable({
    title: v.string(),
    description: v.string(),
    interviewerId: v.string(),
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
  })
    .index("by_interviewer_id", ["interviewerId"])
    .index("by_interview_id", ["interviewId"]),

  liveCode: defineTable({
    interviewId: v.string(),
    code: v.string(),
    language: v.union(v.literal("javascript"), v.literal("python"), v.literal("java")),
    questionId: v.string(),
    lastUpdated: v.number(),
  })
    .index("by_interview", ["interviewId"])
    .searchIndex("by_interview_recent", {
      searchField: "lastUpdated",
      filterFields: ["interviewId"]
    }),

  liveCodeSync: defineTable({
    interviewId: v.string(),
    code: v.string(),
    language: v.union(v.literal("javascript"), v.literal("python"), v.literal("java")),
    lastUpdated: v.number(),
    updatedBy: v.string(), // clerkId of the user who made the update
    questionId: v.optional(v.string()),
  })
    .index("by_interview", ["interviewId"])
    .searchIndex("by_interview_recent", {
      searchField: "lastUpdated",
      filterFields: ["interviewId"]
    }),

  questions: defineTable({
    title: v.string(),
    description: v.string(),
    difficulty: v.union(v.literal("easy"), v.literal("medium"), v.literal("hard")),
    category: v.string(),
    createdBy: v.string(),
  }),

  feedback: defineTable({
    interviewId: v.id("interviews"),
    rating: v.number(),
    comment: v.string(),
    givenBy: v.string(),
    givenTo: v.string(),
  }),

  // AI-Career related tables
  mockInterviews: defineTable({
    userId: v.string(),
    title: v.string(),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
    score: v.optional(v.number()),
    questions: v.array(
      v.object({
        question: v.string(),
        options: v.array(v.string()),
        correctAnswer: v.string(),
        userAnswer: v.optional(v.string()),
        explanation: v.string(),
      })
    ),
    feedback: v.optional(v.string()),
    status: v.union(v.literal("in_progress"), v.literal("completed")),
    category: v.optional(v.string()),
  })
    .index("by_user_id", ["userId"])
    .index("by_status", ["status"])
    .index("by_created_at", ["createdAt"]),

  userSkillsProfile: defineTable({
    userId: v.string(),
    industry: v.string(),
    yearsOfExperience: v.number(),
    skills: v.array(v.string()),
    bio: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user_id", ["userId"])
    .index("by_industry", ["industry"]),

  resumes: defineTable({
    userId: v.string(),
    title: v.string(),
    content: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
    jobDescription: v.optional(v.string()),
    feedback: v.optional(v.string()),
    skills: v.optional(v.array(v.string())),
    template: v.optional(v.string()),
  })
    .index("by_user_id", ["userId"])
    .index("by_created_at", ["createdAt"]),

  userSkills: defineTable({
    userId: v.string(),
    skills: v.array(
      v.object({
        name: v.string(),
        level: v.number(), // 0-100 proficiency level
        lastAssessed: v.number(),
      })
    ),
    interviewsCompleted: v.number(),
    totalScore: v.number(),
    lastUpdated: v.number(),
  })
    .index("by_user_id", ["userId"]),

  careerRecommendations: defineTable({
    userId: v.string(),
    title: v.string(),
    description: v.string(),
    createdAt: v.number(),
    type: v.union(
      v.literal("interview_prep"),
      v.literal("resume_update"),
      v.literal("skill_development")
    ),
    completed: v.boolean(),
    priority: v.union(
      v.literal("high"),
      v.literal("medium"),
      v.literal("low")
    ),
  })
    .index("by_user_id", ["userId"])
    .index("by_completed", ["completed"]),
})


