"use client";

import * as React from "react";
import {
  Send,
  Sparkles,
  Loader2,
  BrainCircuit,
  Plus,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Trash2,
  Bot,
  User,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import { PrismAsyncLight as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAiDiscussion } from "@/hooks/useAiDiscussion";
import { useAiChat } from "@/hooks/useAiChat";
import { AiMessage } from "@/types";
import { useQueryClient } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";

const MarkdownRenderer = ({ text }: { text: string }) => (
  <ReactMarkdown
    rehypePlugins={[rehypeRaw]}
    components={{
      code: ({ node, inline, className, children, ...props }: any) => {
        const match = /language-(\w+)/.exec(className || "");
        return !inline ? (
          <div className="rounded-lg overflow-hidden my-3 border border-zinc-200/50 dark:border-zinc-700/50 shadow-sm">
            <div className="bg-zinc-100 dark:bg-zinc-800/80 px-3 py-1.5 flex justify-between items-center border-b border-zinc-200/50 dark:border-zinc-700/50">
              <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
                {match ? match[1] : "code"}
              </span>
            </div>
            <SyntaxHighlighter
              style={vscDarkPlus as any}
              language={match ? match[1] : "text"}
              PreTag="div"
              customStyle={{
                margin: 0,
                padding: "1rem",
                fontSize: "0.875rem",
                backgroundColor: "transparent",
              }}
              className="bg-zinc-900 dark:bg-[#0c0c0e]"
              {...props}
            >
              {String(children).replace(/\n$/, "")}
            </SyntaxHighlighter>
          </div>
        ) : (
          <code
            className="bg-zinc-100 dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded text-sm font-mono"
            {...props}
          >
            {children}
          </code>
        );
      },
      p: ({ children }) => (
        <p className="leading-7 mb-3 last:mb-0 text-[15px]">{children}</p>
      ),
      ul: ({ children }) => (
        <ul className="list-disc pl-5 space-y-1 mb-3">{children}</ul>
      ),
      ol: ({ children }) => (
        <ol className="list-decimal pl-5 space-y-1 mb-3">{children}</ol>
      ),
      h1: ({ children }) => (
        <h1 className="text-2xl font-bold mb-4 mt-6 first:mt-0">{children}</h1>
      ),
      h2: ({ children }) => (
        <h2 className="text-xl font-bold mb-3 mt-5 first:mt-0">{children}</h2>
      ),
      h3: ({ children }) => (
        <h3 className="text-lg font-semibold mb-2 mt-4 first:mt-0">{children}</h3>
      ),
      blockquote: ({ children }) => (
        <blockquote className="border-l-4 border-indigo-500 pl-4 py-1 my-4 italic text-zinc-600 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-900/50 rounded-r-lg">
          {children}
        </blockquote>
      ),
    }}
  >
    {text}
  </ReactMarkdown>
);

export default function AIAssistantUI() {
  const queryClient = useQueryClient();
  const [activeId, setActiveId] = React.useState<string | undefined>(undefined);
  const [input, setInput] = React.useState("");
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const activeIdRef = React.useRef(activeId);
  React.useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  const {
    discussions,
    isLoading: isLoadingList,
    fetchNextPage: fetchNextPageDiscussions,
    hasNextPage: hasNextPageDiscussions,
    isFetchingNextPage: isFetchingNextPageDiscussions,
    deleteDiscussion,
  } = useAiDiscussion();

  const {
    messages,
    sendMessage,
    isStreaming,
    setStreamingContent,
    streamingContent,
    fetchNextPage: fetchNextPageMessages,
    hasNextPage: hasNextPageMessages,
    isFetchingNextPage: isFetchingNextPageMessages,
  } = useAiChat(activeId);

  const messageViewportRef = React.useRef<HTMLDivElement>(null);
  const messageBottomRef = React.useRef<HTMLDivElement>(null);
  const previousScrollHeightRef = React.useRef(0);

  const { ref: sidebarBottomRef, inView: isSidebarBottomInView } = useInView();
  const { ref: messageTopRef, inView: isMessageTopInView } = useInView();

  React.useEffect(() => {
    if (isSidebarBottomInView && hasNextPageDiscussions) {
      fetchNextPageDiscussions();
    }
  }, [isSidebarBottomInView, hasNextPageDiscussions, fetchNextPageDiscussions]);

  React.useEffect(() => {
    if (
      isMessageTopInView &&
      hasNextPageMessages &&
      !isFetchingNextPageMessages
    ) {
      if (messageViewportRef.current) {
        previousScrollHeightRef.current =
          messageViewportRef.current.scrollHeight;
      }
      fetchNextPageMessages();
    }
  }, [
    isMessageTopInView,
    hasNextPageMessages,
    isFetchingNextPageMessages,
    fetchNextPageMessages,
  ]);

  React.useLayoutEffect(() => {
    const viewport = messageViewportRef.current;
    if (
      !viewport ||
      previousScrollHeightRef.current === 0 ||
      isFetchingNextPageMessages
    )
      return;

    const newScrollHeight = viewport.scrollHeight;
    const diff = newScrollHeight - previousScrollHeightRef.current;

    if (diff > 0) {
      viewport.scrollTop = viewport.scrollTop + diff;
      previousScrollHeightRef.current = 0;
    }
  }, [messages, isFetchingNextPageMessages]);

  React.useEffect(() => {
    const anchor = messageBottomRef.current;
    const viewport = messageViewportRef.current;

    if (!anchor || !viewport) return;

    const distanceFromBottom =
      viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
    // Increased threshold for better UX
    const isAtBottom = distanceFromBottom < 150;

    if (isStreaming || streamingContent || isAtBottom) {
      anchor.scrollIntoView({
        behavior: isStreaming || streamingContent ? "smooth" : "auto", // Smooth for streaming
        block: "end",
      });
    }
  }, [messages, streamingContent, isStreaming, activeId]);

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;

    const currentInput = input;
    setInput("");
    setStreamingContent("");
    const sendingDiscussionId = activeId;

    let buffer = "";
    let fullText = "";
    let localNewId: string | null = null;

    try {
      await sendMessage({
        discussionId: activeId || "",
        message: currentInput,
        onChunk: (chunk: string) => {
          if (
            activeIdRef.current !== sendingDiscussionId &&
            activeIdRef.current !== localNewId
          ) {
            return;
          }

          buffer += chunk;
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          lines.forEach((line) => {
            const trimmedLine = line.trim();
            if (!trimmedLine.startsWith("data:")) return;
            try {
              const parsed = JSON.parse(trimmedLine.replace("data:", ""));
              if (
                !activeIdRef.current &&
                !localNewId &&
                parsed.metadata?.discussionId
              ) {
                const newId = parsed.metadata.discussionId;
                localNewId = newId;
                queryClient.setQueryData(["ai-discussions"], (oldData: any) => {
                  localNewId = parsed.metadata.discussionId; // Keep using local var for safety
                  queryClient.invalidateQueries({
                    queryKey: ["ai-discussions"],
                  });
                });
              }
              if (parsed.text) {
                fullText += parsed.text;
                setStreamingContent(fullText);
              }
            } catch (e) { }
          });

          if (!sendingDiscussionId && localNewId) {
            setActiveId(localNewId);
          }
        },
      });
    } catch (error) {
      console.error("Failed to send:", error);
      setInput(currentInput);
    }
  };

  const createNewChat = () => {
    setActiveId(undefined);
    setInput("");
  };

  return (
    <div className="flex w-full h-[85vh] md:h-[90vh] border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 overflow-hidden relative font-sans">
      {/* --- SIDEBAR --- */}
      <AnimatePresence mode="wait">
        {isSidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="flex flex-col h-full bg-zinc-50/50 dark:bg-zinc-900/20 border-r border-zinc-100 dark:border-zinc-800"
          >
            {/* Sidebar Header */}
            <div className="p-4 shrink-0">
              <Button
                onClick={createNewChat}
                variant="outline"
                className="w-full justify-start gap-3 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 h-10 shadow-sm"
              >
                <Plus className="h-4 w-4" />
                <span className="font-medium">New Chat</span>
              </Button>
            </div>

            <ScrollArea className="flex-1 px-3">
              <div className="pb-4 space-y-1">
                <p className="px-3 py-2 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  History
                </p>
                {isLoadingList ? (
                  <div className="p-4 text-center">
                    <Loader2 className="h-4 w-4 animate-spin mx-auto text-zinc-400" />
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    {discussions.map((chat) => (
                      <motion.div
                        layout
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        key={chat._id}
                        className="group relative"
                      >
                        <button
                          onClick={() => {
                            setStreamingContent("");
                            setActiveId(chat._id);
                          }}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors text-sm",
                            activeId === chat._id
                              ? "bg-zinc-200/60 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium"
                              : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-200"
                          )}
                        >
                          <span className="truncate flex-1">
                            {chat.name || "Untitled Chat"}
                          </span>
                        </button>
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteDiscussion(chat._id);
                            }}
                            className="h-6 w-6 rounded-md hover:bg-zinc-200/80 dark:hover:bg-zinc-700/50 text-zinc-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                <div
                  ref={sidebarBottomRef}
                  className="h-4 w-full flex justify-center items-center mt-2"
                >
                  {isFetchingNextPageDiscussions && (
                    <Loader2 className="h-3 w-3 animate-spin text-zinc-400" />
                  )}
                </div>
              </div>
            </ScrollArea>
          </motion.aside>
        )}
      </AnimatePresence>

      <main className="flex-1 flex flex-col h-full min-w-0 bg-white dark:bg-[#09090b] relative w-full">
        <header className="flex items-center justify-between px-4 h-14 border-b border-zinc-100 dark:border-zinc-800 shrink-0 sticky top-0 z-30 bg-white/80 dark:bg-[#09090b]/80 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="h-8 w-8 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              {isSidebarOpen ? (
                <PanelLeftClose className="h-4 w-4" />
              ) : (
                <PanelLeftOpen className="h-4 w-4" />
              )}
            </Button>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">Taskora AI</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-500">BETA</span>
            </div>
          </div>
        </header>

        <div
          ref={messageViewportRef}
          className="flex-1 overflow-y-auto px-4"
        >
          <div className="max-w-3xl mx-auto py-8">
            {activeId && (
              <div
                ref={messageTopRef}
                className="h-6 w-full flex justify-center items-center mb-4"
              >
                {isFetchingNextPageMessages && (
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
                    <Sparkles className="h-6 w-6 text-zinc-900 dark:text-zinc-100" />
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
                            "relative max-w-[85%] md:max-w-[75%] px-5 py-3.5 rounded-2xl text-[15px] leading-relaxed",
                            !isAi
                              ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-tr-sm"
                              : "bg-transparent -ml-2 text-zinc-900 dark:text-zinc-100 px-0 md:px-0 lg:px-0"
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
                  <div ref={messageBottomRef} className="h-4" />
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Input Area */}
        <div className="shrink-0 p-4 bg-white dark:bg-[#09090b]">
          <div className="max-w-3xl mx-auto">
            <div className="relative flex items-end w-full border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/50 focus-within:ring-1 focus-within:ring-zinc-300 dark:focus-within:ring-zinc-700 focus-within:bg-white dark:focus-within:bg-zinc-900 transition-all">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" &&
                  !e.shiftKey &&
                  (e.preventDefault(), handleSend())
                }
                placeholder="Message Taskora AI..."
                className="flex-1 min-h-[48px] max-h-40 py-3.5 px-4 border-none focus-visible:ring-0 text-zinc-900 dark:text-zinc-100 text-[15px] resize-none placeholder:text-zinc-400 bg-transparent"
                rows={1}
              />
              <div className="pb-2 pr-2">
                <Button
                  size="icon"
                  onClick={handleSend}
                  disabled={!input.trim() || isStreaming}
                  className={cn(
                    "h-8 w-8 rounded-lg transition-all duration-200",
                    input.trim()
                      ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200"
                      : "bg-transparent text-zinc-300 dark:text-zinc-700 cursor-not-allowed"
                  )}
                >
                  {isStreaming ? (
                    <Loader2 className="animate-spin h-4 w-4" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <p className="text-[10px] text-center text-zinc-400 mt-3">
              AI can make mistakes. Verify important info.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
