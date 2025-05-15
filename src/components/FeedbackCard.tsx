import { Card } from "@/components/ui/card";
import { StarIcon } from "lucide-react";
import { format } from "date-fns";
import { FeedbackWithInterview } from "./CandidateFeedback";

interface FeedbackCardProps {
    feedback: FeedbackWithInterview;
}

export default function FeedbackCard({ feedback }: FeedbackCardProps) {
    return (
        <Card className="p-4 space-y-4">
            {/* Interview Info */}
            <div>
                <h3 className="font-semibold">{feedback.interviewTitle}</h3>
                <p className="text-sm text-muted-foreground">
                    {format(new Date(feedback.interviewDate), "MMM d, yyyy")}
                </p>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                    <StarIcon
                        key={i}
                        className={`h-4 w-4 ${i < feedback.rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"
                            }`}
                    />
                ))}
            </div>

            {/* Feedback Content */}
            <p className="text-sm text-muted-foreground">{feedback.content}</p>

            {/* Interviewer Info */}
            <div className="text-sm">
                <span className="text-muted-foreground">From: </span>
                <span className="font-medium">{feedback.interviewerName || "Anonymous Interviewer"}</span>
            </div>
        </Card>
    );
} 