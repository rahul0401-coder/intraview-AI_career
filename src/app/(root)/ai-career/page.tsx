"use client";

import { useUserRole } from "@/hooks/useUserRole";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import LoaderUI from "@/components/LoaderUI";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AICareerSection from "@/components/AICareerSection";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp, User, Award, Brain } from "lucide-react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

// Define interview data type that works with both mock and real data
type InterviewData = {
    id: number | Id<"mockInterviews">;
    title: string;
    score: number;
    completedAt: string;
    questions: number;
};

// Mock interview data - this would normally come from your database
const mockInterviewHistory: InterviewData[] = [
    { id: 1, title: "JavaScript Fundamentals", score: 85, completedAt: "2023-06-15", questions: 10 },
    { id: 2, title: "React Interview Prep", score: 92, completedAt: "2023-07-02", questions: 15 },
    { id: 3, title: "Web Development Concepts", score: 78, completedAt: "2023-07-18", questions: 12 },
];

export default function AICareerPage() {
    const { isCandidate, isLoading } = useUserRole();
    const router = useRouter();
    const [isCheckingProfile, setIsCheckingProfile] = useState(true);
    const [userProfile, setUserProfile] = useState<any>(null);
    const [interviewData, setInterviewData] = useState<InterviewData[]>([]);

    // Get user profile from Convex
    const convexUserProfile = useQuery(api.userSkillsProfile.getUserProfile);

    // Get mock interviews from Convex
    const mockInterviews = useQuery(api.mockInterviews.getAll);

    // Debug logging for profile state
    useEffect(() => {
        console.log("Profile state:", {
            convexUserProfile,
            isProfileDefined: convexUserProfile !== undefined,
            isProfileNull: convexUserProfile === null,
            hasProfile: Boolean(convexUserProfile)
        });
    }, [convexUserProfile]);

    // Redirect non-candidates away from this page
    useEffect(() => {
        if (!isLoading && !isCandidate) {
            router.push("/");
        }
    }, [isCandidate, isLoading, router]);

    // Check if user profile exists and load interview data
    useEffect(() => {
        // First, wait until the query has completed (not undefined)
        if (convexUserProfile === undefined) {
            console.log("Profile query still loading...");
            return;
        }

        // If we get here, the query has completed
        console.log("Profile query completed:", convexUserProfile);

        if (convexUserProfile) {
            // User has a profile
            console.log("User has a profile, staying on AI Career page");
            setUserProfile(convexUserProfile);
            setIsCheckingProfile(false);
        } else {
            // convexUserProfile is null - user exists but doesn't have a profile
            console.log("User exists but has no profile, redirecting to profile page");
            router.push("/ai-career/profile");
        }
    }, [convexUserProfile, router]);

    // Load interview data when available
    useEffect(() => {
        if (mockInterviews) {
            // Transform data format if needed
            const formattedInterviews = mockInterviews
                .filter(interview => interview.status === "completed")
                .map(interview => ({
                    id: interview._id,
                    title: interview.title,
                    score: interview.score || 0,
                    completedAt: interview.completedAt
                        ? new Date(interview.completedAt).toLocaleDateString()
                        : "In progress",
                    questions: interview.questions.length
                }));

            setInterviewData(formattedInterviews);
        } else {
            // Fallback to mock data if no interviews exist yet
            setInterviewData(mockInterviewHistory);
        }
    }, [mockInterviews]);

    // Calculate average score
    const averageScore = interviewData.length > 0
        ? Math.round(interviewData.reduce((sum, interview) => sum + interview.score, 0) / interviewData.length)
        : 0;

    if (isLoading || isCheckingProfile) {
        return <LoaderUI />;
    }

    return (
        <div className="container max-w-7xl mx-auto p-6 space-y-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Link href="/">
                        <Button variant="outline" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">
                        AI Career Tools
                    </h1>
                </div>
                <Button
                    variant="outline"
                    onClick={() => router.push("/ai-career/profile")}
                    className="border-blue-600/20 hover:bg-blue-50/10"
                    size="sm"
                >
                    <User className="h-4 w-4 mr-2" />
                    {userProfile ? "Update Profile" : "Create Profile"}
                </Button>
            </div>

            {!userProfile && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-amber-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-amber-800">
                                Complete your profile
                            </h3>
                            <div className="mt-2 text-sm text-amber-700">
                                <p>
                                    Creating a profile will help us provide personalized career recommendations and industry insights.
                                </p>
                            </div>
                            <div className="mt-4">
                                <Button
                                    size="sm"
                                    onClick={() => router.push("/ai-career/profile")}
                                >
                                    Create Profile Now
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {userProfile && (
                <div className="bg-muted/30 p-3 rounded-lg flex items-center justify-between">
                    <div className="flex items-center">
                        <span className="text-sm text-muted-foreground mr-2">Industry:</span>
                        <span className="font-medium">{userProfile.industry}</span>
                    </div>
                    <Link href="/ai-career/industry-insights">
                        <Button variant="default" size="sm">
                            <TrendingUp className="h-4 w-4 mr-2" />
                            View Industry Insights
                        </Button>
                    </Link>
                </div>
            )}

            <Tabs defaultValue="tools" className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="tools">Tools</TabsTrigger>
                    <TabsTrigger value="interview-history">Interview History</TabsTrigger>
                </TabsList>

                <TabsContent value="tools" className="mt-6">
                    <AICareerSection />
                </TabsContent>

                <TabsContent value="interview-history" className="mt-6">
                    <Card className="border border-muted/40">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center">
                                        <Brain className="mr-2 h-5 w-5 text-blue-600" />
                                        Mock Interview Performance
                                    </CardTitle>
                                    <CardDescription>
                                        Track your interview performance and scores
                                    </CardDescription>
                                </div>
                                <div className="bg-muted/30 px-4 py-2 rounded-lg text-center">
                                    <div className="text-sm text-muted-foreground">Average Score</div>
                                    <div className="text-2xl font-bold text-blue-600">{averageScore}%</div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {interviewData.length > 0 ? (
                                <div className="space-y-4">
                                    {interviewData.map(interview => (
                                        <Card key={interview.id} className="border border-muted/40">
                                            <CardContent className="p-4">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h3 className="font-medium">{interview.title}</h3>
                                                        <p className="text-sm text-muted-foreground">
                                                            Completed on {interview.completedAt} • {interview.questions} questions
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center">
                                                        <Award className={`h-5 w-5 mr-2 ${interview.score >= 90 ? "text-green-500" :
                                                            interview.score >= 70 ? "text-blue-600" :
                                                                "text-orange-500"
                                                            }`} />
                                                        <span className="text-xl font-bold">{interview.score}%</span>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-10">
                                    <p className="text-muted-foreground">No mock interviews completed yet.</p>
                                    <Button
                                        onClick={() => router.push("/ai-career/interview")}
                                        className="mt-4"
                                    >
                                        Start Your First Interview
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
} 