"use client";

import * as React from "react";
import { ArrowUp, Loader2, Paperclip } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ChatInputProps {
    input: string;
    setInput: (val: string) => void;
    onSend: () => void;
    isStreaming: boolean;
}

export const ChatInput = ({ input, setInput, onSend, isStreaming }: ChatInputProps) => {
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);

    React.useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [input]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (input.trim() && !isStreaming) {
                onSend();
            }
        }
    };

    return (
        <div className="shrink-0 py-6 px-4 bg-white dark:bg-zinc-950">
            <div className="max-w-3xl mx-auto">
                <div className={cn(
                    "relative flex items-end w-full p-2 gap-2 transition-all duration-200 ease-in-out",
                    "border border-zinc-200 dark:border-zinc-800 rounded-2xl",
                    "bg-zinc-50/50 dark:bg-zinc-900/50",
                    "focus-within:bg-white dark:focus-within:bg-black",
                    "focus-within:border-zinc-300 dark:focus-within:border-zinc-700",
                    "focus-within:shadow-[0_2px_20px_rgba(0,0,0,0.05)] dark:focus-within:shadow-none"
                )}>
                 

                    {/* Text Area */}
                    <Textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a message..."
                        className={cn(
                            "flex-1 min-h-[44px] max-h-64 py-3 px-3",
                            "bg-transparent border-none focus-visible:ring-0 shadow-none",
                            "text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400 dark:placeholder:text-zinc-500",
                            "text-[15px] leading-relaxed resize-none scrollbar-none"
                        )}
                        rows={1}
                    />

                    {/* Send Button */}
                    <div className="flex shrink-0 pb-1 pr-1">
                        <Button
                            size="icon"
                            onClick={onSend}
                            disabled={!input.trim() || isStreaming}
                            className={cn(
                                "h-8 w-8 rounded-full transition-all duration-200",
                                input.trim() && !isStreaming
                                    ? "bg-black text-white dark:bg-white dark:text-black hover:opacity-90 shadow-sm"
                                    : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-600 cursor-not-allowed"
                            )}
                        >
                            <AnimatePresence mode="wait">
                                {isStreaming ? (
                                    <motion.div
                                        key="loading"
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                    >
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="send"
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                    >
                                        <ArrowUp className="h-4 w-4 stroke-[2.5px]" />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </Button>
                    </div>
                </div>

                {/* Footer Text */}
                <div className="text-center mt-3">
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-medium">
                        Enter to send <span className="mx-1 opacity-30">|</span> Shift + Enter for new line
                    </p>
                </div>
            </div>
        </div>
    );
};