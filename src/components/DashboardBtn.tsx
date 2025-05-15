"use client";

import Link from "next/link";
import { Button } from "./ui/button";
import { SparklesIcon } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";

interface DashboardBtnProps {
    fullWidth?: boolean;
}

function DashboardBtn({ fullWidth = false }: DashboardBtnProps) {
    const { isInterviewer, isLoading } = useUserRole();

    // Only show for interviewers
    if (!isInterviewer || isLoading) return null;

    return (
        <Link href="/dashboard" className={fullWidth ? "w-full" : ""}>
            <Button
                className={`gap-2 font-medium bg-violet-600 hover:bg-violet-700 ${fullWidth ? "w-full" : ""}`}
                size={"sm"}
            >
                <SparklesIcon className="size-4" />
                Dashboard
            </Button>
        </Link>
    );
}

export default DashboardBtn; 