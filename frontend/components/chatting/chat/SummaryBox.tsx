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

interface SummaryBoxProps {
    open: boolean;
    onClose: () => void;
}

export const SummaryBox: React.FC<SummaryBoxProps> = ({ open, onClose }) => {
    const [isLoading, setIsLoading] = React.useState(true);
    const [summary, setSummary] = React.useState("");

    React.useEffect(() => {
        if (open) {
            setIsLoading(true);
            // Simulate AI summarization
            setTimeout(() => {
                setSummary(`**Key Discussion Points:**

• Project timeline has been adjusted to accommodate the new feature requests
• Team agreed to prioritize bug fixes over new features for the next sprint
• Design review scheduled for next Monday at 2 PM
• Backend API integration is 80% complete

**Action Items:**
1. John to review the PR by end of day
2. Sarah to update the documentation
3. Mike to schedule follow-up meeting with stakeholders

**Decisions Made:**
- Moving forward with React 18 migration
- Adopting TypeScript strict mode for new code
- Weekly sync meetings on Mondays at 10 AM`);
                setIsLoading(false);
            }, 2000);
        }
    }, [open]);

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[80vh] p-0">
                <DialogHeader className="px-6 pt-6 pb-4 border-b border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center gap-3">
                        <Icon icon="lucide:sparkles" width="20" className="text-zinc-900 dark:text-zinc-100" />
                        <div>
                            <DialogTitle className="text-lg font-semibold">
                                Conversation Summary
                            </DialogTitle>
                            <DialogDescription className="text-sm">
                                AI-generated summary from recent messages
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <ScrollArea className="max-h-[calc(80vh-180px)]">
                    <div className="px-6 py-4">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-12 gap-4">
                                <div className="relative w-12 h-12">
                                    <div className="absolute inset-0 border-4 border-zinc-200 dark:border-zinc-800 rounded-full"></div>
                                    <div className="absolute inset-0 border-4 border-transparent border-t-zinc-900 dark:border-t-zinc-100 rounded-full animate-spin"></div>
                                </div>
                                <div className="text-center">
                                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                                        Analyzing conversation...
                                    </p>
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                                        This may take a few moments
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {summary.split('\n').map((line, i) => {
                                    if (line.startsWith('**') && line.endsWith('**')) {
                                        return (
                                            <h4 key={i} className="font-semibold text-zinc-900 dark:text-zinc-50 mt-6 first:mt-0">
                                                {line.replace(/\*\*/g, '')}
                                            </h4>
                                        );
                                    }
                                    if (line.startsWith('•')) {
                                        return (
                                            <div key={i} className="flex gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                                                <span className="text-zinc-400 dark:text-zinc-600">•</span>
                                                <span>{line.substring(2)}</span>
                                            </div>
                                        );
                                    }
                                    if (line.match(/^\d+\./)) {
                                        return (
                                            <div key={i} className="flex gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                                                <span className="text-zinc-900 dark:text-zinc-100 font-medium">
                                                    {line.match(/^\d+\./)?.[0]}
                                                </span>
                                                <span>{line.replace(/^\d+\.\s*/, '')}</span>
                                            </div>
                                        );
                                    }
                                    if (line.startsWith('-')) {
                                        return (
                                            <div key={i} className="flex gap-2 text-sm text-zinc-700 dark:text-zinc-300 ml-4">
                                                <span className="text-zinc-400 dark:text-zinc-600">→</span>
                                                <span>{line.substring(2)}</span>
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
                                })}
                            </div>
                        )}
                    </div>
                </ScrollArea>

                <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        AI-generated • May not be 100% accurate
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="default"
                            size="sm"
                            onClick={onClose}
                        >
                            Close
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
