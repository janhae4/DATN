"use client";

import * as React from "react";
import { Plus, Loader2, Trash2, MessageSquare, History } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

import { AiDiscussion } from "@/types";

interface SidebarProps {
    isOpen: boolean;
    discussions: AiDiscussion[];
    activeId: string | undefined;
    isLoading: boolean;
    isFetchingNextPage: boolean;
    bottomRef: (node?: Element | null) => void;
    onNewChat: () => void;
    onSelectChat: (id: string) => void;
    onDeleteChat: (id: string) => void;
}

export const Sidebar = ({
    isOpen,
    discussions,
    activeId,
    isLoading,
    isFetchingNextPage,
    bottomRef,
    onNewChat,
    onSelectChat,
    onDeleteChat,
}: SidebarProps) => {
    return (
        <AnimatePresence mode="wait">
            {isOpen && (
                <motion.aside
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 300, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="flex flex-col h-full bg-zinc-50/80 dark:bg-zinc-950/40 backdrop-blur-xl border-r border-zinc-200/50 dark:border-zinc-800/50 relative z-20 group/sidebar"
                >
                    {/* Header with New Chat Button */}
                    <div className="p-5 shrink-0">
                        <Button
                            onClick={onNewChat}
                            className="w-full justify-start gap-3 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-zinc-100 dark:text-zinc-900 h-11 shadow-lg shadow-zinc-200/50 dark:shadow-none rounded-xl transition-all duration-200 active:scale-[0.98] border-none"
                        >
                            <div className="flex items-center justify-center w-5 h-5 rounded-full bg-white/20 dark:bg-black/10">
                                <Plus className="h-3.5 w-3.5" />
                            </div>
                            <span className="font-semibold tracking-tight text-sm">New Conversation</span>
                        </Button>
                    </div>

                    {/* Chat History List */}
                    <div className="flex-1 overflow-hidden flex flex-col">
                        <div className="flex items-center gap-2 px-6 py-4 text-zinc-400 dark:text-zinc-500">
                            <History className="h-3 w-3" />
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Recent Activity</span>
                        </div>

                        <div
                            className="flex-1 overflow-y-auto custom-scrollbar px-3 pb-6 space-y-0.5"
                        >
                            {isLoading ? (
                                <div className="p-8 flex flex-col items-center gap-3">
                                    <div className="h-5 w-5 rounded-full border-2 border-zinc-200 dark:border-zinc-800 border-t-zinc-400 dark:border-t-zinc-600 animate-spin" />
                                    <span className="text-[11px] text-zinc-500 font-medium">Fetching history...</span>
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    <AnimatePresence initial={false}>
                                        {discussions.map((chat) => (
                                            <motion.div
                                                layout
                                                initial={{ opacity: 0, x: -5 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                key={chat._id}
                                                className="group relative"
                                            >
                                                <button
                                                    onClick={() => onSelectChat(chat._id)}
                                                    className={cn(
                                                        "w-full flex items-center gap-3 px-3 py-2.5 rounded text-left transition-all duration-200 relative min-w-0 pr-10", // Added padding right to make room for trash icon
                                                        activeId === chat._id
                                                            ? "bg-white dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-100 font-semibold shadow-sm ring-1 ring-zinc-200/50 dark:ring-zinc-700/50"
                                                            : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/40 hover:text-zinc-900 dark:hover:text-zinc-200"
                                                    )}
                                                >
                                                    {activeId === chat._id && (
                                                        <motion.div
                                                            layoutId="active-pill"
                                                            className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-10 bg-zinc-500 rounded"
                                                        />
                                                    )}

                                                    <MessageSquare className={cn(
                                                        "h-3.5 w-3.5 shrink-0 transition-colors mt-0.5",
                                                    )} />

                                                    <span className="flex-1 truncate leading-tight min-w-0">
                                                        {chat.name || "New Discussion"}
                                                    </span>
                                                </button>

                                                {/* Trash button moved OUTSIDE of selection button to avoid nesting */}
                                                <div className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 mr-1 z-10">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onDeleteChat(chat._id);
                                                        }}
                                                        className="h-7 w-7 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-zinc-400 hover:text-red-500 transition-colors"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            )}

                            <div
                                ref={bottomRef}
                                className="h-8 w-full flex justify-center items-center mt-2"
                            >
                                {isFetchingNextPage && (
                                    <div className="flex gap-1.5 opacity-50">
                                        <div className="h-1 w-1 rounded-full bg-zinc-400 animate-bounce [animation-duration:0.8s]" />
                                        <div className="h-1 w-1 rounded-full bg-zinc-400 animate-bounce [animation-duration:0.8s] [animation-delay:0.2s]" />
                                        <div className="h-1 w-1 rounded-full bg-zinc-400 animate-bounce [animation-duration:0.8s] [animation-delay:0.4s]" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* CSS for custom scrollbar */}
                    <style jsx global>{`
                        .custom-scrollbar::-webkit-scrollbar {
                            width: 5px;
                        }
                        .custom-scrollbar::-webkit-scrollbar-track {
                            background: transparent;
                        }
                        .custom-scrollbar::-webkit-scrollbar-thumb {
                            background: transparent;
                            border-radius: 10px;
                        }
                        .custom-scrollbar:hover::-webkit-scrollbar-thumb {
                            background: rgba(0, 0, 0, 0.1);
                        }
                        .dark .custom-scrollbar:hover::-webkit-scrollbar-thumb {
                            background: rgba(255, 255, 255, 0.05);
                        }
                    `}</style>
                </motion.aside>
            )}
        </AnimatePresence>
    );
};
