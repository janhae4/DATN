"use client";

import * as React from "react";
import { AnimatePresence } from "framer-motion";
import { Loader2, Lightbulb } from "lucide-react";
import { AiTaskItem, SuggestedTask } from "./AiTaskItem";

interface AiTaskListProps {
    suggestedTasks: SuggestedTask[];
    isThinking: boolean;
    members: any[];
    selectedSprintId: string | null;
    onUpdateTask: (taskId: string, updates: Partial<SuggestedTask>) => void;
    onDeleteTask: (taskId: string) => void;
    onToggleMember: (taskId: string, memberId: string) => void;
}

export function AiTaskList({
    suggestedTasks,
    isThinking,
    members,
    selectedSprintId,
    onUpdateTask,
    onDeleteTask,
    onToggleMember,
}: AiTaskListProps) {
    const scrollRef = React.useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when new tasks arrive
    React.useEffect(() => {
        if (scrollRef.current && suggestedTasks.length > 0) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [suggestedTasks]);

    return (
        <div ref={scrollRef} className="space-y-3">
            <AnimatePresence mode="popLayout">
                {suggestedTasks.map((task, idx) => (
                    <AiTaskItem
                        key={task.id}
                        index={idx}
                        task={task}
                        members={members}
                        selectedSprintId={selectedSprintId}
                        onUpdate={onUpdateTask}
                        onDelete={onDeleteTask}
                        onToggleMember={onToggleMember}
                    />
                ))}
            </AnimatePresence>

            {/* Loading Skeleton */}
            {isThinking && (
                <div className="flex items-center gap-3 px-4 py-8 opacity-50">
                    <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />
                    <p className="text-xs text-zinc-500 animate-pulse font-medium">
                        Drafting tasks...
                    </p>
                </div>
            )}

            {/* Empty State */}
            {!isThinking && suggestedTasks.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 text-center opacity-40">
                    <Lightbulb className="h-8 w-8 text-zinc-400 mb-2" />
                    <p className="text-sm font-medium text-zinc-500">
                        Awaiting your command
                    </p>
                </div>
            )}
        </div>
    );
}
