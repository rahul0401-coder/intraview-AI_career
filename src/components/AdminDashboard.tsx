"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import {
    BarChart,
    Users2,
    Calendar,
    ClipboardList,
} from "lucide-react";
import { toast } from "sonner";

type FilterType = "all" | "scheduled" | "completed" | "in_progress" | "users" | "questions";

export default function AdminDashboard() {
    const users = useQuery(api.users.getAllUsers);
    const stats = useQuery(api.admin.getSystemStats);
    const activities = useQuery(api.admin.getRecentActivity);
    const updateRole = useMutation(api.users.updateUserRole);
    const [activeFilter, setActiveFilter] = useState<FilterType>("all");
    const [activeTab, setActiveTab] = useState("users");

    const handleRoleChange = async (userId: Id<"users">, newRole: "candidate" | "interviewer" | "admin") => {
        try {
            await updateRole({ userId, role: newRole });
            toast.success("User role updated successfully");
        } catch (error) {
            toast.error("Failed to update user role");
            console.error(error);
        }
    };

    const handleTileClick = (filter: FilterType) => {
        setActiveFilter(filter);
        setActiveTab("users"); // Switch to users tab when clicking tiles
    };

    if (!users || !stats || !activities) {
        return <div>Loading...</div>;
    }

    // Filter users based on active filter
    const filteredUsers = users.filter(user => {
        if (activeFilter === "users") return true;
        return false;
    });

    // Filter interviews based on status
    const filteredInterviews = activities.filter(activity => {
        if (activity.type !== "interview") return false;
        if (activeFilter === "all") return true;

        // Type guard to ensure we're dealing with an interview
        const interview = activity.data as { status?: string };
        if (!interview.status) return false;

        if (activeFilter === "scheduled" && interview.status === "scheduled") return true;
        if (activeFilter === "completed" && interview.status === "completed") return true;
        if (activeFilter === "in_progress" &&
            (interview.status === "in_progress" || interview.status === "active")) return true;
        return false;
    });

    return (
        <div className="container mx-auto py-10 space-y-8">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => handleTileClick("users")}
                >
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <Users2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalUsers}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                            {stats.usersByRole.candidates} candidates, {stats.usersByRole.interviewers} interviewers
                        </div>
                    </CardContent>
                </Card>
                <Card
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => handleTileClick("all")}
                >
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Total Interviews</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalInterviews}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                            {stats.interviewsByStatus.completed} completed, {stats.interviewsByStatus.scheduled} scheduled
                        </div>
                    </CardContent>
                </Card>
                <Card
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => handleTileClick("questions")}
                >
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Custom Questions</CardTitle>
                        <ClipboardList className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalCustomQuestions}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                            Created by interviewers
                        </div>
                    </CardContent>
                </Card>
                <Card
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => handleTileClick("in_progress")}
                >
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Active Interviews</CardTitle>
                        <BarChart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.interviewsByStatus.inProgress}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                            Currently in progress
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab as any}>
                <TabsList>
                    <TabsTrigger value="users">User Management</TabsTrigger>
                    <TabsTrigger value="activity">Recent Activity</TabsTrigger>
                </TabsList>

                <TabsContent value="users" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>
                                {activeFilter === "users" ? "User Management" :
                                    activeFilter === "all" ? "All Interviews" :
                                        activeFilter === "in_progress" ? "Active Interviews" :
                                            activeFilter === "scheduled" ? "Scheduled Interviews" :
                                                activeFilter === "completed" ? "Completed Interviews" :
                                                    "Custom Questions"}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {activeFilter === "users" ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>User</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Current Role</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {users.map((user) => (
                                            <TableRow key={user._id}>
                                                <TableCell className="flex items-center gap-3">
                                                    <Avatar>
                                                        <AvatarImage src={user.image ?? ""} />
                                                        <AvatarFallback>
                                                            {user.name.charAt(0).toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    {user.name}
                                                </TableCell>
                                                <TableCell>{user.email}</TableCell>
                                                <TableCell>{user.role}</TableCell>
                                                <TableCell>
                                                    <Select
                                                        value={user.role}
                                                        onValueChange={(value: "candidate" | "interviewer" | "admin") =>
                                                            handleRoleChange(user._id, value)
                                                        }
                                                    >
                                                        <SelectTrigger className="w-[180px]">
                                                            <SelectValue placeholder="Select a role" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="candidate">Candidate</SelectItem>
                                                            <SelectItem value="interviewer">Interviewer</SelectItem>
                                                            <SelectItem value="admin">Admin</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Title</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Time</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredInterviews.map((activity, index) => {
                                            const interview = activity.data as { status?: string, title?: string };
                                            return (
                                                <TableRow key={index}>
                                                    <TableCell>{interview.title || 'Untitled'}</TableCell>
                                                    <TableCell>{interview.status || 'Unknown'}</TableCell>
                                                    <TableCell>
                                                        {format(new Date(activity.timestamp), "MMM d, yyyy")}
                                                    </TableCell>
                                                    <TableCell>
                                                        {format(new Date(activity.timestamp), "h:mm a")}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="activity" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Activity</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-8">
                                {activities.map((activity, index) => (
                                    <div key={index} className="flex items-start gap-4">
                                        <div className="mt-1">
                                            {activity.type === "interview" ? (
                                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                            ) : (
                                                <ClipboardList className="h-4 w-4 text-muted-foreground" />
                                            )}
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium leading-none">
                                                {activity.type === "interview"
                                                    ? `New interview scheduled: ${(activity.data as { title?: string }).title || 'Untitled'}`
                                                    : `New feedback submitted for interview`}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {format(new Date(activity.timestamp), "MMM d, yyyy 'at' h:mm a")}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
} 