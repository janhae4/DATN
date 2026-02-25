"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Check,
    ChevronRight,
    Layers,
    Loader2,
    Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AiTaskInputProps {
    query: string;
    setQuery: (val: string) => void;
    selectedSprintId: string | null;
    setSelectedSprintId: (id: string | null) => void;
    sprints: any[]; // Or define the Sprint type properly
    isStreaming: boolean;
    onGenerate: () => void;
}

export function AiTaskInput({
    query,
    setQuery,
    selectedSprintId,
    setSelectedSprintId,
    sprints,
    isStreaming,
    onGenerate,
}: AiTaskInputProps) {
    return (
        <div className="relative group rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="p-4 pb-12">
                <Textarea
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ask AI to build your sprint plan..."
                    className="min-h-[60px] w-full resize-none border-none bg-transparent p-0 text-base text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 focus-visible:ring-0 leading-relaxed font-medium shadow-none"
                />
            </div>

            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between p-1 bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-100 dark:border-zinc-700/50">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 gap-1.5 px-2 text-[11px] font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-200/50 dark:hover:bg-zinc-700/50 rounded-md transition-colors"
                        >
                            <div className="flex items-center gap-1.5">
                                <Layers className="h-3.5 w-3.5 opacity-70" />
                                <span className="truncate max-w-[120px]">
                                    {selectedSprintId
                                        ? sprints.find((s) => s.id === selectedSprintId)?.title
                                        : "Backlog (No Sprint)"}
                                </span>
                            </div>
                            <ChevronRight className="h-3 w-3 opacity-30 rotate-90" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[240px] p-1" align="start">
                        <Command>
                            <CommandInput placeholder="Select context..." className="h-8 text-xs" />
                            <CommandList>
                                <CommandEmpty>No results.</CommandEmpty>
                                <CommandGroup>
                                    <CommandItem
                                        onSelect={() => setSelectedSprintId(null)}
                                        className="cursor-pointer text-xs py-1.5 rounded-sm"
                                    >
                                        <Layers className="mr-2 h-3.5 w-3.5 opacity-50" />
                                        Backlog
                                        {selectedSprintId === null && (
                                            <Check className="ml-auto h-3 w-3" />
                                        )}
                                    </CommandItem>
                                    {sprints.map((sprint) => (
                                        <CommandItem
                                            key={sprint.id}
                                            onSelect={() => setSelectedSprintId(sprint.id)}
                                            className="cursor-pointer text-xs py-1.5 rounded-sm"
                                        >
                                            <div className="h-1.5 w-1.5 rounded-full bg-zinc-900 dark:bg-zinc-100 mr-2 opacity-70" />
                                            {sprint.title}
                                            {selectedSprintId === sprint.id && (
                                                <Check className="ml-auto h-3 w-3" />
                                            )}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>

                <Button
                    onClick={onGenerate}
                    disabled={isStreaming || !query.trim()}
                    size="sm"
                    className={cn(
                        "h-7 px-3 rounded-md transition-all duration-200 font-medium text-[11px] shadow-sm",
                        isStreaming
                            ? "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500 cursor-not-allowed"
                            : "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                    )}
                >
                    {isStreaming ? (
                        <>
                            <Loader2 className="h-3 w-3 animate-spin mr-1.5" />
                            <span>Thinking...</span>
                        </>
                    ) : (
                        <>
                            <Sparkles className="h-3 w-3 mr-1.5" />
                            <span>Generate</span>
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
