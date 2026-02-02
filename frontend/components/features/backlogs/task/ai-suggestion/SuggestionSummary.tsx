"use client";

import { Input } from "@/components/ui/input";
import { Target } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SuggestionSummaryProps {
    summary: string;
    setSummary: (value: string) => void;
}

export function SuggestionSummary({ summary, setSummary }: SuggestionSummaryProps) {
    return (
        <AnimatePresence>
            {summary && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    className="relative overflow-hidden rounded-md bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800 p-4 pl-3"
                >
                    <div className="flex gap-3">
                        <div className="mt-1 shrink-0">
                            <Target className="h-5 w-5 text-zinc-800 dark:text-zinc-200" />
                        </div>
                        <div className="flex-1 space-y-1">
                            <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 select-none">
                                Objective
                            </h4>
                            <Input
                                value={summary}
                                onChange={(e) => setSummary(e.target.value)}
                                className="h-auto p-0 border-none text-sm font-medium text-zinc-900 dark:text-zinc-100 shadow-none focus-visible:ring-0 bg-transparent leading-relaxed"
                            />
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
