import { useState, useRef } from "react";
import { Button } from "./ui/button";
import { PlusIcon, XIcon, AlertCircle } from "lucide-react";
import { CodeQuestion } from "@/constants";
import { toast } from "sonner";

interface Example {
    input: string;
    output: string;
    explanation?: string;
}

interface SimpleCustomQuestionFormProps {
    onQuestionCreate: (question: CodeQuestion) => void;
    onClose: () => void;
}

export default function SimpleCustomQuestionForm({
    onQuestionCreate,
    onClose
}: SimpleCustomQuestionFormProps) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [examples, setExamples] = useState<Example[]>([{ input: "", output: "", explanation: "" }]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const formRef = useRef<HTMLFormElement>(null);

    const validateForm = () => {
        if (!title.trim()) {
            toast.error("Please enter a question title");
            return false;
        }
        if (!description.trim()) {
            toast.error("Please enter a question description");
            return false;
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;
        setIsSubmitting(true);

        try {
            const customQuestion: CodeQuestion = {
                id: `custom-${Date.now()}`,
                title: title.trim(),
                description: description.trim(),
                examples: examples.filter(ex => ex.input.trim() && ex.output.trim()),
                starterCode: {
                    javascript: "// Write your solution here\n",
                    python: "# Write your solution here\n",
                    java: "// Write your solution here\n",
                },
            };

            await onQuestionCreate(customQuestion);
            onClose();
        } catch (error) {
            console.error("Failed to create custom question:", error);
            if (error instanceof Error) {
                toast.error(`Failed to create custom question: ${error.message}`);
            } else {
                toast.error("Failed to create custom question");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const addExample = () => {
        if (examples.length >= 5) {
            toast.error("Maximum 5 examples allowed");
            return;
        }
        setExamples([...examples, { input: "", output: "", explanation: "" }]);
    };

    const removeExample = (index: number) => {
        if (examples.length > 1) {
            setExamples(examples.filter((_, i) => i !== index));
        }
    };

    const updateExample = (index: number, field: keyof Example, value: string) => {
        const newExamples = [...examples];
        newExamples[index] = { ...newExamples[index], [field]: value };
        setExamples(newExamples);
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-[9999]">
            <div className="bg-background border rounded-lg shadow-lg p-6 w-[90%] max-w-[600px] max-h-[85vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Create Custom Question</h2>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        type="button"
                        className="size-8"
                    >
                        <XIcon className="h-4 w-4" />
                    </Button>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-3 rounded-md mb-4 text-sm">
                    <p className="text-blue-700 dark:text-blue-300 font-medium">Note: Custom questions will be immediately visible to the candidate in this interview session.</p>
                </div>

                <form ref={formRef} onSubmit={handleSubmit}>
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label htmlFor="title" className="text-sm font-medium flex items-center gap-2">
                                Question Title
                                <span className="text-xs text-muted-foreground">(max 100 characters)</span>
                            </label>
                            <input
                                type="text"
                                id="title"
                                name="title"
                                placeholder="Enter question title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                maxLength={100}
                                autoComplete="off"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            />
                            {title.length > 80 && (
                                <p className="text-xs text-yellow-500">
                                    {100 - title.length} characters remaining
                                </p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="description" className="text-sm font-medium flex items-center gap-2">
                                Question Description
                                <span className="text-xs text-muted-foreground">(max 1000 characters)</span>
                            </label>
                            <textarea
                                id="description"
                                name="description"
                                placeholder="Enter question description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                maxLength={1000}
                                rows={4}
                                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            ></textarea>
                            {description.length > 800 && (
                                <p className="text-xs text-yellow-500">
                                    {1000 - description.length} characters remaining
                                </p>
                            )}
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Examples (max 5)</span>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={addExample}
                                    disabled={examples.length >= 5}
                                >
                                    Add Example
                                </Button>
                            </div>

                            <div className="space-y-4">
                                {examples.map((example, index) => (
                                    <div
                                        key={index}
                                        className="space-y-4 rounded-lg border p-4 relative bg-background"
                                    >
                                        {examples.length > 1 && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="absolute right-2 top-2"
                                                onClick={() => removeExample(index)}
                                            >
                                                <XIcon className="h-4 w-4" />
                                            </Button>
                                        )}
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">
                                                Input
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="Example input"
                                                value={example.input}
                                                onChange={(e) => updateExample(index, "input", e.target.value)}
                                                maxLength={200}
                                                autoComplete="off"
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">
                                                Output
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="Example output"
                                                value={example.output}
                                                onChange={(e) => updateExample(index, "output", e.target.value)}
                                                maxLength={200}
                                                autoComplete="off"
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">
                                                Explanation (Optional)
                                            </label>
                                            <textarea
                                                placeholder="Example explanation"
                                                value={example.explanation || ""}
                                                onChange={(e) => updateExample(index, "explanation", e.target.value)}
                                                maxLength={500}
                                                rows={3}
                                                className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                            ></textarea>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-2 justify-end pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onClose}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={!title.trim() || !description.trim() || isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <AlertCircle className="mr-2 h-4 w-4 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    "Create Question"
                                )}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
} 