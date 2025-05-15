import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Doc, Id } from "../../convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";
import FeedbackCard from "./FeedbackCard";

interface Feedback extends Doc<"comments"> {
    content: string;
    rating: number;
    interviewerId: string;
    interviewerName?: string;
    candidateName?: string;
    interviewId: Id<"interviews">;
}

interface Interview extends Doc<"interviews"> {
    title: string;
    startTime: number;
    status: string;
}

export interface FeedbackWithInterview extends Feedback {
    interviewTitle: string;
    interviewDate: number;
}

export default function CandidateFeedback() {
    const { user } = useUser();
    const interviews = useQuery(api.interviews.getMyInterviews) as Interview[] | undefined;

    // Get all interview IDs
    const interviewIds = interviews?.map(interview => interview._id) || [];

    // Get all comments for all interviews in a single query
    const allComments = useQuery(api.comments.getCandidateFeedback) as FeedbackWithInterview[] | undefined;

    // Loading state
    if (!interviews || !allComments) {
        return (
            <div className="text-center py-8">
                <p className="text-muted-foreground">Loading feedback...</p>
            </div>
        );
    }

    // No interviews state
    if (interviews.length === 0) {
        return (
            <div className="text-center py-8">
                <p className="text-muted-foreground">No feedback received yet</p>
            </div>
        );
    }

    // No feedback state
    if (allComments.length === 0) {
        return (
            <div className="text-center py-8">
                <p className="text-muted-foreground">No feedback available for your interviews yet</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allComments.map((feedback) => (
                <FeedbackCard key={feedback._id} feedback={feedback} />
            ))}
        </div>
    );
} 