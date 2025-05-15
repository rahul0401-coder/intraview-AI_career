"use client";

import React from "react";
import { CANDIDATE_ACTIONS, INTERVIEWER_ACTIONS } from "@/constants";
import { Card } from "@/components/ui/card";
import { useUserRole } from "@/hooks/useUserRole";
import { useRouter } from "next/navigation";

interface QuickActionProps {
    onActionClick?: (title: string) => void;
}

export default function QuickActions({ onActionClick }: QuickActionProps) {
    const { isInterviewer } = useUserRole();
    const router = useRouter();
    const actions = isInterviewer ? INTERVIEWER_ACTIONS : CANDIDATE_ACTIONS;

    const handleClick = (action: typeof INTERVIEWER_ACTIONS[0] | typeof CANDIDATE_ACTIONS[0]) => {
        if ('href' in action && action.href) {
            router.push(action.href);
        } else if (onActionClick) {
            onActionClick(action.title);
        }
    };

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {actions.map((action) => {
                const Icon = action.icon;

                return (
                    <div
                        key={action.title}
                        onClick={() => handleClick(action)}
                        className="cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <Card className={`h-full p-6 hover:shadow-md transition-all duration-200 bg-gradient-to-br ${action.gradient}`}>
                            <div className="space-y-2">
                                <div className={`w-10 h-10 rounded-lg bg-${action.color}/10 flex items-center justify-center`}>
                                    <Icon className={`w-6 h-6 text-${action.color}`} />
                                </div>
                                <h3 className="font-semibold">{action.title}</h3>
                                <p className="text-sm text-muted-foreground">
                                    {action.description}
                                </p>
                            </div>
                        </Card>
                    </div>
                );
            })}
        </div>
    );
} 