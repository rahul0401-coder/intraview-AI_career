"use client";

import { useUserRole } from "@/hooks/useUserRole";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import CodeEditor from "@/components/CodeEditor";
import LoaderUI from "@/components/LoaderUI";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function PracticePage() {
    const { isCandidate, isLoading } = useUserRole();
    const router = useRouter();
    const [showAICareerPrompt, setShowAICareerPrompt] = useState(true);

    // Redirect non-candidates away from this page
    useEffect(() => {
        if (!isLoading && !isCandidate) {
            router.push("/");
        }
    }, [isCandidate, isLoading, router]);

    if (isLoading) {
        return <LoaderUI />;
    }

    return (
        <div className="h-[calc(100vh-4rem)] relative">
            {showAICareerPrompt && (
                <div className="absolute top-4 right-4 z-10 w-80">
                    <Card className="border-blue-200 bg-blue-50/70 backdrop-blur-sm shadow-md">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg flex items-center">
                                <Brain className="w-5 h-5 mr-2 text-blue-600" />
                                Prepare for interviews
                            </CardTitle>
                            <CardDescription>
                                Get ready for your upcoming technical interviews
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm">
                                Try our AI-powered mock interviews to practice answering common technical questions and improve your skills.
                            </p>
                        </CardContent>
                        <CardFooter className="flex justify-between pt-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowAICareerPrompt(false)}
                            >
                                Dismiss
                            </Button>
                            <Link href="/ai-career/interview">
                                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                                    Practice Now
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                        </CardFooter>
                    </Card>
                </div>
            )}
            <CodeEditor isInterview={false} />
        </div>
    );
} 