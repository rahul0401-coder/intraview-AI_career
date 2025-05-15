"use client";

import CandidateFeedback from "@/components/CandidateFeedback";

export default function FeedbackPage() {
    return (
        <div className="container max-w-7xl mx-auto p-6">
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">Interview Feedback</h1>
                    <p className="text-muted-foreground mt-1">View feedback from your interviews</p>
                </div>
                <CandidateFeedback />
            </div>
        </div>
    );
} 