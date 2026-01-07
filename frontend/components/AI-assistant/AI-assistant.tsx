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
    <div className="flex w-full h-[85vh] md:h-[90vh] border border-zinc-200/60 dark:border-zinc-800 rounded-2xl bg-zinc-50/50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 overflow-hidden shadow-2xl relative backdrop-blur-sm">
      {/* --- SIDEBAR --- */}
      <AnimatePresence mode="wait">
        {isSidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 300, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="flex flex-col h-full bg-white/80 dark:bg-[#0c0c0e]/90 border-r border-zinc-200/60 dark:border-zinc-800 truncate backdrop-blur-md z-20"
          >
            {/* Sidebar Header */}
            <div className="p-4 shrink-0">
              <Button
                onClick={createNewChat}
                className="w-full justify-start gap-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all border-none h-11"
              >
                <Plus className="h-5 w-5" />
                <span className="font-semibold">New Chat</span>
              </Button>
            </div>

            <ScrollArea className="flex-1 px-3">
              <div className="pb-4 space-y-1">
                <p className="px-3 py-2 text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                  Recent Conversations
                </p>
                {isLoadingList ? (
                  <div className="p-4 text-center">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto text-indigo-500" />
                  </div>
                ) : (
                  <div className="space-y-1">
                    {discussions.map((chat) => (
                      <motion.div
                        layout
                        initial={{ opacity: 0, x: -20 }}
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
                            "w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all duration-200 border",
                            activeId === chat._id
                              ? "bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-900/50 text-indigo-900 dark:text-indigo-100 shadow-sm"
                              : "border-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                          )}
                        >
                          <MessageSquare className={cn("h-4 w-4 shrink-0", activeId === chat._id ? "text-indigo-500" : "opacity-50")} />
                          <span className="text-sm truncate font-medium flex-1">
                            {chat.name || "Untitled Conversation"}
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
                            className="h-7 w-7 rounded-lg hover:bg-red-100 hover:text-red-500 dark:hover:bg-red-900/30 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
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
                    <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
                  )}
                </div>
              </div>
            </ScrollArea>
          </motion.aside>
        )}
      </AnimatePresence>

      <main className="flex-1 flex flex-col h-full min-w-0 bg-white/50 dark:bg-[#09090b]/50 backdrop-blur-sm relative z-10 w-full">
        <header className="flex items-center justify-between px-6 h-16 border-b border-zinc-200/60 dark:border-zinc-800/60 shrink-0 bg-white/70 dark:bg-[#09090b]/70 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              {isSidebarOpen ? (
                <PanelLeftClose className="h-5 w-5" />
              ) : (
                <PanelLeftOpen className="h-5 w-5" />
              )}
            </Button>
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-sm">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-sm font-bold tracking-tight text-zinc-800 dark:text-zinc-100 leading-none">Taskora AI AI</h2>
                <span className="text-[10px] text-zinc-400 font-medium">Personal Assistant</span>
              </div>
            </div>
          </div>
        </header>

        <div
          ref={messageViewportRef}
          className="flex-1 overflow-y-auto custom-scrollbar md:px-4"
        >
          <div className="max-w-3xl mx-auto py-8 px-4">
            {activeId && (
              <div
                ref={messageTopRef}
                className="h-8 w-full flex justify-center items-center"
              >
                {isFetchingNextPageMessages && (
                  <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
                )}
              </div>
            )}

            <AnimatePresence mode="popLayout">
              {messages.length === 0 && !streamingContent ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="flex flex-col items-center justify-center min-h-[50vh] text-center"
                >
                  <div className="relative mb-8 group cursor-default">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full blur-2xl opacity-20 group-hover:opacity-30 transition-opacity duration-500" />
                    <div className="relative p-6 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl ring-1 ring-zinc-200 dark:ring-zinc-800">
                      <Sparkles className="h-10 w-10 text-indigo-500" />
                    </div>
                  </div>
                  <h1 className="text-3xl font-bold tracking-tight mb-3 bg-clip-text text-transparent bg-gradient-to-r from-zinc-900 to-zinc-600 dark:from-white dark:to-zinc-400">
                    Welcome to Taskora AI
                  </h1>
                  <p className="text-zinc-500 dark:text-zinc-400 text-base max-w-[400px]">
                    Your intelligent copilot for brainstorming, coding, and creativity.
                  </p>
                </motion.div>
              ) : (

                <div className="space-y-8 pb-4">
                  {messages.map((msg: AiMessage, index) => {
                    const isAi = msg.sender._id === "AI_ID";
                    return (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        key={msg._id}
                        className={cn(
                          "flex w-full gap-4 md:gap-5",
                          !isAi ? "flex-row-reverse" : "flex-row"
                        )}
                      >
                        <Avatar
                          className={cn(
                            "h-9 w-9 shrink-0 shadow-sm ring-1 ring-zinc-100 dark:ring-zinc-800",
                            !isAi && "hidden md:flex"
                          )}
                        >
                          {isAi ? (
                            <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                              <Bot className="h-5 w-5" />
                            </AvatarFallback>
                          ) : (
                            <AvatarFallback className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                              <User className="h-5 w-5" />
                            </AvatarFallback>
                          )}
                        </Avatar>

                        <div
                          className={cn(
                            "relative max-w-[85%] md:max-w-[75%] px-6 py-4 rounded-2xl shadow-sm text-sm md:text-[15px] leading-7",
                            !isAi
                              ? "bg-gradient-to-br from-indigo-600 to-purple-700 text-white rounded-tr-none shadow-indigo-500/10"
                              : "bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-tl-none shadow-sm"
                          )}
                        >
                          <div className={cn("prose dark:prose-invert max-w-none break-words", !isAi ? "prose-invert" : "")}>
                            <MarkdownRenderer text={msg.content} />
                          </div>
                          <span className={cn(
                            "text-[10px] block mt-2 text-right opacity-60 font-medium tabular-nums",
                            !isAi ? "text-indigo-100" : "text-zinc-400"
                          )}>
                            {new Intl.DateTimeFormat("vi-VN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            }).format(new Date(msg.timestamp))}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}

                  {/* Streaming Content */}
                  {streamingContent && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex w-full gap-4 md:gap-5 flex-row"
                    >
                      <Avatar className="h-9 w-9 shrink-0 shadow-sm">
                        <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                          <Bot className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="relative max-w-[85%] md:max-w-[75%] px-6 py-4 rounded-2xl rounded-tl-none shadow-sm bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 text-[15px] leading-7">
                        <MarkdownRenderer text={streamingContent} />
                        <span className="inline-block w-2 h-4 ml-1 bg-indigo-500 animate-pulse align-middle rounded-sm" />
                      </div>
                    </motion.div>
                  )}

                  {isStreaming && !streamingContent && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex gap-3 items-center ml-14"
                    >
                      <div className="flex gap-1">
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ repeat: Infinity, duration: 1 }}
                          className="w-2 h-2 bg-zinc-400 rounded-full"
                        />
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                          className="w-2 h-2 bg-zinc-400 rounded-full"
                        />
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
                          className="w-2 h-2 bg-zinc-400 rounded-full"
                        />
                      </div>
                      <span className="text-xs text-zinc-400 font-medium">Thinking...</span>
                    </motion.div>
                  )}
                  <div ref={messageBottomRef} className="h-4" />
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Input Area */}
        <div className="shrink-0 p-4 md:p-6 bg-transparent sticky bottom-0 z-20 pointer-events-none">
          <div className="max-w-3xl mx-auto pointer-events-auto">
            <motion.div
              layoutId="input-area"
              className="relative flex items-end w-full border border-zinc-200/80 dark:border-zinc-800 rounded-3xl p-2 shadow-xl ring-1 ring-zinc-900/5 dark:ring-zinc-100/5 transition-all hover:shadow-2xl focus-within:ring-2 focus-within:ring-indigo-500/30 focus-within:border-indigo-500/50"
            >
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" &&
                  !e.shiftKey &&
                  (e.preventDefault(), handleSend())
                }
                placeholder="Ask Taskora AI anything..."
                className="flex-1 min-h-[50px] max-h-40 py-3.5 px-4 border-none focus-visible:ring-0 text-zinc-900 dark:text-zinc-100 text-[15px] resize-none placeholder:text-zinc-400"
                rows={1}
              />
              <div className="pb-1.5 pr-1.5">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        onClick={handleSend}
                        disabled={!input.trim() || isStreaming}
                        className={cn(
                          "h-10 w-10 rounded-full shadow-lg transition-all duration-200 active:scale-95",
                          input.trim()
                            ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white hover:scale-105"
                            : "bg-zinc-200 dark:bg-zinc-800 text-zinc-400"
                        )}
                      >
                        {isStreaming ? (
                          <Loader2 className="animate-spin h-5 w-5" />
                        ) : (
                          <Send className="h-5 w-5 ml-0.5" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="bg-zinc-900 text-white text-xs">
                      Send message
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </motion.div>
            <p className="text-[10px] text-center text-zinc-400/80 mt-3 font-medium tracking-wide">
              Taskora AI AI can make mistakes. Please verify important information.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
