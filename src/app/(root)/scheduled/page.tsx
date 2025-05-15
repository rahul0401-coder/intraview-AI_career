"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Loader2Icon } from "lucide-react";
import MeetingCard from "@/components/MeetingCard";
import { useUserRole } from "@/hooks/useUserRole";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ScheduledInterviewsPage() {
    const { isCandidate, isLoading } = useUserRole();
    const router = useRouter();
    const interviews = useQuery(api.interviews.getScheduledInterviews);

    // Redirect non-candidates away from this page
    useEffect(() => {
        if (!isLoading && !isCandidate) {
            router.push("/");
        }
    }, [isCandidate, isLoading, router]);

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2Icon className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="container max-w-7xl mx-auto p-6">
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">Scheduled Interviews</h1>
                    <p className="text-muted-foreground mt-1">View and join your upcoming interviews</p>
                </div>

                <div className="mt-8">
                    {interviews === undefined ? (
                        <div className="flex justify-center py-12">
                            <Loader2Icon className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : interviews.length > 0 ? (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {interviews.map((interview) => (
                                <MeetingCard key={interview._id} interview={interview} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-muted-foreground">
                            You have no scheduled interviews at the moment
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
} 