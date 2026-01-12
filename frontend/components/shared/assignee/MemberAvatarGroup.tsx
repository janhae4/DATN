"use client";

import * as React from "react";
import { Member } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface MemberAvatarGroupProps {
    assigneeIds: string[];
    members: Member[];
    limit?: number;
}

export function MemberAvatarGroup({
    assigneeIds,
    members,
    limit = 3,
}: MemberAvatarGroupProps) {
    if (!assigneeIds?.length) return null;

    const assignees = assigneeIds
        .map((id) => members.find((m) => m.id === id))
        .filter(Boolean) as Member[];

    const visibleAssignees = assignees.slice(0, limit);
    const hiddenCount = assignees.length - limit;

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <div className="flex items-center -space-x-2">
            <TooltipProvider delayDuration={300}>
                {visibleAssignees.map((member) => (
                    <Tooltip key={member.id}>
                        <TooltipTrigger asChild>
                            <Avatar className="h-6 w-6 border-2 border-background ring-1 ring-border/10 transition-transform hover:-translate-y-1 hover:z-10 cursor-pointer">
                                <AvatarImage src={member.avatar} alt={member.name} className="h-full w-full object-cover rounded-full" />
                                <AvatarFallback className="text-[9px] font-bold bg-muted text-muted-foreground flex items-center justify-center rounded-full h-full w-full">
                                    {getInitials(member.name || "Unknown User")}
                                </AvatarFallback>
                            </Avatar>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="text-xs">
                            <p>{member.name || "Unknown User"}</p>
                        </TooltipContent>
                    </Tooltip>
                ))}

                {hiddenCount > 0 && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="h-6 w-6 rounded-full border-2 border-background bg-muted ring-1 ring-border/10 flex items-center justify-center text-[9px] font-bold text-muted-foreground hover:bg-accent cursor-default hover:z-10 relative">
                                +{hiddenCount}
                            </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="text-xs">
                            <div className="flex flex-col gap-1">
                                {assignees
                                    .slice(limit)
                                    .slice(0, 5)
                                    .map((m) => (
                                        <span key={m.id}>{m.name}</span>
                                    ))}
                                {hiddenCount > 5 && <span>...</span>}
                            </div>
                        </TooltipContent>
                    </Tooltip>
                )}
            </TooltipProvider>
        </div>
    );
}
