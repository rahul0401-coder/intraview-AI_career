"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp, LineChart, BarChart3, Briefcase, Award, Building2 } from "lucide-react";
import Link from "next/link";
import LoaderUI from "@/components/LoaderUI";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";

interface IndustryData {
    growthRate: number;
    salaryRange: string;
    topSkills: string[];
    jobOpportunities: number;
    demandMetric: number;
    description: string;
    trends: string[];
}

interface UserProfile {
    _id?: any;
    userId: string;
    industry: string;
    yearsOfExperience: number;
    skills: string[];
    bio: string;
    createdAt?: number;
    updatedAt?: number;
}

// Mock industry growth data
const industryGrowthData: Record<string, IndustryData> = {
    "Software Development": {
        growthRate: 22,
        salaryRange: "$75,000 - $150,000",
        topSkills: ["JavaScript", "Python", "Cloud Computing", "DevOps", "React"],
        jobOpportunities: 180000,
        demandMetric: 8.7,
        description: "The software development industry continues to show strong growth with increasing demand for cloud-native applications, AI integration, and cross-platform development skills.",
        trends: [
            "Increased adoption of AI-assisted development tools",
            "Growth in demand for full-stack developers",
            "Rising importance of cybersecurity knowledge",
            "Shift towards serverless architectures",
            "Remote work becoming a permanent option"
        ]
    },
    "Data Science": {
        growthRate: 31,
        salaryRange: "$90,000 - $170,000",
        topSkills: ["Python", "SQL", "Machine Learning", "Statistics", "Data Visualization"],
        jobOpportunities: 140000,
        demandMetric: 9.2,
        description: "Data Science remains one of the fastest-growing fields with organizations increasingly relying on data-driven decision making across all sectors.",
        trends: [
            "Integration of AI in predictive analytics",
            "Growing demand for real-time analytics capabilities",
            "Increased focus on ethical AI and bias reduction",
            "Rise of automated machine learning (AutoML)",
            "Specialized data scientists for particular industries"
        ]
    },
    "Web Development": {
        growthRate: 18,
        salaryRange: "$65,000 - $130,000",
        topSkills: ["JavaScript", "React", "Node.js", "TypeScript", "CSS"],
        jobOpportunities: 165000,
        demandMetric: 8.3,
        description: "Web development continues to evolve rapidly, with increasing emphasis on performance, accessibility, and integrated user experiences.",
        trends: [
            "Growing adoption of headless CMS solutions",
            "Increased use of WebAssembly for performance",
            "Rise of JAMstack architecture",
            "Focus on web accessibility compliance",
            "Integration of AR/VR experiences"
        ]
    },
    "Cybersecurity": {
        growthRate: 33,
        salaryRange: "$85,000 - $160,000",
        topSkills: ["Network Security", "Cloud Security", "Ethical Hacking", "Risk Assessment", "SIEM"],
        jobOpportunities: 130000,
        demandMetric: 9.6,
        description: "With increasing cyber threats, the cybersecurity sector is experiencing exceptional growth and chronic talent shortages.",
        trends: [
            "Zero trust architecture implementation",
            "Growing demand for cloud security specialists",
            "Rise of security automation and orchestration",
            "Increased focus on threat intelligence",
            "Greater adoption of security as code practices"
        ]
    },
    "Artificial Intelligence": {
        growthRate: 38,
        salaryRange: "$100,000 - $180,000",
        topSkills: ["Machine Learning", "Python", "Deep Learning", "Computer Vision", "NLP"],
        jobOpportunities: 120000,
        demandMetric: 9.8,
        description: "AI continues to be one of the most rapidly expanding tech fields, with applications proliferating across industries.",
        trends: [
            "Generative AI revolutionizing content creation",
            "Increased focus on AI ethics and governance",
            "Rise of AI-human collaboration tools",
            "Edge AI for real-time processing",
            "Specialized AI solutions for industry verticals"
        ]
    },
    // Default fallback for other industries
    "Other": {
        growthRate: 15,
        salaryRange: "Varies",
        topSkills: ["Communication", "Problem Solving", "Adaptability", "Project Management", "Technical Writing"],
        jobOpportunities: 100000,
        demandMetric: 7.5,
        description: "Technology roles continue to grow across all industry sectors, with increasing emphasis on digital transformation.",
        trends: [
            "Cross-functional collaboration becoming essential",
            "Remote work flexibility",
            "Continuous learning and upskilling",
            "Focus on soft skills alongside technical abilities",
            "Growing importance of domain expertise"
        ]
    }
};

export default function IndustryInsightsPage() {
    const router = useRouter();
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [industryData, setIndustryData] = useState<IndustryData | null>(null);

    // Get user profile from Convex
    const convexUserProfile = useQuery(api.userSkillsProfile.getUserProfile);

    useEffect(() => {
        if (convexUserProfile === null) {
            // Profile query returned, but no profile exists
            router.push("/ai-career/profile");
            return;
        } else if (convexUserProfile) {
            setUserProfile(convexUserProfile);

            // Get industry growth data based on user's selected industry
            const industry = convexUserProfile.industry || "Other";

            // Check if the industry exists in our data, otherwise use the "Other" fallback
            if (industry in industryGrowthData) {
                setIndustryData(industryGrowthData[industry]);
            } else {
                setIndustryData(industryGrowthData["Other"]);
            }

            setIsLoading(false);
        }
    }, [convexUserProfile, router]);

    if (isLoading || !industryData || !userProfile) {
        return <LoaderUI />;
    }

    return (
        <div className="container max-w-7xl mx-auto p-6 space-y-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Link href="/ai-career">
                        <Button variant="outline" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">
                        Industry Insights
                    </h1>
                </div>
                <div className="flex items-center bg-muted/30 px-4 py-2 rounded-lg">
                    <Building2 className="h-5 w-5 mr-2 text-blue-600" />
                    <span className="font-medium">{userProfile.industry}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border border-muted/40">
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <TrendingUp className="mr-2 h-5 w-5 text-blue-600" />
                            Growth Rate
                        </CardTitle>
                        <CardDescription>
                            Annual industry growth percentage
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold text-blue-600">{industryData.growthRate}%</div>
                        <p className="text-sm text-muted-foreground mt-2">Annual growth compared to overall job market growth of 7%</p>
                    </CardContent>
                </Card>

                <Card className="border border-muted/40">
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <Briefcase className="mr-2 h-5 w-5 text-teal-500" />
                            Job Opportunities
                        </CardTitle>
                        <CardDescription>
                            Available positions in the US
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold text-teal-500">
                            {industryData.jobOpportunities.toLocaleString()}
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">Estimated open positions over the next 12 months</p>
                    </CardContent>
                </Card>

                <Card className="border border-muted/40">
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <Award className="mr-2 h-5 w-5 text-blue-600" />
                            Salary Range
                        </CardTitle>
                        <CardDescription>
                            Typical compensation
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold text-blue-600">{industryData.salaryRange}</div>
                        <p className="text-sm text-muted-foreground mt-2">National average based on experience level</p>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="w-full max-w-md">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="skills">Top Skills</TabsTrigger>
                    <TabsTrigger value="trends">Trends</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-6">
                    <Card className="border border-muted/40">
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <LineChart className="mr-2 h-5 w-5 text-blue-600" />
                                Industry Overview
                            </CardTitle>
                            <CardDescription>
                                Key insights about the {userProfile.industry} industry
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">
                                {industryData.description}
                            </p>

                            <div className="mt-6 border-t pt-6">
                                <h3 className="text-lg font-medium mb-4">Demand Score</h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm">Market Demand</span>
                                        <span className="text-sm font-medium">{industryData.demandMetric}/10</span>
                                    </div>
                                    <div className="h-2 w-full bg-secondary overflow-hidden rounded-full">
                                        <div
                                            className="h-full bg-gradient-to-r from-blue-600 to-teal-500 rounded-full"
                                            style={{ width: `${(industryData.demandMetric / 10) * 100}%` }}
                                        ></div>
                                    </div>
                                    <p className="text-xs text-muted-foreground">Based on employer demand, job postings, and projected growth</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="skills" className="mt-6">
                    <Card className="border border-muted/40">
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Award className="mr-2 h-5 w-5 text-teal-500" />
                                Most In-Demand Skills
                            </CardTitle>
                            <CardDescription>
                                Skills employers are seeking in the {userProfile.industry} industry
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {industryData.topSkills.map((skill: string, index: number) => (
                                    <div key={index} className="flex items-center p-3 border rounded-lg">
                                        <div className="h-10 w-10 rounded-full bg-blue-600/10 flex items-center justify-center mr-3">
                                            <span className="font-bold text-blue-600">{index + 1}</span>
                                        </div>
                                        <div>
                                            <div className="font-medium">{skill}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {index < 2 ? "High demand" : index < 4 ? "Growing demand" : "Steady demand"}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="trends" className="mt-6">
                    <Card className="border border-muted/40">
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <BarChart3 className="mr-2 h-5 w-5 text-blue-600" />
                                Industry Trends
                            </CardTitle>
                            <CardDescription>
                                Emerging trends in the {userProfile.industry} industry
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {industryData.trends.map((trend: string, index: number) => (
                                    <div key={index} className="p-4 border rounded-lg">
                                        <div className="flex items-center mb-1">
                                            <div className="h-6 w-6 rounded-full bg-teal-500/10 flex items-center justify-center mr-2">
                                                <span className="text-sm font-bold text-teal-500">{index + 1}</span>
                                            </div>
                                            <h3 className="font-medium">{trend}</h3>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <div className="flex justify-end">
                <Link href="/ai-career">
                    <Button variant="outline">
                        Back to AI Career Tools
                    </Button>
                </Link>
            </div>
        </div>
    );
} 