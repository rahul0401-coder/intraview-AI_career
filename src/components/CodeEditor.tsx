import { CODING_QUESTIONS, LANGUAGES, CodeQuestion } from "@/constants";
import { useState, useEffect, useCallback, useMemo } from "react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "./ui/resizable";
import { ScrollArea, ScrollBar } from "./ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { AlertCircleIcon, BookIcon, LightbulbIcon, PlusIcon } from "lucide-react";
import Editor from "@monaco-editor/react";
import SimpleCustomQuestionForm from "./SimpleCustomQuestionForm";
import { Separator } from "./ui/separator";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useUserRole } from "@/hooks/useUserRole";
import { Doc, Id } from "../../convex/_generated/dataModel";
import { useParams } from "next/navigation";
import { useDebounce } from "@/hooks/useDebounce";
import { toast } from "sonner";
import { Button } from "./ui/button";

interface CustomQuestionDoc extends Doc<"customQuestions"> {
    title: string;
    description: string;
    examples: Array<{
        input: string;
        output: string;
        explanation?: string;
    }>;
    starterCode: {
        javascript: string;
        python: string;
        java: string;
    };
}

interface LiveCodeChanges {
    _id: Id<"liveCodeSync">;
    _creationTime: number;
    interviewId: string;
    code: string;
    language: "javascript" | "python" | "java";
    lastUpdated: number;
    updatedBy: string;
    questionId?: string;
}

interface CustomQuestionResult extends Doc<"customQuestions"> {
    _id: Id<"customQuestions">;
    title: string;
    description: string;
    interviewId: string;
    examples: Array<{
        input: string;
        output: string;
        explanation?: string;
    }>;
    starterCode: {
        javascript: string;
        python: string;
        java: string;
    };
}

interface CodeEditorProps {
    isInterview?: boolean;
}

function CodeEditor({ isInterview = false }: CodeEditorProps) {
    const { isInterviewer, isLoading, user } = useUserRole();
    const params = useParams();
    // Generate a consistent practice ID if we're in practice mode and not in an interview
    const interviewId = isInterview ? (params?.id as string) : 'practice-mode';

    // Debug information
    console.log('User Role Debug:', {
        isInterviewer,
        isLoading,
        userRole: user?.role,
        isInterview,
        interviewId
    });

    const customQuestions = useQuery(api.customQuestions.getCustomQuestions, { interviewId }) ?? [];
    const createCustomQuestion = useMutation(api.customQuestions.createCustomQuestion);
    const updateCode = useMutation(api.liveCode.updateCode);
    const updateSelectedQuestion = useMutation(api.liveCode.updateSelectedQuestion);
    const liveCodeChanges = isInterview ? useQuery(api.liveCode.subscribeToCodeChanges, { interviewId }) as LiveCodeChanges | undefined : undefined;

    // State for local practice questions (not stored in the database)
    const [practiceQuestions, setPracticeQuestions] = useState<CustomQuestionDoc[]>([]);

    const [language, setLanguage] = useState<"javascript" | "python" | "java">(LANGUAGES[0].id);
    const [selectedQuestionId, setSelectedQuestionId] = useState<string>(CODING_QUESTIONS[0].id);
    const [code, setCode] = useState(CODING_QUESTIONS[0].starterCode[language]);
    const debouncedCode = useDebounce(code, 500);
    const [showCustomQuestionForm, setShowCustomQuestionForm] = useState(false);

    // Convert custom questions to the CodeQuestion format
    const allQuestions = useMemo(() => [
        ...CODING_QUESTIONS,
        ...(customQuestions as CustomQuestionDoc[]).map((q) => ({
            id: q._id,
            title: q.title,
            description: q.description,
            examples: q.examples || [],
            starterCode: q.starterCode,
        })),
        // Add local practice questions when in practice mode
        ...(!isInterview ? practiceQuestions.map((q) => ({
            id: q._id,
            title: q.title,
            description: q.description,
            examples: q.examples || [],
            starterCode: q.starterCode,
        })) : [])
    ], [customQuestions, practiceQuestions, isInterview]);

    // Get the currently selected question
    const selectedQuestion = useMemo(() =>
        allQuestions.find(q => q.id === selectedQuestionId) || CODING_QUESTIONS[0]
        , [allQuestions, selectedQuestionId]);

    // Sync with live code when it changes (only in interview mode)
    useEffect(() => {
        if (isInterview && liveCodeChanges && liveCodeChanges.code) {
            if (code !== liveCodeChanges.code) {
                setLanguage(liveCodeChanges.language);
                setCode(liveCodeChanges.code);
            }
        }
    }, [liveCodeChanges, isInterview, code]);

    // Update live code when local code changes (only in interview mode)
    const handleCodeUpdate = useCallback(async () => {
        if (isInterview && debouncedCode !== undefined) {
            try {
                await updateCode({
                    interviewId,
                    code: debouncedCode,
                    language,
                });
            } catch (error) {
                console.error("Error updating code:", error);
                toast.error("Failed to sync code changes. Please try again.");
            }
        }
    }, [debouncedCode, language, interviewId, updateCode, isInterview]);

    useEffect(() => {
        handleCodeUpdate();
    }, [handleCodeUpdate]);

    // Update handleQuestionChange to sync the selected question for all participants
    const handleQuestionChange = (questionId: string) => {
        const question = allQuestions.find((q) => q.id === questionId);
        if (question) {
            setSelectedQuestionId(questionId);

            // Update the selected question in the database when changed by the interviewer
            if (isInterview && isInterviewer) {
                updateSelectedQuestion({ interviewId, questionId })
                    .catch(error => {
                        console.error("Error updating selected question:", error);
                        toast.error("Failed to sync question selection. Please try again.");
                    });
            }

            if (isInterview && liveCodeChanges && liveCodeChanges.questionId === questionId) {
                setLanguage(liveCodeChanges.language);
                setCode(liveCodeChanges.code);
            } else {
                setCode(question.starterCode[language]);
            }
        }
    };

    // Update handleCustomQuestionCreate to ensure the new question is synchronized
    const handleCustomQuestionCreate = async (newQuestion: CodeQuestion) => {
        if (!interviewId) {
            toast.error("No interview ID found");
            return;
        }

        try {
            console.log('Creating custom question:', {
                title: newQuestion.title,
                description: newQuestion.description,
                examples: newQuestion.examples,
                starterCode: newQuestion.starterCode,
                interviewId,
            });

            // In practice mode, we'll handle the custom question locally instead of saving to the database
            if (!isInterview) {
                // Create a local ID with a timestamp
                const localId = `practice-custom-${Date.now()}`;

                // Create a custom question object that matches the structure we need
                const practiceQuestion: CustomQuestionDoc = {
                    _id: localId as unknown as Id<"customQuestions">,
                    _creationTime: Date.now(),
                    title: newQuestion.title,
                    description: newQuestion.description,
                    examples: newQuestion.examples || [],
                    starterCode: newQuestion.starterCode,
                    interviewId,
                    interviewerId: 'practice-user'
                };

                // Add the question to the practice questions array
                setPracticeQuestions(prev => [...prev, practiceQuestion]);

                // Select the new question
                handleQuestionChange(localId);

                toast.success("Custom question created successfully");
                return localId;
            }

            // For real interviews, continue with the normal flow
            const questionId = await createCustomQuestion({
                title: newQuestion.title,
                description: newQuestion.description,
                examples: newQuestion.examples || [],
                starterCode: newQuestion.starterCode,
                interviewId,
            });

            console.log("Created question with ID:", questionId);

            // After successful creation, select the new question and synchronize it
            if (questionId) {
                // First update the local state
                handleQuestionChange(questionId);

                // Explicitly synchronize this selection to ensure all participants see it
                if (isInterviewer) {
                    try {
                        await updateSelectedQuestion({ interviewId, questionId });
                    } catch (syncError) {
                        console.error("Error synchronizing question selection:", syncError);
                        // Don't show an error to the user here, as the question was created successfully
                    }
                }

                toast.success("Custom question created successfully");
                return questionId;
            } else {
                // Should not happen, but handle it just in case
                toast.error("Question was created but no ID was returned");
                return null;
            }
        } catch (error) {
            console.error("Error creating custom question:", error);
            // Provide more details in the error message
            if (error instanceof Error) {
                toast.error(`Failed to create custom question: ${error.message}`);
            } else {
                toast.error("Failed to create custom question");
            }
            throw error; // Re-throw to be caught by the dialog
        }
    };

    const handleLanguageChange = (newLanguage: "javascript" | "python" | "java") => {
        setLanguage(newLanguage);
        // Check if there's existing live code for this language in interview mode
        if (isInterview && liveCodeChanges && liveCodeChanges.questionId === selectedQuestion.id && liveCodeChanges.language === newLanguage) {
            setCode(liveCodeChanges.code);
        } else {
            setCode(selectedQuestion.starterCode[newLanguage]);
        }
    };

    // Add a method to handle the CustomQuestionDialog
    const openCustomQuestionForm = () => {
        setShowCustomQuestionForm(true);
    };

    const closeCustomQuestionForm = () => {
        setShowCustomQuestionForm(false);
    };

    return (
        <ResizablePanelGroup direction="vertical" className="min-h-[calc(100vh-4rem-1px)]">
            {/* QUESTION SECTION */}
            <ResizablePanel>
                <ScrollArea className="h-full">
                    <div className="p-6">
                        <div className="max-w-4xl mx-auto space-y-6">
                            {/* HEADER */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-2xl font-semibold tracking-tight">
                                            {selectedQuestion.title}
                                        </h2>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Choose your language and solve the problem
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Select
                                        value={selectedQuestionId}
                                        onValueChange={handleQuestionChange}
                                    >
                                        <SelectTrigger className="w-[280px]">
                                            <SelectValue>
                                                {selectedQuestion.title}
                                            </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {allQuestions.map((question) => (
                                                <SelectItem
                                                    key={question.id}
                                                    value={question.id}
                                                >
                                                    {question.title}
                                                </SelectItem>
                                            ))}
                                            {isInterviewer && (
                                                <>
                                                    <Separator className="my-2" />
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="w-full justify-start"
                                                        onClick={openCustomQuestionForm}
                                                    >
                                                        <PlusIcon className="mr-2 h-4 w-4" />
                                                        Custom Question
                                                    </Button>
                                                </>
                                            )}
                                        </SelectContent>
                                    </Select>

                                    <Select value={language} onValueChange={handleLanguageChange}>
                                        <SelectTrigger className="w-[150px]">
                                            <SelectValue>
                                                <div className="flex items-center gap-2">
                                                    <img
                                                        src={`/${language}.png`}
                                                        alt={language}
                                                        className="w-5 h-5 object-contain"
                                                    />
                                                    {LANGUAGES.find((l) => l.id === language)?.name}
                                                </div>
                                            </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {LANGUAGES.map((lang) => (
                                                <SelectItem key={lang.id} value={lang.id}>
                                                    <div className="flex items-center gap-2">
                                                        <img
                                                            src={`/${lang.id}.png`}
                                                            alt={lang.name}
                                                            className="w-5 h-5 object-contain"
                                                        />
                                                        {lang.name}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* PROBLEM DESC. */}
                            <Card>
                                <CardHeader className="flex flex-row items-center gap-2">
                                    <BookIcon className="h-5 w-5 text-primary/80" />
                                    <CardTitle>Problem Description</CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm leading-relaxed">
                                    <div className="prose prose-sm dark:prose-invert max-w-none">
                                        <p className="whitespace-pre-line">{selectedQuestion.description}</p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* PROBLEM EXAMPLES */}
                            <Card>
                                <CardHeader className="flex flex-row items-center gap-2">
                                    <LightbulbIcon className="h-5 w-5 text-yellow-500" />
                                    <CardTitle>Examples</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ScrollArea className="h-full w-full rounded-md border">
                                        <div className="p-4 space-y-4">
                                            {selectedQuestion.examples.map((example, index) => (
                                                <div key={index} className="space-y-2">
                                                    <p className="font-medium text-sm">Example {index + 1}:</p>
                                                    <ScrollArea className="h-full w-full rounded-md">
                                                        <pre className="bg-muted/50 p-3 rounded-lg text-sm font-mono">
                                                            <div>Input: {example.input}</div>
                                                            <div>Output: {example.output}</div>
                                                            {example.explanation && (
                                                                <div className="pt-2 text-muted-foreground">
                                                                    Explanation: {example.explanation}
                                                                </div>
                                                            )}
                                                        </pre>
                                                        <ScrollBar orientation="horizontal" />
                                                    </ScrollArea>
                                                </div>
                                            ))}
                                        </div>
                                        <ScrollBar />
                                    </ScrollArea>
                                </CardContent>
                            </Card>

                            {/* CONSTRAINTS */}
                            {(selectedQuestion as CodeQuestion).constraints && (
                                <Card>
                                    <CardHeader className="flex flex-row items-center gap-2">
                                        <AlertCircleIcon className="h-5 w-5 text-blue-500" />
                                        <CardTitle>Constraints</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="list-disc list-inside space-y-1.5 text-sm marker:text-muted-foreground">
                                            {(selectedQuestion as CodeQuestion).constraints?.map((constraint: string, index: number) => (
                                                <li key={index} className="text-muted-foreground">
                                                    {constraint}
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>
                    <ScrollBar />
                </ScrollArea>
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* CODE EDITOR */}
            <ResizablePanel>
                <Editor
                    height="100%"
                    defaultLanguage={language}
                    language={language}
                    value={code}
                    onChange={(value) => setCode(value || "")}
                    theme="vs-dark"
                    options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        lineNumbers: "on",
                        automaticLayout: true,
                        readOnly: !isInterviewer && isInterview,
                        scrollbar: {
                            alwaysConsumeMouseWheel: false,
                            useShadows: false
                        },
                        overviewRulerLanes: 0,
                        overviewRulerBorder: false,
                        hideCursorInOverviewRuler: true,
                        renderLineHighlight: "none",
                        fixedOverflowWidgets: true
                    }}
                    className="relative"
                />
            </ResizablePanel>

            {/* Render the custom question form when needed */}
            {showCustomQuestionForm && (
                <SimpleCustomQuestionForm
                    onQuestionCreate={handleCustomQuestionCreate}
                    onClose={closeCustomQuestionForm}
                />
            )}
        </ResizablePanelGroup>
    );
}

export default CodeEditor;

