"use client";

import React from "react";
import { Icon } from "@iconify-icon/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

import { ServerMemberDto, MemberRole } from "@/types";

interface MemberItemProps {
    member: ServerMemberDto;
}

export const MemberItem = React.memo(({ member }: MemberItemProps) => (
    <div className="group flex items-center gap-3 p-2.5 rounded-xl transition-all duration-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 cursor-pointer">
        <div className="relative shrink-0">
            <Avatar className="h-9 w-9 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <AvatarImage src={member.avatar} className="object-cover" />
                <AvatarFallback className="text-[10px] bg-zinc-50 dark:bg-zinc-900 text-zinc-500 font-bold">
                    {member.name?.substring(0, 1).toUpperCase() || "?"}
                </AvatarFallback>
            </Avatar>
            {/* Online/Status Indicator (Optional placeholder) */}
            {/* <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-black" /> */}
        </div>

        <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
                <span className={cn(
                    "text-sm font-medium truncate transition-colors",
                    "text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-zinc-100"
                )}>
                    {member.name}
                </span>
                {(member.role === MemberRole.ADMIN || member.role === MemberRole.OWNER) && (
                    <div className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-500" title="Admin">
                        <Icon icon="lucide:crown" width="12" />
                    </div>
                )}
            </div>
            {member.role && (
                <span className="text-[11px] text-zinc-400 group-hover:text-zinc-500 dark:group-hover:text-zinc-400 font-medium truncate">
                    {member.role}
                </span>
            )}
        </div>
    </div>
));
MemberItem.displayName = 'MemberItem';