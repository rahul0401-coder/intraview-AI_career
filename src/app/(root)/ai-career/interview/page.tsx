"use client";

import { useUserRole } from "@/hooks/useUserRole";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import LoaderUI from "@/components/LoaderUI";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Brain, CheckCircle2, UserPlus, ListChecks } from "lucide-react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../../../../convex/_generated/dataModel";

// Mock data for interviews
const MOCK_QUESTIONS = [
    {
        id: 1,
        question: "Can you explain the concept of closures in JavaScript?",
        options: [
            "Closures are a way to create private variables in JavaScript.",
            "Closures occur when a function 'remembers' its lexical scope even when executed outside that scope.",
            "Closures are the same as callbacks in JavaScript.",
            "Closures are an outdated concept in modern JavaScript."
        ],
        correctAnswer: "Closures occur when a function 'remembers' its lexical scope even when executed outside that scope.",
        explanation: "A closure is the combination of a function and the lexical environment within which that function was declared. This environment consists of any local variables that were in-scope at the time the closure was created. Closures allow a function to access variables from an enclosing scope even after it leaves the scope in which it was declared."
    },
    {
        id: 2,
        question: "What's the difference between 'let', 'const', and 'var' in JavaScript?",
        options: [
            "They're all identical ways to declare variables.",
            "'var' has block scope, while 'let' and 'const' have function scope.",
            "'let' and 'const' have block scope, while 'var' has function scope.",
            "'const' cannot be reassigned, 'let' can be reassigned, and 'var' is deprecated."
        ],
        correctAnswer: "'let' and 'const' have block scope, while 'var' has function scope.",
        explanation: "'var' declarations are globally scoped or function scoped, while 'let' and 'const' are block scoped. 'const' declarations cannot be reassigned after declaration, while 'let' and 'var' can be reassigned. 'var' variables can be used before they are declared (due to hoisting), while 'let' and 'const' are not initialized until their definition is evaluated."
    }
];

export default function InterviewPage() {
    const { isCandidate, isLoading } = useUserRole();
    const router = useRouter();
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState<string[]>([]);
    const [showExplanation, setShowExplanation] = useState(false);
    const [quizCompleted, setQuizCompleted] = useState(false);
    const [interviewId, setInterviewId] = useState<Id<"mockInterviews"> | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [currentQuestions, setCurrentQuestions] = useState(MOCK_QUESTIONS);
    const [loadingInterview, setLoadingInterview] = useState(true);

    // Get user profile and interview history from Convex
    const userProfile = useQuery(api.userSkillsProfile.getUserProfile);
    const interviewHistory = useQuery(api.mockInterviews.getAll);
    const inProgressInterviews = useQuery(api.mockInterviews.getInProgress);

    // Convex mutations
    const createMockInterview = useMutation(api.mockInterviews.create);
    const generateMockInterview = useMutation(api.mockInterviews.generateMockInterview);
    const submitAnswer = useMutation(api.mockInterviews.submitAnswer);
    const completeMockInterview = useMutation(api.mockInterviews.complete);

    // Redirect non-candidates away from this page
    useEffect(() => {
        if (!isLoading && !isCandidate) {
            router.push("/");
        }
    }, [isCandidate, isLoading, router]);

    // Check for in-progress interviews
    useEffect(() => {
        if (inProgressInterviews && inProgressInterviews.length > 0) {
            // Use the most recent in-progress interview
            const latestInterview = inProgressInterviews[0];
            setInterviewId(latestInterview._id);

            // Set up questions from the saved interview
            setCurrentQuestions(latestInterview.questions.map((q, index) => ({
                id: index + 1,
                question: q.question,
                options: q.options,
                correctAnswer: q.correctAnswer,
                explanation: q.explanation
            })));

            // Set up answers from any saved user responses
            const savedAnswers = new Array(latestInterview.questions.length).fill("");
            latestInterview.questions.forEach((q, index) => {
                if (q.userAnswer) {
                    savedAnswers[index] = q.userAnswer;
                }
            });
            setAnswers(savedAnswers);

            // Find the first unanswered question to start with
            const firstUnansweredIndex = savedAnswers.findIndex(a => !a);
            if (firstUnansweredIndex !== -1) {
                setCurrentQuestion(firstUnansweredIndex);
            }

            toast.info("Continuing your in-progress interview");
        } else {
            // No in-progress interviews, just set up with the default questions
            setAnswers(new Array(MOCK_QUESTIONS.length).fill(""));
        }

        setLoadingInterview(false);
    }, [inProgressInterviews]);

    // Debug logging for user profile and questions
    useEffect(() => {
        if (userProfile) {
            console.log("User Profile loaded:", userProfile);
            console.log("User Skills:", userProfile.skills);
        }
    }, [userProfile]);

    // Debug logging for interview data
    useEffect(() => {
        if (inProgressInterviews && inProgressInterviews.length > 0) {
            console.log("In-progress interview found:", inProgressInterviews[0]);
            console.log("Interview questions:", inProgressInterviews[0].questions);
        }
    }, [inProgressInterviews]);

    if (isLoading || loadingInterview) {
        return <LoaderUI />;
    }

    const handleAnswer = async (answer: string) => {
        const newAnswers = [...answers];
        newAnswers[currentQuestion] = answer;
        setAnswers(newAnswers);

        // If interview is already created, submit the answer to Convex
        if (interviewId) {
            try {
                await submitAnswer({
                    interviewId,
                    questionIndex: currentQuestion,
                    answer
                });
            } catch (error) {
                console.error("Failed to submit answer:", error);
                // Continue with the local answer even if DB submission fails
            }
        }
    };

    const handleNext = () => {
        if (currentQuestion < currentQuestions.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
            setShowExplanation(false);
        } else {
            // Finish quiz
            setQuizCompleted(true);

            // If interview is already created, complete it in Convex
            if (interviewId) {
                completeMockInterview({ interviewId })
                    .then(() => {
                        toast.success("Interview completed and saved to your history!");
                    })
                    .catch(error => {
                        console.error("Failed to complete interview:", error);
                        toast.error("Failed to save your completed interview");
                    });
            }
        }
    };

    const calculateScore = () => {
        let correct = 0;
        answers.forEach((answer, index) => {
            if (answer === currentQuestions[index].correctAnswer) {
                correct++;
            }
        });
        return (correct / currentQuestions.length) * 100;
    };

    const startNewQuiz = async () => {
        setIsSaving(true);

        try {
            console.log("Starting new quiz with userProfile:", userProfile);
            // Generate a new mock interview using the skills-aware function
            const newInterviewId = await generateMockInterview({
                difficultyLevel: "intermediate",
                numberOfQuestions: 10 // Request up to 10 questions for a more thorough interview experience
            });

            console.log("New interview created with ID:", newInterviewId);

            // Store the new interview ID
            setInterviewId(newInterviewId);

            // Reset the interface state
            setCurrentQuestion(0);
            setShowExplanation(false);
            setQuizCompleted(false);

            // We need to reload the page to get the new interview data via the useQuery hook
            // or we can redirect to this page with the interview ID
            console.log("Will reload page in 500ms to load the new interview");
            setTimeout(() => {
                // This gives Convex time to process the created interview
                window.location.reload();
            }, 500);

            toast.success("New interview created with personalized questions based on your skills");
        } catch (error) {
            console.error("Failed to create new interview:", error);
            toast.error("Failed to start new interview");

            // Fallback to default questions
            setCurrentQuestions(MOCK_QUESTIONS);
            setAnswers(new Array(MOCK_QUESTIONS.length).fill(""));
        } finally {
            setIsSaving(false);
        }
    };

    // Transform interview history data for display
    const displayInterviewHistory = interviewHistory
        ? interviewHistory
            .filter(interview => interview.status === "completed")
            .map(interview => ({
                id: interview._id,
                title: interview.title,
                score: interview.score || 0,
                completedAt: interview.completedAt
                    ? new Date(interview.completedAt).toLocaleDateString()
                    : "Recently",
                feedback: interview.feedback || "No feedback available"
            }))
        : [];

    return (
        <div className="container max-w-7xl mx-auto p-6 space-y-8">
            <div className="flex items-center space-x-4">
                <Link href="/ai-career">
                    <Button variant="outline" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">
                    Mock Interviews
                </h1>
            </div>

            <Tabs defaultValue="interview" className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-3">
                    <TabsTrigger value="interview">Interview</TabsTrigger>
                    <TabsTrigger value="history">History</TabsTrigger>
                    <TabsTrigger value="tips">Tips</TabsTrigger>
                </TabsList>

                <TabsContent value="interview" className="mt-6">
                    {quizCompleted ? (
                        <Card className="border border-muted/40">
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <CheckCircle2 className="mr-2 h-5 w-5 text-teal-500" />
                                    Interview Completed
                                </CardTitle>
                                <CardDescription>
                                    You've completed the mock interview. Here's your performance:
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex justify-center">
                                        <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center">
                                            <span className="text-3xl font-bold">{calculateScore().toFixed(0)}%</span>
                                        </div>
                                    </div>

                                    <div className="space-y-4 mt-6">
                                        {currentQuestions.map((question, index) => (
                                            <Card key={index} className={answers[index] === question.correctAnswer ? "border-teal-500" : "border-red-500"}>
                                                <CardHeader className="pb-2">
                                                    <div className="flex justify-between">
                                                        <CardTitle className="text-lg">{question.question}</CardTitle>
                                                        {answers[index] === question.correctAnswer ? (
                                                            <Badge className="bg-teal-500">Correct</Badge>
                                                        ) : (
                                                            <Badge className="bg-red-500">Incorrect</Badge>
                                                        )}
                                                    </div>
                                                </CardHeader>
                                                <CardContent>
                                                    <p className="font-medium">Your answer:</p>
                                                    <p className="text-muted-foreground">{answers[index]}</p>

                                                    <p className="font-medium mt-2">Correct answer:</p>
                                                    <p className="text-muted-foreground">{question.correctAnswer}</p>

                                                    <div className="mt-4 p-4 bg-muted rounded-lg">
                                                        <p className="font-medium">Explanation:</p>
                                                        <p className="text-muted-foreground">{question.explanation}</p>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button
                                    onClick={startNewQuiz}
                                    className="w-full bg-blue-600 hover:bg-blue-700"
                                    disabled={isSaving}
                                >
                                    {isSaving ? "Creating New Interview..." : "Start New Interview"}
                                </Button>
                            </CardFooter>
                        </Card>
                    ) : (
                        <Card className="border border-muted/40">
                            {currentQuestions.length > 0 ? (
                                <>
                                    <CardHeader>
                                        <CardTitle>
                                            Question {currentQuestion + 1} of {currentQuestions.length}
                                        </CardTitle>
                                        <CardDescription>
                                            Select the best answer for the question below
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <p className="text-lg font-medium">{currentQuestions[currentQuestion].question}</p>
                                        <RadioGroup
                                            onValueChange={handleAnswer}
                                            value={answers[currentQuestion]}
                                            className="space-y-2"
                                        >
                                            {currentQuestions[currentQuestion].options.map((option, index) => (
                                                <div key={index} className="flex items-center space-x-2">
                                                    <RadioGroupItem value={option} id={`option-${index}`} />
                                                    <Label htmlFor={`option-${index}`}>{option}</Label>
                                                </div>
                                            ))}
                                        </RadioGroup>

                                        {showExplanation && (
                                            <div className="mt-4 p-4 bg-muted rounded-lg">
                                                <p className="font-medium">Explanation:</p>
                                                <p className="text-muted-foreground">{currentQuestions[currentQuestion].explanation}</p>
                                            </div>
                                        )}
                                    </CardContent>
                                    <CardFooter className="flex justify-between">
                                        {!showExplanation && (
                                            <Button
                                                onClick={() => setShowExplanation(true)}
                                                variant="outline"
                                                disabled={!answers[currentQuestion]}
                                            >
                                                Show Explanation
                                            </Button>
                                        )}
                                        <Button
                                            onClick={handleNext}
                                            disabled={!answers[currentQuestion]}
                                            className="ml-auto bg-blue-600 hover:bg-blue-700"
                                        >
                                            {currentQuestion < currentQuestions.length - 1
                                                ? "Next Question"
                                                : "Finish Interview"}
                                        </Button>
                                    </CardFooter>
                                </>
                            ) : (
                                <CardContent className="flex flex-col items-center justify-center p-10">
                                    <Brain className="h-16 w-16 text-muted mb-4" />
                                    <CardTitle className="text-xl mb-2">Ready for your mock interview?</CardTitle>
                                    <CardDescription className="text-center mb-6">
                                        Test your knowledge with interview questions personalized for your skills profile.
                                        {userProfile && userProfile.skills && userProfile.skills.length > 0 ? (
                                            <span className="block mt-2 font-medium text-blue-600">
                                                Questions will be tailored to your skills: {userProfile.skills.slice(0, 3).join(", ")}
                                                {userProfile.skills.length > 3 ? ` and ${userProfile.skills.length - 3} more` : ""}
                                                <br />
                                                <span className="text-sm text-blue-500 mt-1 block">Each skill category has 5 specialized questions!</span>
                                            </span>
                                        ) : (
                                            <span className="block mt-2 text-amber-600">
                                                <Link href="/ai-career/profile" className="font-medium hover:underline">
                                                    Update your profile with skills
                                                </Link> like JavaScript, React, Python, Java, SQL, or DevOps to get specialized questions!
                                            </span>
                                        )}
                                    </CardDescription>
                                    <Button
                                        onClick={startNewQuiz}
                                        className="bg-blue-600 hover:bg-blue-700"
                                        disabled={isSaving}
                                    >
                                        {isSaving ? "Creating Interview..." : "Start Mock Interview"}
                                    </Button>
                                </CardContent>
                            )}
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="history" className="mt-6">
                    <Card className="border border-muted/40">
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <ListChecks className="mr-2 h-5 w-5 text-blue-600" />
                                Interview History
                            </CardTitle>
                            <CardDescription>
                                Review your past performance and track your improvement
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {displayInterviewHistory.length > 0 ? (
                                <div className="space-y-4">
                                    {displayInterviewHistory.map((interview) => (
                                        <Card key={interview.id} className="border border-muted/40">
                                            <CardHeader className="pb-2">
                                                <div className="flex justify-between">
                                                    <CardTitle className="text-lg">{interview.title}</CardTitle>
                                                    <Badge className={interview.score >= 90 ? "bg-teal-500" :
                                                        interview.score >= 70 ? "bg-blue-600" :
                                                            "bg-orange-500"}>
                                                        {interview.score}%
                                                    </Badge>
                                                </div>
                                                <CardDescription>Completed {interview.completedAt}</CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <p className="text-sm text-muted-foreground">
                                                    {interview.feedback}
                                                </p>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-10">
                                    <p className="text-muted-foreground">No interviews completed yet. Start a mock interview to see your results here.</p>
                                    <Button
                                        onClick={startNewQuiz}
                                        className="mt-4"
                                    >
                                        Start Your First Interview
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="tips" className="mt-6">
                    <Card className="border border-muted/40">
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <UserPlus className="mr-2 h-5 w-5 text-teal-500" />
                                Interview Tips
                            </CardTitle>
                            <CardDescription>
                                Expert advice to help you succeed in technical interviews
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="p-4 border rounded-lg">
                                    <h3 className="font-semibold text-lg mb-2">Understand the problem before coding</h3>
                                    <p className="text-muted-foreground">
                                        Take time to fully understand the problem statement. Ask clarifying questions if needed. Consider edge cases and constraints before writing any code.
                                    </p>
                                </div>

                                <div className="p-4 border rounded-lg">
                                    <h3 className="font-semibold text-lg mb-2">Think aloud</h3>
                                    <p className="text-muted-foreground">
                                        Explain your thought process as you work through the problem. This helps the interviewer understand your approach and provides them with insight into how you think.
                                    </p>
                                </div>

                                <div className="p-4 border rounded-lg">
                                    <h3 className="font-semibold text-lg mb-2">Practice whiteboarding</h3>
                                    <p className="text-muted-foreground">
                                        Many interviews involve coding on a whiteboard or in a simple text editor without autocomplete. Practice coding without IDE features to prepare yourself.
                                    </p>
                                </div>

                                <div className="p-4 border rounded-lg">
                                    <h3 className="font-semibold text-lg mb-2">Review core concepts</h3>
                                    <p className="text-muted-foreground">
                                        Ensure you have a solid understanding of data structures, algorithms, and language fundamentals. These form the basis of most technical interviews.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
} 