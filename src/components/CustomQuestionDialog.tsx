import { useState, useEffect, useRef } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { PlusIcon, XIcon, AlertCircle } from "lucide-react";
import { CodeQuestion } from "@/constants";
import { toast } from "sonner";

interface Example {
    input: string;
    output: string;
    explanation?: string;
}

interface CustomQuestionDialogProps {
    onQuestionCreate: (question: CodeQuestion) => void;
}

export default function CustomQuestionDialog({
    onQuestionCreate,
}: CustomQuestionDialogProps) {
    const [open, setOpen] = useState(false);
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
            setOpen(false);
            resetForm();
            toast.success("Custom question created successfully!");
        } catch (error) {
            toast.error("Failed to create custom question");
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setTitle("");
        setDescription("");
        setExamples([{ input: "", output: "", explanation: "" }]);
        setIsSubmitting(false);
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

    // Direct event handlers without using components
    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        console.log("Title change:", newValue);
        setTitle(newValue);
    };

    const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        console.log("Description change:", newValue);
        setDescription(newValue);
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(newOpen) => {
                if (!newOpen) {
                    resetForm();
                }
                setOpen(newOpen);
            }}
        >
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full justify-start">
                    <PlusIcon className="mr-2 h-4 w-4" />
                    Custom Question
                </Button>
            </DialogTrigger>
            <DialogContent
                style={{
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    maxWidth: '600px',
                    maxHeight: '85vh',
                    overflowY: 'auto',
                    zIndex: 50
                }}
            >
                <DialogHeader className="mb-4">
                    <DialogTitle className="text-xl font-semibold">Create Custom Question</DialogTitle>
                </DialogHeader>

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
                                onChange={handleTitleChange}
                                maxLength={100}
                                autoComplete="off"
                                className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
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
                                onChange={handleDescriptionChange}
                                maxLength={1000}
                                rows={4}
                                className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
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
                                                className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
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
                                                className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
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
                                                className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                            ></textarea>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
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
                </form>
            </DialogContent>
        </Dialog>
    );
} 