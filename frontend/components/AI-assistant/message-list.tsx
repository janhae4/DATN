"use client";

import * as React from "react";
import { Loader2, Sparkles, Bot, User, BotIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MarkdownRenderer } from "./markdown-renderer";
import { AiMessage } from "@/types";

interface MessageListProps {
    messages: AiMessage[];
    streamingContent: string;
    isStreaming: boolean;
    isFetchingNextPage: boolean;
    activeId: string | undefined;
    viewportRef: React.RefObject<HTMLDivElement | null>;
    topRef: (node?: Element | null) => void;
    bottomRef: React.RefObject<HTMLDivElement | null>;
}

export const MessageList = ({
    messages,
    streamingContent,
    isStreaming,
    isFetchingNextPage,
    activeId,
    viewportRef,
    topRef,
    bottomRef,
}: MessageListProps) => {
    return (
        <div
            ref={viewportRef}
            className="flex-1 overflow-y-auto px-4"
        >
            <div className="max-w-3xl mx-auto py-8">
                {activeId && (
                    <div
                        ref={topRef}
                        className="h-6 w-full flex justify-center items-center mb-4"
                    >
                        {isFetchingNextPage && (
                            <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
                        )}
                    </div>
                )}

                <AnimatePresence mode="popLayout">
                    {messages.length === 0 && !streamingContent ? (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col items-center justify-center min-h-[40vh] text-center px-4"
                        >
                            <div className="h-12 w-12 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center mb-6">
                                <BotIcon className="h-6 w-6 text-zinc-900 dark:text-zinc-100" />
                            </div>
                            <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                                How can I help you today?
                            </h1>
                        </motion.div>
                    ) : (
                        <div className="space-y-6 pb-4">
                            {messages.map((msg: AiMessage) => {
                                const isAi = msg.sender._id === "AI_ID";
                                return (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.2 }}
                                        key={msg._id}
                                        className={cn(
                                            "flex w-full gap-4",
                                            !isAi ? "justify-end" : "justify-start"
                                        )}
                                    >
                                        {isAi && (
                                            <Avatar className="h-8 w-8 shrink-0 border border-zinc-200 dark:border-zinc-700">
                                                <AvatarFallback className="bg-zinc-50 dark:bg-zinc-800">
                                                    <Bot className="h-4 w-4 text-zinc-900 dark:text-zinc-100" />
                                                </AvatarFallback>
                                            </Avatar>
                                        )}

                                        <div
                                            className={cn(
                                                "relative max-w-[85%] md:max-w-[75%] px-5  rounded-2xl text-[15px] leading-relaxed",
                                                !isAi
                                                    ? "bg-zinc-100 py-3.5 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-tr-sm"
                                                    : "bg-transparent  ml-2 text-zinc-900 dark:text-zinc-100 px-0 md:px-0 lg:px-0"
                                            )}
                                        >
                                            <div className={cn("prose dark:prose-invert max-w-none break-words prose-p:leading-7 prose-pre:bg-zinc-900 prose-pre:rounded-lg prose-pre:p-4", isAi && "prose-zinc")}>
                                                <MarkdownRenderer text={msg.content} />
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}

                            {/* Streaming Content */}
                            {streamingContent && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex w-full gap-4 justify-start"
                                >
                                    <Avatar className="h-8 w-8 shrink-0 border border-zinc-200 dark:border-zinc-700">
                                        <AvatarFallback className="bg-zinc-50 dark:bg-zinc-800">
                                            <Bot className="h-4 w-4 text-zinc-900 dark:text-zinc-100" />
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="relative max-w-[85%] md:max-w-[75%] text-[15px] leading-relaxed -ml-2 text-zinc-900 dark:text-zinc-100">
                                        <MarkdownRenderer text={streamingContent} />
                                        <span className="inline-block w-2 h-4 ml-1 bg-zinc-900 dark:bg-zinc-100 animate-pulse align-middle rounded-sm" />
                                    </div>
                                </motion.div>
                            )}

                            {isStreaming && !streamingContent && (
                                <div className="flex gap-2 items-center ml-12">
                                    <span className="h-2 w-2 bg-zinc-300 dark:bg-zinc-700 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                    <span className="h-2 w-2 bg-zinc-300 dark:bg-zinc-700 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                    <span className="h-2 w-2 bg-zinc-300 dark:bg-zinc-700 rounded-full animate-bounce" />
                                </div>
                            )}
                            <div ref={bottomRef} className="h-4" />
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
