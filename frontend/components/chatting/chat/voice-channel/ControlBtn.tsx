import React from 'react';
import { Icon } from "@iconify-icon/react";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface ControlBtnProps {
    icon: string;
    tooltip: string;
    active: boolean;
}

export const ControlBtn = ({ icon, tooltip, active }: ControlBtnProps) => (
    <TooltipProvider delayDuration={0}>
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                        "h-11 w-11 rounded-xl transition-all border",
                        active
                            ? "bg-zinc-100 text-zinc-900 border-zinc-200 hover:bg-white dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-700"
                            : "bg-transparent text-zinc-500 border-transparent hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                    )}
                >
                    <Icon icon={icon} width="20" />
                </Button>
            </TooltipTrigger>
            <TooltipContent
                side="top"
                className="bg-zinc-900 text-zinc-100 border-zinc-800 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5"
            >
                {tooltip}
            </TooltipContent>
        </Tooltip>
    </TooltipProvider>
);
