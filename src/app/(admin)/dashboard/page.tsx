"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Doc, Id } from "../../../../convex/_generated/dataModel";
import toast from "react-hot-toast";
import LoaderUI from "@/components/LoaderUI";
import { getCandidateInfo, groupInterviews } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { INTERVIEW_CATEGORY } from "@/constants";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CalendarIcon, CheckCircle2Icon, ClockIcon, XCircleIcon } from "lucide-react";
import { format } from "date-fns";
import CenteredCommentDialog from "@/components/CenteredCommentDialog";
import { useAuth } from "@clerk/nextjs";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

type Interview = Doc<"interviews">;
// Define the status type based on the available status values in the API
type ValidInterviewStatus = "scheduled" | "in_progress" | "completed" | "active" | "succeeded" | "upcoming";

export default function DashboardPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();

  // Handle authentication
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/sign-in");
    }
  }, [isLoaded, isSignedIn, router]);

  // Only proceed with queries if signed in
  if (!isSignedIn) {
    return <div className="flex justify-center items-center min-h-screen"><LoaderUI /></div>;
  }

  // Now that we're sure user is authenticated, make the queries
  const users = useQuery(api.users.getUsers);
  const interviews = useQuery(api.interviews.getAllInterviews);
  const updateStatus = useMutation(api.interviews.updateInterviewStatus);

  const handleStatusUpdate = async (interviewId: Id<"interviews">, status: ValidInterviewStatus) => {
    try {
      await updateStatus({ id: interviewId, status });
      toast.success(`Interview marked as ${status}`);
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  if (!interviews || !users) return <LoaderUI />;

  const groupedInterviews = groupInterviews(interviews);

  return (
    <div className="w-full max-w-full overflow-hidden px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold">Interviewer Dashboard</h1>
        <Link href="/schedule">
          <Button className="w-full sm:w-auto">Schedule New Interview</Button>
        </Link>
      </div>

      <div className="space-y-8">
        {INTERVIEW_CATEGORY.map(
          (category) =>
            groupedInterviews[category.id]?.length > 0 && (
              <section key={category.id} className="bg-card rounded-lg p-4 sm:p-6 shadow-sm">
                {/* CATEGORY TITLE */}
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-semibold">{category.title}</h2>
                    <Badge variant={category.variant}>{groupedInterviews[category.id].length}</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {category.id === "upcoming" ? "Upcoming interviews" :
                      category.id === "completed" ? "Awaiting review" :
                        category.id === "succeeded" ? "Successfully completed" : ""}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groupedInterviews[category.id].map((interview: Interview) => {
                    const candidateInfo = getCandidateInfo(users, interview.candidateId);
                    const startTime = new Date(interview.startTime);

                    return (
                      <Card className="hover:shadow-md transition-all" key={interview._id}>
                        {/* CANDIDATE INFO */}
                        <CardHeader className="p-3 sm:p-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 sm:h-10 sm:w-10">
                              <AvatarImage src={candidateInfo.image} />
                              <AvatarFallback>{candidateInfo.initials}</AvatarFallback>
                            </Avatar>
                            <div className="overflow-hidden">
                              <CardTitle className="text-base truncate">{candidateInfo.name}</CardTitle>
                              <p className="text-xs sm:text-sm text-muted-foreground truncate">{interview.title}</p>
                            </div>
                          </div>
                        </CardHeader>

                        {/* DATE &  TIME */}
                        <CardContent className="p-3 sm:p-4">
                          <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <CalendarIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                              {format(startTime, "MMM dd")}
                            </div>
                            <div className="flex items-center gap-1">
                              <ClockIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                              {format(startTime, "h:mm a")}
                            </div>
                          </div>
                        </CardContent>

                        {/* PASS & FAIL BUTTONS */}
                        <CardFooter className="p-3 sm:p-4 pt-0 flex flex-col gap-3">
                          {interview.status === "completed" && (
                            <div className="flex gap-2 w-full">
                              <Button
                                className="flex-1 h-8 sm:h-9 text-xs sm:text-sm"
                                onClick={() => handleStatusUpdate(interview._id, "succeeded")}
                              >
                                <CheckCircle2Icon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                Pass
                              </Button>
                              <Button
                                variant="destructive"
                                className="flex-1 h-8 sm:h-9 text-xs sm:text-sm"
                                onClick={() => handleStatusUpdate(interview._id, "completed")}
                              >
                                <XCircleIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                Fail
                              </Button>
                            </div>
                          )}
                          {/* Center-aligned comment dialog */}
                          <div className="flex justify-center w-full">
                            <div className="w-full sm:max-w-xs">
                              <CenteredCommentDialog interviewId={interview._id} />
                            </div>
                          </div>
                        </CardFooter>
                      </Card>
                    );
                  })}
                </div>
              </section>
            )
        )}

        {/* EMPTY STATE */}
        {Object.keys(groupedInterviews).length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="rounded-full bg-primary/10 p-4 mb-4">
              <CalendarIcon className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-medium mb-2">No interviews yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              You don't have any scheduled interviews yet. Start by scheduling a new interview.
            </p>
            <Link href="/schedule">
              <Button>Schedule New Interview</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
