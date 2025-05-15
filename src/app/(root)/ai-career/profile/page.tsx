"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";

const industries = [
    "Software Development",
    "Data Science",
    "Web Development",
    "Mobile Development",
    "DevOps",
    "Cloud Computing",
    "Cybersecurity",
    "Artificial Intelligence",
    "Machine Learning",
    "UX/UI Design",
    "Product Management",
    "Project Management",
    "Business Intelligence",
    "Business Analysis",
    "Digital Marketing",
    "Other",
];

export default function ProfilePage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        industry: "",
        yearsOfExperience: "",
        skills: "",
        bio: "",
    });
    const [isLoading, setIsLoading] = useState(true);

    // Get user profile from Convex
    const userProfile = useQuery(api.userSkillsProfile.getUserProfile);

    // Save user profile to Convex
    const saveUserProfile = useMutation(api.userSkillsProfile.saveUserProfile);

    // Load existing profile data if available
    useEffect(() => {
        console.log("Profile page - userProfile data:", userProfile);

        if (userProfile) {
            console.log("Setting form data from existing profile");
            setFormData({
                industry: userProfile.industry || "",
                yearsOfExperience: userProfile.yearsOfExperience?.toString() || "",
                skills: userProfile.skills ? userProfile.skills.join(", ") : "",
                bio: userProfile.bio || "",
            });
            setIsLoading(false);
        } else if (userProfile === null) {
            // Profile query returned, but no profile exists
            console.log("No profile exists, showing empty form");
            setIsLoading(false);
        }
    }, [userProfile]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });
    };

    const handleSelectChange = (value: string) => {
        setFormData({
            ...formData,
            industry: value,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.industry) {
            toast.error("Please select an industry");
            return;
        }

        setIsSubmitting(true);

        try {
            // Process skills properly
            const processedSkills = formData.skills
                .split(',')
                .map(skill => skill.trim())
                .filter(skill => skill);

            console.log("Saving skills to profile:", processedSkills);

            // Save to Convex database
            await saveUserProfile({
                industry: formData.industry,
                yearsOfExperience: parseInt(formData.yearsOfExperience) || 0,
                skills: processedSkills,
                bio: formData.bio,
            });

            // Keep a local copy for immediate UI updates
            localStorage.setItem("userProfile", JSON.stringify({
                ...formData,
                skills: processedSkills.join(", ")
            }));

            toast.success("Profile updated successfully!");
            router.push("/ai-career");
        } catch (error) {
            toast.error("Failed to update profile");
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="container max-w-3xl mx-auto py-10">
            <Card className="border border-muted/40 bg-background/50 p-6 sm:p-10">
                <div className="space-y-6">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">
                            {formData.industry ? "Update Your Profile" : "Complete Your Profile"}
                        </h1>
                        <p className="text-muted-foreground mt-2">
                            Select your industry to get personalized career insights and recommendations.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="industry">Industry</Label>
                                <Select
                                    value={formData.industry}
                                    onValueChange={handleSelectChange}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select an industry" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {industries.map((industry) => (
                                            <SelectItem key={industry} value={industry}>
                                                {industry}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="yearsOfExperience">Years of Experience</Label>
                                <Input
                                    id="yearsOfExperience"
                                    name="yearsOfExperience"
                                    type="number"
                                    placeholder="Enter years of experience"
                                    value={formData.yearsOfExperience}
                                    onChange={handleChange}
                                    min="0"
                                    max="50"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="skills">Skills</Label>
                                <Input
                                    id="skills"
                                    name="skills"
                                    placeholder="e.g., Python, JavaScript, Project Management"
                                    value={formData.skills}
                                    onChange={handleChange}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Separate multiple skills with commas
                                </p>
                                <div className="mt-2">
                                    <p className="text-xs text-muted-foreground mb-1">
                                        Click to add supported skill categories that trigger specialized interview questions:
                                    </p>
                                    <div className="flex flex-wrap gap-1">
                                        {['JavaScript', 'React', 'Python', 'Java', 'SQL', 'DevOps', 'AWS', 'Cloud'].map((skill) => (
                                            <button
                                                key={skill}
                                                type="button"
                                                className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200"
                                                onClick={() => {
                                                    // Add the skill if it's not already in the list
                                                    const currentSkills = formData.skills
                                                        .split(',')
                                                        .map(s => s.trim())
                                                        .filter(s => s);

                                                    if (!currentSkills.some(s => s.toLowerCase() === skill.toLowerCase())) {
                                                        const updatedSkills = [...currentSkills, skill].join(', ');
                                                        setFormData({
                                                            ...formData,
                                                            skills: updatedSkills
                                                        });
                                                    }
                                                }}
                                            >
                                                + {skill}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="bio">Professional Bio</Label>
                                <Textarea
                                    id="bio"
                                    name="bio"
                                    placeholder="Tell us about your professional background..."
                                    value={formData.bio}
                                    onChange={handleChange}
                                    rows={5}
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Updating Profile..." : (formData.industry ? "Update Profile" : "Complete Profile")}
                        </Button>
                    </form>
                </div>
            </Card>
        </div>
    );
} 