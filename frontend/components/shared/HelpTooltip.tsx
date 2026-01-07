"use client";

import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";

interface HelpTooltipProps {
    text: string;
}

export function HelpTooltip({ text }: HelpTooltipProps) {
    return (
        <TooltipProvider>
            <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground/50 hover:text-foreground cursor-help transition-colors" />
                </TooltipTrigger>
                <TooltipContent className="bg-zinc-900 text-zinc-50 border-zinc-800">
                    <p className="max-w-[250px] text-xs font-normal leading-relaxed">{text}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
