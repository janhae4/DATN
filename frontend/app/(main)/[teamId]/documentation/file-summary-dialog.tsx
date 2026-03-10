"use client";

import * as React from "react";
import { Sparkles, Copy, Check, Bot, FileText, Brain, RotateCcw } from "lucide-react";
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
      <DialogContent className="sm:max-w-3xl h-[90vh] sm:h-[80vh] flex flex-col p-0 gap-0 overflow-hidden border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#09090b] shadow-2xl">
        {/* Header Section */}
        <div className="shrink-0 p-6 border-b border-zinc-100 dark:border-zinc-800 bg-linear-to-br from-indigo-50/40 via-white to-white dark:from-indigo-500/5 dark:via-zinc-950 dark:to-zinc-950 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
          
          <DialogHeader className="relative z-10">
            <div className="flex items-center gap-4">
              <div className="relative group">
                <div className="absolute inset-[-4px] bg-linear-to-tr from-indigo-500 to-purple-500 blur-md opacity-30 group-hover:opacity-50 rounded-xl transition-opacity" />
                <div className="relative p-2.5 bg-white dark:bg-zinc-900 rounded-xl border border-indigo-100 dark:border-indigo-500/20 shadow-sm transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6">
                  <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
              </div>
              
              <div className="space-y-1">
                <DialogTitle className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  Nexus AI Insights
                  <span className="hidden sm:inline-flex text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-100 dark:border-indigo-500/20 tracking-wider">
                    BETA
                  </span>
                </DialogTitle>
                <div className="flex items-center gap-2 text-xs text-zinc-500 font-medium">
                  <FileText className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="truncate max-w-[200px] sm:max-w-[400px]">
                    {file?.fileName}
                  </span>
                </div>
              </div>
            </div>
          </DialogHeader>

          {/* Progress Bar with Gradient - No Shadow */}
          {isLoading && (
            <div className="absolute bottom-0 left-0 w-full h-[2px] bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
              <div 
                className="h-full bg-linear-to-r from-indigo-500 via-purple-500 to-indigo-500 animate-progress-slide"
                style={{ width: '40%', backgroundSize: '200% 100%' }}
              />
            </div>
          )}
        </div>

        {/* Content Section - Using flex-1 to occupy space between header and footer */}
        <div className="flex-1 min-h-0 relative bg-zinc-50/30 dark:bg-black/20 overflow-hidden">
          {!summaryContent && isLoading ? (
            <div className="h-full flex flex-col items-center justify-center p-12 space-y-6">
              <div className="relative">
                <div className="absolute inset-0 bg-indigo-500/10 blur-3xl animate-pulse rounded-full" />
                <div className="relative p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl group transition-all duration-500 hover:scale-105">
                  <Bot className="w-12 h-12 text-indigo-600 dark:text-indigo-400 animate-gentle-bounce" />
                  <div className="absolute inset-0 rounded-2xl animate-ping-slow border border-indigo-500/20" />
                </div>
              </div>
              <div className="text-center space-y-2 max-w-[300px]">
                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 italic flex items-center justify-center gap-2">
                  Synthesizing insights
                  <span className="flex gap-0.5">
                    <span className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.1s]" />
                    <span className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.3s]" />
                  </span>
                </h3>
                <p className="text-xs text-zinc-500 leading-relaxed font-medium">
                  Nexus AI is distilling the document essence into key insights.
                </p>
              </div>
            </div>
          ) : (
            <ScrollArea className="h-full w-full">
              <div className="p-8">
                <article className="text-zinc-700 dark:text-zinc-300 leading-relaxed font-medium text-sm sm:text-base">
                  {summaryContent ? (
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h1: ({ ...props }) => <h1 className="text-2xl font-bold mb-4 mt-6 text-zinc-900 dark:text-zinc-100" {...props} />,
                        h2: ({ ...props }) => <h2 className="text-xl font-bold mb-3 mt-5 text-zinc-900 dark:text-zinc-100" {...props} />,
                        h3: ({ ...props }) => <h3 className="text-lg font-bold mb-2 mt-4 text-zinc-900 dark:text-zinc-100" {...props} />,
                        p: ({ ...props }) => <p className="mb-4 last:mb-0" {...props} />,
                        ul: ({ ...props }) => <ul className="list-disc pl-6 mb-4 space-y-1" {...props} />,
                        ol: ({ ...props }) => <ol className="list-decimal pl-6 mb-4 space-y-1" {...props} />,
                        li: ({ ...props }) => <li className="mb-1" {...props} />,
                        strong: ({ ...props }) => <strong className="font-bold text-zinc-900 dark:text-zinc-100" {...props} />,
                        blockquote: ({ ...props }) => <blockquote className="border-l-4 border-indigo-200 dark:border-indigo-900/50 pl-4 italic my-4" {...props} />,
                        code: ({ ...props }) => (
                          <code className="bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-xs sm:text-sm font-mono" {...props} />
                        ),
                        pre: ({ ...props }) => (
                          <pre className="bg-zinc-100 dark:bg-zinc-900 p-4 rounded-xl my-4 overflow-x-auto text-xs sm:text-sm font-mono border border-zinc-200 dark:border-zinc-800" {...props} />
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
                      <span className="w-1.5 h-1.5 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-1.5 h-1.5 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-1.5 h-1.5 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-bounce" />
                    </span>
                  )}
                </article>
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Footer Section */}
        <div className="shrink-0 p-4 sm:p-6 bg-white dark:bg-[#09090b] border-t border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
            <Brain className="w-3.5 h-3.5 text-indigo-500" />
            <span className="text-[10px] sm:text-xs text-zinc-500 font-medium">
              AI can make mistakes. Verify important info.
            </span>
          </div>
          
          <div className="flex gap-3 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={onRegenerate}
              disabled={isLoading}
              className="flex-1 sm:flex-none h-10 rounded-xl text-xs font-bold gap-2 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all active:scale-95"
            >
              <RotateCcw className={cn("w-4 h-4 text-zinc-500", isLoading && "animate-spin")} />
              Regenerate
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              disabled={!summaryContent}
              className="flex-1 sm:flex-none h-10 rounded-xl text-xs font-bold gap-2 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all active:scale-95"
            >
              {isCopied ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              {isCopied ? "Copied!" : "Copy Summary"}
            </Button>
            <Button
              size="sm"
              onClick={() => onOpenChange(false)}
              className="flex-1 sm:flex-none h-10 px-8 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
            >
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
