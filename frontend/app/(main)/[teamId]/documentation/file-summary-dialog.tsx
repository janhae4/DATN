"use client";

import * as React from "react";
import { Sparkles, X, Copy, Check, Bot, FileText, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Attachment } from "@/types";
import { toast } from "sonner";

interface AISummaryDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  file: Attachment | null;
  summaryContent: string;
  isLoading: boolean;
}

export function AISummaryDialog({
  isOpen,
  onOpenChange,
  file,
  summaryContent,
  isLoading,
}: AISummaryDialogProps) {
  const [isCopied, setIsCopied] = React.useState(false);

  const handleCopy = () => {
    if (!summaryContent) return;
    navigator.clipboard.writeText(summaryContent);
    setIsCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl p-0 gap-0 overflow-hidden border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#09090b]">
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 bg-gradient-to-r from-zinc-50/50 to-white dark:from-zinc-900/50 dark:to-zinc-950/50">
          <DialogHeader className="flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg border border-indigo-100 dark:border-indigo-500/20">
                <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="space-y-1">
                <DialogTitle className="text-base font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  Nexus AI Summary
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-medium border border-zinc-200 dark:border-zinc-700">
                    BETA
                  </span>
                </DialogTitle>
                <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                  <FileText className="w-3 h-3" />
                  <span className="truncate max-w-[300px]">
                    {file?.fileName}
                  </span>
                </div>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>
        </div>

        <div className="relative min-h-[300px] max-h-[60vh] flex flex-col">
          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-4 animate-in fade-in duration-500">
              <div className="relative">
                <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 animate-pulse rounded-full" />
                <Bot
                  className="w-12 h-12 text-indigo-600 dark:text-indigo-400 relative z-10 animate-bounce"
                  style={{ animationDuration: "3s" }}
                />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  Analyzing Document...
                </h3>
                <p className="text-xs text-zinc-500 max-w-[250px]">
                  Nexus AI is reading the file content and extracting key
                  insights.
                </p>
              </div>
            </div>
          ) : (
            <ScrollArea className="flex-1 p-6">
              <div className="prose prose-sm dark:prose-invert max-w-none text-zinc-600 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap animate-in fade-in slide-in-from-bottom-2 duration-500">
                {summaryContent || "No summary available."}
              </div>
            </ScrollArea>
          )}
        </div>

        {!isLoading && (
          <>
            <Separator className="bg-zinc-100 dark:bg-zinc-800" />
            <div className="p-4 bg-zinc-50/50 dark:bg-zinc-900/30 flex items-center justify-between">
              <div className="text-[10px] text-zinc-400 italic">
                AI generated content may vary in accuracy.
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="h-8 text-xs gap-2"
                >
                  {isCopied ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  {isCopied ? "Copied" : "Copy Text"}
                </Button>
                <Button
                  size="sm"
                  onClick={() => onOpenChange(false)}
                  className="h-8 text-xs bg-zinc-900 dark:bg-zinc-100 text-white dark:text-black hover:bg-zinc-800"
                >
                  Done
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
