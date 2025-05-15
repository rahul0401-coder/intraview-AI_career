"use client";

import { useUserRole } from "@/hooks/useUserRole";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import LoaderUI from "@/components/LoaderUI";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, FileText, RefreshCw, Plus } from "lucide-react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { toast } from "sonner";

// Define types for form data
interface WorkExperience {
    id: string;
    company: string;
    position: string;
    startDate: string;
    endDate: string;
    description: string;
}

interface Education {
    id: string;
    institution: string;
    degree: string;
    fieldOfStudy: string;
    startDate: string;
    endDate: string;
}

interface Project {
    id: string;
    title: string;
    description: string;
    link: string;
}

interface ResumeFormData {
    contactInfo: {
        email: string;
        mobile: string;
        linkedinUrl: string;
        twitterUrl: string;
    };
    professionalSummary: string;
    skills: string;
    workExperience: WorkExperience[];
    education: Education[];
    projects: Project[];
}

export default function ResumePage() {
    const { isCandidate, isLoading } = useUserRole();
    const router = useRouter();
    const [isGenerating, setIsGenerating] = useState(false);
    const [selectedResume, setSelectedResume] = useState<{
        _id: Id<"resumes">;
        title: string;
        content: string;
        updatedAt: number;
        jobDescription?: string;
    } | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isPreviewing, setIsPreviewing] = useState(false);

    // Resume form data
    const [formData, setFormData] = useState<ResumeFormData>({
        contactInfo: {
            email: "",
            mobile: "",
            linkedinUrl: "",
            twitterUrl: ""
        },
        professionalSummary: "",
        skills: "",
        workExperience: [
            {
                id: "exp1",
                company: "",
                position: "",
                startDate: "",
                endDate: "",
                description: ""
            }
        ],
        education: [
            {
                id: "edu1",
                institution: "",
                degree: "",
                fieldOfStudy: "",
                startDate: "",
                endDate: ""
            }
        ],
        projects: [
            {
                id: "proj1",
                title: "",
                description: "",
                link: ""
            }
        ]
    });

    // Convex mutations
    const createResume = useMutation(api.resumes.create);
    const updateResume = useMutation(api.resumes.update);
    const deleteResume = useMutation(api.resumes.remove);
    const userResumes = useQuery(api.resumes.getAll);

    // Redirect non-candidates away from this page
    useEffect(() => {
        if (!isLoading && !isCandidate) {
            router.push("/");
        }
    }, [isCandidate, isLoading, router]);

    if (isLoading) {
        return <LoaderUI />;
    }

    // Helper functions for form data manipulation
    const handleContactInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            contactInfo: {
                ...prev.contactInfo,
                [name]: value
            }
        }));
    };

    const handleTextAreaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const addWorkExperience = () => {
        const newId = `exp${formData.workExperience.length + 1}`;
        setFormData(prev => ({
            ...prev,
            workExperience: [
                ...prev.workExperience,
                {
                    id: newId,
                    company: "",
                    position: "",
                    startDate: "",
                    endDate: "",
                    description: ""
                }
            ]
        }));
    };

    const updateWorkExperience = (id: string, field: keyof WorkExperience, value: string) => {
        setFormData(prev => ({
            ...prev,
            workExperience: prev.workExperience.map(exp =>
                exp.id === id ? { ...exp, [field]: value } : exp
            )
        }));
    };

    const addEducation = () => {
        const newId = `edu${formData.education.length + 1}`;
        setFormData(prev => ({
            ...prev,
            education: [
                ...prev.education,
                {
                    id: newId,
                    institution: "",
                    degree: "",
                    fieldOfStudy: "",
                    startDate: "",
                    endDate: ""
                }
            ]
        }));
    };

    const updateEducation = (id: string, field: keyof Education, value: string) => {
        setFormData(prev => ({
            ...prev,
            education: prev.education.map(edu =>
                edu.id === id ? { ...edu, [field]: value } : edu
            )
        }));
    };

    const addProject = () => {
        const newId = `proj${formData.projects.length + 1}`;
        setFormData(prev => ({
            ...prev,
            projects: [
                ...prev.projects,
                {
                    id: newId,
                    title: "",
                    description: "",
                    link: ""
                }
            ]
        }));
    };

    const updateProject = (id: string, field: keyof Project, value: string) => {
        setFormData(prev => ({
            ...prev,
            projects: prev.projects.map(proj =>
                proj.id === id ? { ...proj, [field]: value } : proj
            )
        }));
    };

    const handleSubmit = async () => {
        setIsGenerating(true);

        try {
            // Format resume content as markdown
            const content = `
# Resume

## Contact Information
- Email: ${formData.contactInfo.email}
- Mobile: ${formData.contactInfo.mobile}
- LinkedIn: ${formData.contactInfo.linkedinUrl}
- Twitter: ${formData.contactInfo.twitterUrl}

## Professional Summary
${formData.professionalSummary}

## Skills
${formData.skills}

## Work Experience
${formData.workExperience.map(exp => `
### ${exp.position} at ${exp.company}
${exp.startDate} - ${exp.endDate}

${exp.description}
`).join('\n')}

## Education
${formData.education.map(edu => `
### ${edu.degree} in ${edu.fieldOfStudy}
${edu.institution}
${edu.startDate} - ${edu.endDate}
`).join('\n')}

## Projects
${formData.projects.map(proj => `
### ${proj.title}
${proj.description}
Link: ${proj.link}
`).join('\n')}
`;

            if (isEditing && selectedResume) {
                // Update existing resume
                await updateResume({
                    id: selectedResume._id,
                    title: "Professional Resume",
                    content: content,
                    jobDescription: formData.professionalSummary
                });
                toast.success("Resume updated successfully!");
            } else {
                // Create new resume
                await createResume({
                    title: "Professional Resume",
                    content: content,
                    jobDescription: formData.professionalSummary,
                    template: "professional"
                });
                toast.success("Resume created successfully!");
            }

            // Reset the form and editing state
            setIsEditing(false);
            setSelectedResume(null);
            setIsPreviewing(false);

        } catch (error) {
            console.error("Failed to save resume:", error);
            toast.error("Failed to save resume. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleEditResume = (resume: {
        _id: Id<"resumes">;
        title: string;
        content: string;
        updatedAt: number;
        jobDescription?: string;
    }) => {
        setSelectedResume(resume);
        setIsEditing(true);

        // Parse the content to populate the form
        try {
            const content = resume.content;

            // This is a simple parser - in a real app, you'd want a more robust parser
            const emailMatch = content.match(/Email: (.+)/);
            const mobileMatch = content.match(/Mobile: (.+)/);
            const linkedinMatch = content.match(/LinkedIn: (.+)/);
            const twitterMatch = content.match(/Twitter: (.+)/);

            const summarySection = content.split('## Professional Summary')[1]?.split('##')[0]?.trim() || '';
            const skillsSection = content.split('## Skills')[1]?.split('##')[0]?.trim() || '';

            // Parse work experience, education, projects (simplified)
            // In a real app, this would be more robust

            setFormData({
                contactInfo: {
                    email: emailMatch?.[1]?.trim() || '',
                    mobile: mobileMatch?.[1]?.trim() || '',
                    linkedinUrl: linkedinMatch?.[1]?.trim() || '',
                    twitterUrl: twitterMatch?.[1]?.trim() || ''
                },
                professionalSummary: summarySection,
                skills: skillsSection,
                // For simplicity, we'll keep the default work experience, education, and projects
                workExperience: [
                    {
                        id: "exp1",
                        company: "",
                        position: "",
                        startDate: "",
                        endDate: "",
                        description: ""
                    }
                ],
                education: [
                    {
                        id: "edu1",
                        institution: "",
                        degree: "",
                        fieldOfStudy: "",
                        startDate: "",
                        endDate: ""
                    }
                ],
                projects: [
                    {
                        id: "proj1",
                        title: "",
                        description: "",
                        link: ""
                    }
                ]
            });
        } catch (error) {
            console.error("Error parsing resume content:", error);
            toast.error("Failed to parse resume content.");
        }
    };

    const handleDeleteResume = async (resumeId: Id<"resumes">) => {
        try {
            await deleteResume({ id: resumeId });
            toast.success("Resume deleted successfully!");
            if (selectedResume?._id === resumeId) {
                setSelectedResume(null);
                setIsEditing(false);
                setIsPreviewing(false);
            }
        } catch (error) {
            console.error("Failed to delete resume:", error);
            toast.error("Failed to delete resume. Please try again.");
        }
    };

    const handlePreviewResume = (resume: {
        _id: Id<"resumes">;
        title: string;
        content: string;
        updatedAt: number;
        jobDescription?: string;
    }) => {
        setSelectedResume(resume);
        setIsPreviewing(true);
    };

    const downloadResume = () => {
        if (!selectedResume) return;

        // Create a temporary HTML element with the formatted resume content
        const element = document.createElement("div");
        element.className = "resume-for-pdf";

        // Add styles inline for the PDF
        const styleElement = document.createElement("style");
        styleElement.textContent = `
            .resume-for-pdf {
                font-family: Arial, sans-serif;
                max-width: 800px;
                margin: 0 auto;
                padding: 40px;
                color: black;
            }
            .resume-for-pdf h1 {
                font-size: 24px;
                margin-bottom: 10px;
                color: black;
            }
            .resume-for-pdf h2 {
                font-size: 20px;
                margin-top: 20px;
                margin-bottom: 10px;
                color: #2563eb;
                border-bottom: 1px solid #e5e7eb;
                padding-bottom: 5px;
            }
            .resume-for-pdf h3 {
                font-size: 18px;
                margin-top: 15px;
                margin-bottom: 5px;
                color: black;
            }
            .resume-for-pdf p {
                margin-bottom: 5px;
                color: black;
            }
            .resume-for-pdf ul {
                margin-left: 20px;
            }
            .resume-for-pdf .contact-info {
                margin-bottom: 20px;
            }
        `;
        document.head.appendChild(styleElement);

        // Create HTML content from markdown structure
        const contentLines = selectedResume.content.split('\n');
        let htmlContent = '';

        contentLines.forEach((line: string) => {
            if (line.startsWith('# ')) {
                htmlContent += `<h1>${line.substring(2)}</h1>`;
            } else if (line.startsWith('## ')) {
                htmlContent += `<h2>${line.substring(3)}</h2>`;
            } else if (line.startsWith('### ')) {
                htmlContent += `<h3>${line.substring(4)}</h3>`;
            } else if (line.startsWith('- ')) {
                htmlContent += `<p>• ${line.substring(2)}</p>`;
            } else if (line.trim() === '') {
                htmlContent += `<div style="height: 10px;"></div>`;
            } else {
                htmlContent += `<p>${line}</p>`;
            }
        });

        element.innerHTML = htmlContent;
        document.body.appendChild(element);

        // Use html2pdf library if available, otherwise use a simple approach
        if (typeof window !== 'undefined' && (window as any).html2pdf) {
            (window as any).html2pdf(element, {
                margin: 10,
                filename: `${selectedResume.title.replace(/\s+/g, '_')}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2 },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            });
        } else {
            // Fallback to print dialog if html2pdf is not available
            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.write(`
                    <html>
                    <head>
                        <title>${selectedResume.title}</title>
                        <style>
                            ${styleElement.textContent}
                        </style>
                    </head>
                    <body>
                        <div class="resume-for-pdf">
                            ${htmlContent}
                        </div>
                        <script>
                            window.onload = function() {
                                window.print();
                                setTimeout(function() { window.close(); }, 500);
                            };
                        </script>
                    </body>
                    </html>
                `);
                printWindow.document.close();
            } else {
                toast.error("Unable to open print window. Please check your browser settings.");
            }
        }

        // Clean up
        document.body.removeChild(element);
        document.head.removeChild(styleElement);
    };

    const resetForm = () => {
        setFormData({
            contactInfo: {
                email: "",
                mobile: "",
                linkedinUrl: "",
                twitterUrl: ""
            },
            professionalSummary: "",
            skills: "",
            workExperience: [
                {
                    id: "exp1",
                    company: "",
                    position: "",
                    startDate: "",
                    endDate: "",
                    description: ""
                }
            ],
            education: [
                {
                    id: "edu1",
                    institution: "",
                    degree: "",
                    fieldOfStudy: "",
                    startDate: "",
                    endDate: ""
                }
            ],
            projects: [
                {
                    id: "proj1",
                    title: "",
                    description: "",
                    link: ""
                }
            ]
        });
        setIsEditing(false);
        setSelectedResume(null);
        setIsPreviewing(false);
    };

    return (
        <div className="container max-w-7xl mx-auto p-6 space-y-8">
            <div className="flex items-center space-x-4">
                <Link href="/ai-career">
                    <Button variant="outline" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">
                    Resume Builder
                </h1>
            </div>

            <Tabs defaultValue="builder" className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-3">
                    <TabsTrigger value="builder">Builder</TabsTrigger>
                    <TabsTrigger value="myresumes">My Resumes</TabsTrigger>
                    <TabsTrigger value="tips">Tips</TabsTrigger>
                </TabsList>

                <TabsContent value="builder" className="mt-6">
                    <Card className="border border-muted/40">
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <FileText className="mr-2 h-5 w-5 text-blue-600" />
                                {isEditing ? "Edit Resume" : "Resume Builder"}
                            </CardTitle>
                            <CardDescription>
                                {isEditing
                                    ? "Edit your existing resume information"
                                    : "Fill in your information to create a professional resume"}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-8">
                            {/* Contact Information */}
                            <div>
                                <h2 className="text-xl font-bold mb-4">Contact Information</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input
                                            id="email"
                                            name="email"
                                            placeholder="your@email.com"
                                            value={formData.contactInfo.email}
                                            onChange={handleContactInfoChange}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="mobile">Mobile Number</Label>
                                        <Input
                                            id="mobile"
                                            name="mobile"
                                            placeholder="+1 234 567 8900"
                                            value={formData.contactInfo.mobile}
                                            onChange={handleContactInfoChange}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
                                        <Input
                                            id="linkedinUrl"
                                            name="linkedinUrl"
                                            placeholder="https://linkedin.com/in/your-profile"
                                            value={formData.contactInfo.linkedinUrl}
                                            onChange={handleContactInfoChange}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="twitterUrl">Twitter/X Profile</Label>
                                        <Input
                                            id="twitterUrl"
                                            name="twitterUrl"
                                            placeholder="https://twitter.com/your-handle"
                                            value={formData.contactInfo.twitterUrl}
                                            onChange={handleContactInfoChange}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Professional Summary */}
                            <div>
                                <h2 className="text-xl font-bold mb-4">Professional Summary</h2>
                                <div className="space-y-2">
                                    <Textarea
                                        id="professionalSummary"
                                        name="professionalSummary"
                                        placeholder="Write a compelling professional summary..."
                                        className="min-h-[120px]"
                                        value={formData.professionalSummary}
                                        onChange={handleTextAreaChange}
                                    />
                                </div>
                            </div>

                            {/* Skills */}
                            <div>
                                <h2 className="text-xl font-bold mb-4">Skills</h2>
                                <div className="space-y-2">
                                    <Textarea
                                        id="skills"
                                        name="skills"
                                        placeholder="List your key skills..."
                                        className="min-h-[120px]"
                                        value={formData.skills}
                                        onChange={handleTextAreaChange}
                                    />
                                </div>
                            </div>

                            {/* Work Experience */}
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-bold">Work Experience</h2>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={addWorkExperience}
                                    >
                                        <Plus className="h-4 w-4 mr-1" /> Add Experience
                                    </Button>
                                </div>

                                {formData.workExperience.map((experience, index) => (
                                    <div key={experience.id} className="mb-6 p-4 border rounded-lg">
                                        <h3 className="text-lg font-semibold mb-2">Experience {index + 1}</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                            <div className="space-y-2">
                                                <Label htmlFor={`company-${experience.id}`}>Company</Label>
                                                <Input
                                                    id={`company-${experience.id}`}
                                                    value={experience.company}
                                                    onChange={(e) => updateWorkExperience(experience.id, 'company', e.target.value)}
                                                    placeholder="Company name"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor={`position-${experience.id}`}>Position</Label>
                                                <Input
                                                    id={`position-${experience.id}`}
                                                    value={experience.position}
                                                    onChange={(e) => updateWorkExperience(experience.id, 'position', e.target.value)}
                                                    placeholder="Job title"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor={`startDate-${experience.id}`}>Start Date</Label>
                                                <Input
                                                    id={`startDate-${experience.id}`}
                                                    value={experience.startDate}
                                                    onChange={(e) => updateWorkExperience(experience.id, 'startDate', e.target.value)}
                                                    placeholder="MM/YYYY"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor={`endDate-${experience.id}`}>End Date</Label>
                                                <Input
                                                    id={`endDate-${experience.id}`}
                                                    value={experience.endDate}
                                                    onChange={(e) => updateWorkExperience(experience.id, 'endDate', e.target.value)}
                                                    placeholder="MM/YYYY or Present"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor={`description-${experience.id}`}>Description</Label>
                                            <Textarea
                                                id={`description-${experience.id}`}
                                                value={experience.description}
                                                onChange={(e) => updateWorkExperience(experience.id, 'description', e.target.value)}
                                                placeholder="Describe your responsibilities and achievements..."
                                                className="min-h-[120px]"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Education */}
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-bold">Education</h2>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={addEducation}
                                    >
                                        <Plus className="h-4 w-4 mr-1" /> Add Education
                                    </Button>
                                </div>

                                {formData.education.map((education, index) => (
                                    <div key={education.id} className="mb-6 p-4 border rounded-lg">
                                        <h3 className="text-lg font-semibold mb-2">Education {index + 1}</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                            <div className="space-y-2">
                                                <Label htmlFor={`institution-${education.id}`}>Institution</Label>
                                                <Input
                                                    id={`institution-${education.id}`}
                                                    value={education.institution}
                                                    onChange={(e) => updateEducation(education.id, 'institution', e.target.value)}
                                                    placeholder="School/University name"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor={`degree-${education.id}`}>Degree</Label>
                                                <Input
                                                    id={`degree-${education.id}`}
                                                    value={education.degree}
                                                    onChange={(e) => updateEducation(education.id, 'degree', e.target.value)}
                                                    placeholder="e.g., Bachelor's, Master's"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor={`fieldOfStudy-${education.id}`}>Field of Study</Label>
                                                <Input
                                                    id={`fieldOfStudy-${education.id}`}
                                                    value={education.fieldOfStudy}
                                                    onChange={(e) => updateEducation(education.id, 'fieldOfStudy', e.target.value)}
                                                    placeholder="e.g., Computer Science"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="space-y-2">
                                                    <Label htmlFor={`eduStartDate-${education.id}`}>Start Date</Label>
                                                    <Input
                                                        id={`eduStartDate-${education.id}`}
                                                        value={education.startDate}
                                                        onChange={(e) => updateEducation(education.id, 'startDate', e.target.value)}
                                                        placeholder="MM/YYYY"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor={`eduEndDate-${education.id}`}>End Date</Label>
                                                    <Input
                                                        id={`eduEndDate-${education.id}`}
                                                        value={education.endDate}
                                                        onChange={(e) => updateEducation(education.id, 'endDate', e.target.value)}
                                                        placeholder="MM/YYYY or Present"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Projects */}
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-bold">Projects</h2>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={addProject}
                                    >
                                        <Plus className="h-4 w-4 mr-1" /> Add Project
                                    </Button>
                                </div>

                                {formData.projects.map((project, index) => (
                                    <div key={project.id} className="mb-6 p-4 border rounded-lg">
                                        <h3 className="text-lg font-semibold mb-2">Project {index + 1}</h3>
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor={`title-${project.id}`}>Project Title</Label>
                                                <Input
                                                    id={`title-${project.id}`}
                                                    value={project.title}
                                                    onChange={(e) => updateProject(project.id, 'title', e.target.value)}
                                                    placeholder="Project name"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor={`projectDescription-${project.id}`}>Description</Label>
                                                <Textarea
                                                    id={`projectDescription-${project.id}`}
                                                    value={project.description}
                                                    onChange={(e) => updateProject(project.id, 'description', e.target.value)}
                                                    placeholder="Describe the project, your role, and technologies used..."
                                                    className="min-h-[100px]"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor={`link-${project.id}`}>Link</Label>
                                                <Input
                                                    id={`link-${project.id}`}
                                                    value={project.link}
                                                    onChange={(e) => updateProject(project.id, 'link', e.target.value)}
                                                    placeholder="https://example.com/project"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="flex gap-3">
                            {isEditing && (
                                <Button
                                    onClick={resetForm}
                                    variant="outline"
                                    className="flex-1"
                                >
                                    Cancel Editing
                                </Button>
                            )}
                            <Button
                                onClick={handleSubmit}
                                className="flex-1 bg-blue-600 hover:bg-blue-700"
                                disabled={isGenerating}
                            >
                                {isGenerating ? (
                                    <>
                                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                        {isEditing ? "Updating Resume..." : "Creating Resume..."}
                                    </>
                                ) : (
                                    isEditing ? 'Update Resume' : 'Create Resume'
                                )}
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                <TabsContent value="myresumes" className="mt-6">
                    <Card className="border border-muted/40">
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <FileText className="mr-2 h-5 w-5 text-blue-600" />
                                My Resumes
                            </CardTitle>
                            <CardDescription>
                                View, edit and download your saved resumes
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isPreviewing && selectedResume ? (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-xl font-bold">{selectedResume.title}</h2>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setIsPreviewing(false)}
                                            >
                                                Back to List
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={downloadResume}
                                            >
                                                <Download className="h-4 w-4 mr-2" />
                                                Download
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="p-4 border rounded-lg bg-white">
                                        <div className="prose max-w-none whitespace-pre-wrap text-black">
                                            {selectedResume.content.split('\n').map((line: string, index: number) => {
                                                if (line.startsWith('# ')) {
                                                    return <h1 key={index} className="text-2xl font-bold mt-4 text-black">{line.substring(2)}</h1>;
                                                } else if (line.startsWith('## ')) {
                                                    return <h2 key={index} className="text-xl font-bold mt-4 text-blue-600">{line.substring(3)}</h2>;
                                                } else if (line.startsWith('### ')) {
                                                    return <h3 key={index} className="text-lg font-bold mt-3 text-black">{line.substring(4)}</h3>;
                                                } else if (line.startsWith('- ')) {
                                                    return <p key={index} className="ml-4 flex items-center text-black"><span className="w-2 h-2 bg-blue-600 rounded-full mr-2"></span>{line.substring(2)}</p>;
                                                } else if (line.trim() === '') {
                                                    return <div key={index} className="h-2"></div>;
                                                } else {
                                                    return <p key={index} className="text-black">{line}</p>;
                                                }
                                            })}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {userResumes && userResumes.length > 0 ? (
                                        <div className="space-y-4">
                                            {userResumes.map((resume) => (
                                                <Card key={resume._id} className="border border-muted/40">
                                                    <CardHeader className="pb-2">
                                                        <div className="flex justify-between items-center">
                                                            <CardTitle>{resume.title}</CardTitle>
                                                            <div>
                                                                <Badge className="ml-2">
                                                                    {new Date(resume.updatedAt).toLocaleDateString()}
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                    </CardHeader>
                                                    <CardContent className="pb-4">
                                                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                                                            {resume.jobDescription || "No description provided"}
                                                        </p>
                                                        <div className="flex flex-wrap gap-2">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handlePreviewResume(resume)}
                                                            >
                                                                <FileText className="h-4 w-4 mr-2" />
                                                                Preview
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => {
                                                                    handlePreviewResume(resume);
                                                                    downloadResume();
                                                                }}
                                                            >
                                                                <Download className="h-4 w-4 mr-2" />
                                                                Download
                                                            </Button>
                                                            <Button
                                                                variant="destructive"
                                                                size="sm"
                                                                onClick={() => handleDeleteResume(resume._id)}
                                                            >
                                                                Delete
                                                            </Button>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-10">
                                            <FileText className="h-16 w-16 text-muted mx-auto mb-4" />
                                            <h3 className="text-lg font-medium mb-2">No Resumes Found</h3>
                                            <p className="text-muted-foreground mb-4">
                                                You haven't created any resumes yet. Build your first resume to get started.
                                            </p>
                                            <Button
                                                onClick={() => {
                                                    // Switch to builder tab
                                                    const builderTab = document.querySelector('[data-state="inactive"][value="builder"]') as HTMLElement;
                                                    if (builderTab) builderTab.click();
                                                }}
                                            >
                                                Create Your First Resume
                                            </Button>
                                        </div>
                                    )}
                                </>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="tips" className="mt-6">
                    <Card className="border border-muted/40">
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <FileText className="mr-2 h-5 w-5 text-teal-500" />
                                Resume Writing Tips
                            </CardTitle>
                            <CardDescription>
                                Expert advice to help your resume stand out to employers
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="p-4 border rounded-lg">
                                    <h3 className="font-semibold text-lg mb-2">Tailor your resume for each application</h3>
                                    <p className="text-muted-foreground">
                                        Customize your resume for each job application by highlighting relevant skills and experience that match the job description. This shows employers that you're a good fit for the specific role.
                                    </p>
                                </div>

                                <div className="p-4 border rounded-lg">
                                    <h3 className="font-semibold text-lg mb-2">Use action verbs and quantifiable achievements</h3>
                                    <p className="text-muted-foreground">
                                        Start bullet points with strong action verbs like "implemented," "developed," or "managed." Include specific numbers and percentages to demonstrate your impact (e.g., "increased sales by 20%").
                                    </p>
                                </div>

                                <div className="p-4 border rounded-lg">
                                    <h3 className="font-semibold text-lg mb-2">Keep it concise and relevant</h3>
                                    <p className="text-muted-foreground">
                                        Most resumes should be 1-2 pages maximum. Focus on your most recent and relevant experience, and avoid including outdated or irrelevant information that doesn't add value.
                                    </p>
                                </div>

                                <div className="p-4 border rounded-lg">
                                    <h3 className="font-semibold text-lg mb-2">Optimize for ATS systems</h3>
                                    <p className="text-muted-foreground">
                                        Many companies use Applicant Tracking Systems (ATS) to screen resumes. Include relevant keywords from the job description, use standard section headings, and avoid complex formatting or graphics.
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