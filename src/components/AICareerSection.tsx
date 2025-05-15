"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Brain, Target, TrendingUp } from "lucide-react";

export default function AICareerSection() {
    const router = useRouter();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">
                    AI Career Preparation
                </h2>
                <Button
                    onClick={() => router.push("/ai-career")}
                    variant="outline"
                    className="border-blue-600/20 hover:bg-blue-50/10"
                >
                    View All Tools
                </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <Card className="hover:shadow-md transition-all cursor-pointer border border-muted/40"
                    onClick={() => router.push("/ai-career/industry-insights")}>
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-lg">Industry Insights</CardTitle>
                            <TrendingUp className="h-5 w-5 text-blue-600" />
                        </div>
                        <CardDescription>Explore industry growth and trends</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            Get personalized data on job market trends, salary ranges, and in-demand skills for your industry.
                        </p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-all cursor-pointer border border-muted/40"
                    onClick={() => router.push("/ai-career/interview")}>
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-lg">Mock Interviews</CardTitle>
                            <Brain className="h-5 w-5 text-blue-600" />
                        </div>
                        <CardDescription>Practice with AI-powered interview simulations</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            Get feedback on your responses and improve your interview skills with industry-specific questions.
                        </p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-all cursor-pointer border border-muted/40"
                    onClick={() => router.push("/ai-career/resume")}>
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-lg">Resume Builder</CardTitle>
                            <Target className="h-5 w-5 text-teal-500" />
                        </div>
                        <CardDescription>Create and optimize your resume</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            Build a professional resume with AI-powered suggestions tailored to your target role.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
} 