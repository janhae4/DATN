"use client";

import * as React from "react";
import { Sparkles, Copy, Check, Bot, FileText, Brain, RotateCcw, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Attachment } from "@/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface AISummaryDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  file: Attachment | null;
  summaryContent: string;
  isLoading: boolean;
  onRegenerate: () => void;
}

export function AISummaryDialog({
  isOpen,
  onOpenChange,
  file,
  summaryContent,
  isLoading,
  onRegenerate,
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
      <DialogContent className="sm:max-w-3xl h-[90vh] sm:h-[80vh] flex flex-col p-0 gap-0 overflow-hidden border-zinc-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 shadow-md rounded-md">
        {/* Header Section */}
        <div className="shrink-0 p-6 border-b border-zinc-200 dark:border-neutral-800 bg-zinc-50 dark:bg-neutral-900 relative overflow-hidden backdrop-blur-xl">
          <DialogHeader className="relative z-10">
            <div className="flex items-center gap-4">
              <div className="relative group">
                <div className="relative p-2.5 bg-white dark:bg-neutral-950 rounded-md border border-zinc-200 dark:border-neutral-700 shadow-sm transition-transform duration-500 group-hover:scale-110">
                  <Sparkles className="w-5 h-5 text-neutral-900 dark:text-neutral-100" />
                </div>
              </div>

              <div className="space-y-1">
                <DialogTitle className="text-lg font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                  Nexus AI Insights
                  <span className="hidden sm:inline-flex text-[10px] px-2 py-0.5 rounded-sm bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-bold border border-zinc-300 dark:border-neutral-700 tracking-wider">
                    BETA
                  </span>
                </DialogTitle>
                <div className="flex items-center gap-2 text-xs text-neutral-500 font-medium">
                  <FileText className="w-3.5 h-3.5 text-neutral-400" />
                  <span className="truncate max-w-[200px] sm:max-w-[400px]">
                    {file?.fileName}
                  </span>
                </div>
              </div>
            </div>
          </DialogHeader>

          {/* Progress Bar with Gradient - No Shadow */}
          {isLoading && (
            <div className="absolute bottom-0 left-0 w-full h-[2px] bg-zinc-200 dark:bg-neutral-800 overflow-hidden">
              <div
                className="h-full bg-neutral-900 dark:bg-white animate-progress-slide"
                style={{ width: '40%', backgroundSize: '200% 100%' }}
              />
            </div>
          )}
        </div>

        {/* Content Section - Using flex-1 to occupy space between header and footer */}
        <div className="flex-1 min-h-0 relative bg-white dark:bg-[#0a0a0a] overflow-hidden">
          {!summaryContent && isLoading ? (
            <div className="h-full flex flex-col items-center justify-center p-12 space-y-6">
              <div className="relative">
                <div className="relative p-6 bg-zinc-50 dark:bg-neutral-900 rounded-md border border-zinc-200 dark:border-neutral-800 shadow-sm group transition-all duration-500 hover:scale-105">
                  <Bot className="w-12 h-12 text-neutral-900 dark:text-neutral-100 animate-pulse" />
                </div>
              </div>
              <div className="text-center space-y-2 max-w-[300px]">
                <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 italic flex items-center justify-center gap-2">
                  Synthesizing insights
                  <span className="flex gap-0.5">
                    <span className="w-1 h-1 bg-neutral-900 dark:bg-white rounded-full animate-bounce [animation-delay:0.1s]" />
                    <span className="w-1 h-1 bg-neutral-900 dark:bg-white rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1 h-1 bg-neutral-900 dark:bg-white rounded-full animate-bounce [animation-delay:0.3s]" />
                  </span>
                </h3>
                <p className="text-xs text-neutral-500 leading-relaxed font-medium">
                  Nexus AI is distilling the document essence into key insights.
                </p>
              </div>
            </div>
          ) : (
            <ScrollArea className="h-full w-full">
              <div className="p-8">
                <article className="text-neutral-700 dark:text-neutral-300 leading-relaxed font-medium text-sm sm:text-base">
                  {summaryContent ? (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h1: ({ ...props }) => <h1 className="text-2xl font-bold mb-4 mt-6 text-neutral-900 dark:text-white" {...props} />,
                        h2: ({ ...props }) => <h2 className="text-xl font-bold mb-3 mt-5 text-neutral-900 dark:text-white" {...props} />,
                        h3: ({ ...props }) => <h3 className="text-lg font-bold mb-2 mt-4 text-neutral-900 dark:text-white" {...props} />,
                        p: ({ ...props }) => <p className="mb-4 last:mb-0" {...props} />,
                        ul: ({ ...props }) => <ul className="list-disc pl-6 mb-4 space-y-1" {...props} />,
                        ol: ({ ...props }) => <ol className="list-decimal pl-6 mb-4 space-y-1" {...props} />,
                        li: ({ ...props }) => <li className="mb-1" {...props} />,
                        strong: ({ ...props }) => <strong className="font-bold text-neutral-900 dark:text-white" {...props} />,
                        blockquote: ({ ...props }) => <blockquote className="border-l-4 border-zinc-300 dark:border-neutral-700 pl-4 italic my-4 text-neutral-600 dark:text-neutral-400" {...props} />,
                        code: ({ ...props }) => (
                          <code className="bg-zinc-100 dark:bg-neutral-900 px-1.5 py-0.5 rounded-sm text-xs sm:text-sm font-mono text-neutral-900 dark:text-white" {...props} />
                        ),
                        pre: ({ ...props }) => (
                          <pre className="bg-zinc-100 dark:bg-neutral-900 p-4 rounded-md my-4 overflow-x-auto text-xs sm:text-sm font-mono border border-zinc-200 dark:border-neutral-800" {...props} />
                        ),
                      }}
                    >
                      {summaryContent}
                    </ReactMarkdown>
                  ) : (
                    <p className="italic opacity-50">Waiting for insights to emerge...</p>
                  )}
                  {isLoading && summaryContent && (
                    <span className="inline-flex ml-2 items-center gap-1 opacity-70">
                      <span className="w-1.5 h-1.5 bg-neutral-900 dark:bg-white rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-1.5 h-1.5 bg-neutral-900 dark:bg-white rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-1.5 h-1.5 bg-neutral-900 dark:bg-white rounded-full animate-bounce" />
                    </span>
                  )}
                </article>
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Footer Section */}
        <div className="shrink-0 p-4 sm:p-6 bg-zinc-50 dark:bg-neutral-900 border-t border-zinc-200 dark:border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-b-md">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-white dark:bg-neutral-950 border border-zinc-200 dark:border-neutral-800 hidden sm:flex">
            <AlertTriangle className="w-3.5 h-3.5 text-neutral-900 dark:text-white" />
            <span className="text-[10px] sm:text-xs text-neutral-500 font-medium">
              AI can make mistakes. Verify important info.
            </span>
          </div>

          <div className="flex gap-3 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={onRegenerate}
              disabled={isLoading}
              className="flex-1 sm:flex-none h-10 rounded-md text-xs font-bold gap-2 border-zinc-200 dark:border-neutral-800 hover:bg-zinc-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-all active:scale-95 bg-white dark:bg-neutral-950"
            >
              <RotateCcw className={cn("w-4 h-4 text-neutral-500", isLoading && "animate-spin")} />
              Regenerate
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              disabled={!summaryContent}
              className="flex-1 sm:flex-none h-10 rounded-md text-xs font-bold gap-2 border-zinc-200 dark:border-neutral-800 hover:bg-zinc-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-all active:scale-95 bg-white dark:bg-neutral-950"
            >
              {isCopied ? (
                <Check className="w-4 h-4 text-neutral-900 dark:text-white" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              {isCopied ? "Copied!" : "Copy Summary"}
            </Button>
            <Button
              size="sm"
              onClick={() => onOpenChange(false)}
              className="flex-1 sm:flex-none h-10 px-8 rounded-md text-xs font-bold bg-neutral-900 hover:bg-black text-white dark:bg-white dark:hover:bg-neutral-200 dark:text-black shadow-sm transition-all active:scale-95"
            >
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
