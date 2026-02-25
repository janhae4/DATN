import React from "react";
import { Icon } from "@iconify-icon/react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { discussionService } from "@/services/discussionService";
import { toast } from "sonner";

interface SummaryBoxProps {
    open: boolean;
    onClose: () => void;
    discussionId?: string | null;
    messageLimit?: number;
}

export const SummaryBox: React.FC<SummaryBoxProps> = ({
    open,
    onClose,
    discussionId,
    messageLimit = 50,
}) => {
    const [isLoading, setIsLoading] = React.useState(false);
    const [summary, setSummary] = React.useState<string>("");
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (!open) return;

        setSummary("");
        setError(null);
        setIsLoading(true);

        if (!discussionId) {
            setError("No channel selected.");
            setIsLoading(false);
            return;
        }

        discussionService
            .summarizeDiscussion(discussionId, messageLimit)
            .then((result) => {
                const text =
                    typeof result === "string"
                        ? result
                        : typeof result?.summary === "string"
                            ? result.summary
                            : null;

                if (text) {
                    setSummary(text);
                } else {
                    setError("Failed to generate summary. Please try again.");
                }
            })
            .catch(() => {
                setError("Failed to summarize conversation. Please try again.");
                toast.error("Summarization failed");
            })
            .finally(() => setIsLoading(false));
    }, [open, discussionId, messageLimit]);

    const renderSummary = (text: string) =>
        text.split("\n").map((line, i) => {
            if (line.startsWith("**") && line.endsWith("**")) {
                return (
                    <h4
                        key={i}
                        className="font-semibold text-zinc-900 dark:text-zinc-50 mt-6 first:mt-0"
                    >
                        {line.replace(/\*\*/g, "")}
                    </h4>
                );
            }
            if (line.startsWith("•") || line.startsWith("-")) {
                const content = line.substring(line.startsWith("•") ? 2 : 2);
                return (
                    <div
                        key={i}
                        className="flex gap-2 text-sm text-zinc-700 dark:text-zinc-300"
                    >
                        <span className="text-indigo-400 shrink-0">•</span>
                        <span>{content}</span>
                    </div>
                );
            }
            if (line.match(/^\d+\./)) {
                return (
                    <div
                        key={i}
                        className="flex gap-2 text-sm text-zinc-700 dark:text-zinc-300"
                    >
                        <span className="text-zinc-900 dark:text-zinc-100 font-medium shrink-0">
                            {line.match(/^\d+\./)?.[0]}
                        </span>
                        <span>{line.replace(/^\d+\.\s*/, "")}</span>
                    </div>
                );
            }
            return line ? (
                <p key={i} className="text-sm text-zinc-700 dark:text-zinc-300">
                    {line}
                </p>
            ) : (
                <div key={i} className="h-2" />
            );
        });

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[80vh] p-0 overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-2xl">
                {/* Header */}
                <DialogHeader className="px-6 pt-6 pb-4 border-b border-zinc-200 dark:border-zinc-800 bg-gradient-to-r from-indigo-50 to-zinc-50 dark:from-indigo-950/30 dark:to-zinc-900/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/50">
                            <Icon
                                icon="lucide:sparkles"
                                width="18"
                                className="text-indigo-600 dark:text-indigo-400"
                            />
                        </div>
                        <div>
                            <DialogTitle className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                                Conversation Summary
                            </DialogTitle>
                            <DialogDescription className="text-sm text-zinc-500 dark:text-zinc-400">
                                AI-generated summary from recent messages
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                {/* Body */}
                <ScrollArea className="max-h-[calc(80vh-180px)]">
                    <div className="px-6 py-5">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-16 gap-5">
                                <div className="relative w-14 h-14">
                                    <div className="absolute inset-0 border-4 border-zinc-200 dark:border-zinc-800 rounded-full" />
                                    <div className="absolute inset-0 border-4 border-transparent border-t-indigo-500 dark:border-t-indigo-400 rounded-full animate-spin" />
                                    <div className="absolute inset-2 flex items-center justify-center">
                                        <Icon
                                            icon="lucide:sparkles"
                                            width="16"
                                            className="text-indigo-500 dark:text-indigo-400 animate-pulse"
                                        />
                                    </div>
                                </div>
                                <div className="text-center">
                                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                                        Analyzing conversation…
                                    </p>
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                                        This may take up to 30 seconds
                                    </p>
                                </div>
                            </div>
                        ) : error ? (
                            <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                                <div className="p-3 rounded-full bg-red-50 dark:bg-red-950/30">
                                    <Icon
                                        icon="lucide:alert-circle"
                                        width="24"
                                        className="text-red-500"
                                    />
                                </div>
                                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                    {error}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {renderSummary(summary)}
                            </div>
                        )}
                    </div>
                </ScrollArea>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-between">
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5">
                        <Icon icon="lucide:info" width="12" />
                        AI-generated · May not be 100% accurate
                    </p>
                    <Button variant="default" size="sm" onClick={onClose}>
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
