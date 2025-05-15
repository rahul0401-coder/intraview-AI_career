import { Clock, Code2, Calendar, Users, MessageSquare, Star, Sparkles } from "lucide-react";

export const INTERVIEW_CATEGORY = [
  {
    id: "upcoming",
    title: "Upcoming",
    variant: "outline"
  },
  {
    id: "completed",
    title: "Completed",
    variant: "default"
  },
  {
    id: "succeeded",
    title: "Succeeded",
    variant: "success"
  }
];

export const TIME_SLOTS = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
  "19:30",
  "20:00",
  "20:30",
  "21:00",
  "21:30",
  "22:00",
  "22:30",
  "23:00",
  "23:30",
];

export const INTERVIEWER_ACTIONS = [
  {
    icon: Code2,
    title: "New Call",
    description: "Start an instant call",
    color: "primary",
    gradient: "from-primary/10 via-primary/5 to-transparent",
  },
  {
    icon: Users,
    title: "Join Interview",
    description: "Enter via invitation link",
    color: "purple-500",
    gradient: "from-purple-500/10 via-purple-500/5 to-transparent",
  },
  {
    icon: Calendar,
    title: "Schedule",
    description: "Plan upcoming interviews",
    color: "blue-500",
    gradient: "from-blue-500/10 via-blue-500/5 to-transparent",
  },
  {
    icon: Clock,
    title: "Recordings",
    description: "Access past interviews",
    color: "orange-500",
    gradient: "from-orange-500/10 via-orange-500/5 to-transparent",
  },
];

export const CANDIDATE_ACTIONS = [
  {
    icon: Calendar,
    title: "Scheduled Interviews",
    description: "View upcoming interviews",
    color: "blue-500",
    gradient: "from-blue-500/10 via-blue-500/5 to-transparent",
    href: "/scheduled",
  },
  {
    icon: Star,
    title: "Interview Feedback",
    description: "View interviewer feedback",
    color: "yellow-500",
    gradient: "from-yellow-500/10 via-yellow-500/5 to-transparent",
    href: "/feedback",
  },
  {
    icon: Users,
    title: "Join Interview",
    description: "Enter via invitation link",
    color: "purple-500",
    gradient: "from-purple-500/10 via-purple-500/5 to-transparent",
  },
  {
    icon: MessageSquare,
    title: "Practice",
    description: "Practice coding problems",
    color: "green-500",
    gradient: "from-green-500/10 via-green-500/5 to-transparent",
    href: "/practice",
  },
  {
    icon: Sparkles,
    title: "AI Career",
    description: "AI-powered career tools",
    color: "blue-500",
    gradient: "from-blue-500/10 via-blue-500/5 to-transparent",
  },
];

export const CODING_QUESTIONS: CodeQuestion[] = [
  {
    id: "two-sum",
    title: "Two Sum",
    description:
      "Given an array of integers `nums` and an integer `target`, return indices of the two numbers in the array such that they add up to `target`