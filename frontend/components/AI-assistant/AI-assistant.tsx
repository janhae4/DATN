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
  MoreVertical,
  Trash2,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import { PrismAsyncLight as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { cn } from "@/lib/utils";

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
import { AiDiscussion, AiMessage } from "@/types";
import { useQueryClient } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";

const MarkdownRenderer = ({ text }: { text: string }) => (
  <ReactMarkdown
    rehypePlugins={[rehypeRaw]}
    components={{
      code: ({ node, inline, className, children, ...props }: any) => {
        const match = /language-(\w+)/.exec(className || "");
        return !inline ? (
          <div className="rounded-xl overflow-hidden my-4 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <SyntaxHighlighter
              style={vscDarkPlus as any}
              language={match ? match[1] : "text"}
              PreTag="div"
              customStyle={{
                margin: 0,
                padding: "1.25rem",
                fontSize: "13px",
                backgroundColor: "transparent",
              }}
              className="bg-zinc-900 dark:bg-black"
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
        <p className="leading-7 mb-4 last:mb-0">{children}</p>
      ),
      ul: ({ children }) => (
        <ul className="list-disc pl-5 space-y-2 mb-4">{children}</ul>
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
    const isAtBottom = distanceFromBottom < 100;

    if (isStreaming || streamingContent || isAtBottom) {
      anchor.scrollIntoView({
        behavior: isStreaming || streamingContent ? "auto" : "smooth",
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

          setTimeout(() => {
            messageBottomRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "end",
            });
          }, 10);

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
                  localNewId = parsed.metadata.discussionId;

                  queryClient.invalidateQueries({
                    queryKey: ["ai-discussions"],
                  });
                });
              }
              if (parsed.text) {
                fullText += parsed.text;
                setStreamingContent(fullText);
              }
            } catch (e) {}
          });

          if (!sendingDiscussionId && localNewId) {
            setActiveId(localNewId);
          }

          setTimeout(() => {
            messageBottomRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "end",
            });
          }, 10);
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
    <div className="flex w-full h-[90vh] border border-zinc-200 rounded-xl bg-white dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 overflow-hidden shadow-xl">
      {/* --- SIDEBAR --- */}
      <aside
        className={cn(
          "flex flex-col h-full bg-zinc-50/50 dark:bg-[#0c0c0e] border-r border-zinc-200/40 dark:border-zinc-800 transition-all duration-300 shrink-0",
          isSidebarOpen ? "w-72" : "w-0 opacity-0 overflow-hidden"
        )}
      >
        {/* Header Sidebar cố định */}
        <div className="p-4 shrink-0 z-10">
          <Button
            onClick={createNewChat}
            className="w-full justify-start gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            variant="outline"
          >
            <Plus className="h-4 w-4 text-indigo-500" />
            <span className="text-sm font-medium">New Chat</span>
          </Button>
        </div>

        <ScrollArea className="flex-1 overflow-y-scroll">
          <div className="px-3 pb-4">
            <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">
              Recent
            </p>
            {isLoadingList ? (
              <div className="p-4 text-center">
                <Loader2 className="h-4 w-4 animate-spin mx-auto text-zinc-400" />
              </div>
            ) : (
              discussions.map((chat) => (
                <button
                  key={chat._id}
                  onClick={() => {
                    setStreamingContent("");
                    setActiveId(chat._id);
                  }}
                  className={cn(
                    "w-full group flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all mb-1",
                    activeId === chat._id
                      ? "bg-zinc-200/60 dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100 font-medium"
                      : "text-zinc-500 hover:bg-zinc-200/40 dark:hover:bg-zinc-800/40"
                  )}
                >
                  <MessageSquare className="h-4 w-4 shrink-0 opacity-70" />
                  <span className="text-sm truncate flex-1">
                    {chat.name || "Untitled Conversation"}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteDiscussion(chat._id);
                    }}
                    className="opacity-0 group-hover:opacity-100 bg-zinc-100/50 rounded-full cursor-pointer"
                  >
                    <Trash2 className="h-3 w-3 opacity-0 group-hover:opacity-100 text-zinc-400 rounded-full" />
                  </Button>
                </button>
              ))
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
      </aside>

      <main className="flex-1 flex flex-col h-full min-w-0 bg-white dark:bg-[#09090b]">
        <header className="flex items-center justify-between px-6 h-14 border-b border-zinc-200 dark:border-zinc-800/50 shrink-0">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              {isSidebarOpen ? (
                <PanelLeftClose className="h-5 w-5" />
              ) : (
                <PanelLeftOpen className="h-5 w-5" />
              )}
            </Button>
            <div className="flex items-center gap-2">
              <BrainCircuit className="h-5 w-5 text-indigo-500" />
              <h2 className="text-sm font-bold tracking-tight">Nexus AI</h2>
            </div>
          </div>
        </header>

        <div
          ref={messageViewportRef}
          className="flex-1 overflow-y-auto custom-scrollbar min-h-0"
        >
          <div className="max-w-3xl mx-auto py-8 px-4 md:px-6">
            {activeId && (
              <div
                ref={messageTopRef}
                className="h-4 w-full flex justify-center items-center mb-2"
              >
                {isFetchingNextPageMessages && (
                  <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
                )}
              </div>
            )}
            {messages.length === 0 && !streamingContent ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[50vh] text-center animate-in fade-in duration-700">
                <div className="mb-6 p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-full ring-1 ring-zinc-200 dark:ring-zinc-800">
                  <Sparkles className="h-8 w-8 text-indigo-500" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight mb-2">
                  Welcome to Nexus
                </h1>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm max-w-[350px]">
                  Ready to architect your next big idea? Start typing below.
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                {messages.map((msg: AiMessage) => (
                  <div
                    key={msg._id}
                    className={cn(
                      "flex w-full gap-4 md:gap-6 animate-in slide-in-from-bottom-2",
                      msg.sender._id !== "AI_ID"
                        ? "flex-row-reverse"
                        : "flex-row"
                    )}
                  >
                    <Avatar
                      className={cn(
                        "h-8 w-8 shrink-0 border border-zinc-200 dark:border-zinc-800",
                        msg.sender._id !== "AI_ID" && "hidden md:flex"
                      )}
                    >
                      {msg.sender._id === "AI_ID" ? (
                        <AvatarFallback className="bg-zinc-100 dark:bg-zinc-800 text-indigo-600 font-bold text-[10px]">
                          NX
                        </AvatarFallback>
                      ) : (
                        <AvatarFallback>ME</AvatarFallback>
                      )}
                    </Avatar>

                    <div
                      className={cn(
                        "relative max-w-[85%] md:max-w-[80%] text-[15px] px-5 py-3.5 rounded-2xl shadow-sm border",
                        msg.sender._id !== "AI_ID"
                          ? "bg-zinc-900 border-zinc-800 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 rounded-tr-none"
                          : "bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-tl-none"
                      )}
                    >
                      <MarkdownRenderer text={msg.content} />
                      <span className="text-[10px] opacity-40 block mt-2 text-right tabular-nums">
                        {new Intl.DateTimeFormat("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        }).format(new Date(msg.timestamp))}
                      </span>
                    </div>
                  </div>
                ))}

                {/* Streaming Content */}
                {streamingContent && (
                  <div className="flex w-full gap-4 md:gap-6 flex-row animate-in fade-in">
                    <Avatar className="h-8 w-8 shrink-0 border border-zinc-200 dark:border-zinc-800">
                      <AvatarFallback className="bg-zinc-100 dark:bg-zinc-800 text-indigo-600 font-bold text-[10px]">
                        NX
                      </AvatarFallback>
                    </Avatar>
                    <div className="relative max-w-[85%] md:max-w-[80%] text-[15px] leading-relaxed text-zinc-700 dark:text-zinc-300 pt-1">
                      <MarkdownRenderer text={streamingContent} />
                      <span className="inline-block w-1.5 h-4 ml-1 bg-indigo-500 animate-pulse align-middle" />
                    </div>
                  </div>
                )}

                {isStreaming && !streamingContent && (
                  <div className="flex gap-3 items-center ml-12 md:ml-14">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-400" />
                    <span className="text-xs text-zinc-400 font-medium">
                      Nexus is thinking...
                    </span>
                  </div>
                )}
                <div ref={messageBottomRef} className="h-1" />
              </div>
            )}
          </div>
        </div>

        {/* Input Area cố định dưới đáy (shrink-0) */}
        <div className="shrink-0 p-4 bg-white dark:bg-[#09090b] border-t border-zinc-100 dark:border-zinc-800">
          <div className="max-w-3xl mx-auto">
            <div className="relative flex items-end w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-2 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500/30 transition-all">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" &&
                  !e.shiftKey &&
                  (e.preventDefault(), handleSend())
                }
                placeholder="Ask Nexus anything..."
                className="flex-1 min-h-[44px] max-h-40 py-3 px-4 bg-transparent border-none focus-visible:ring-0 text-zinc-900 dark:text-zinc-100 text-[15px] resize-none"
                rows={1}
              />
              <div className="pb-1 pr-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        onClick={handleSend}
                        disabled={!input.trim() || isStreaming}
                        className={cn(
                          "h-9 w-9 rounded-full shadow-md transition-all active:scale-95",
                          input.trim()
                            ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                            : "bg-zinc-200 dark:bg-zinc-800 text-zinc-400"
                        )}
                      >
                        {isStreaming ? (
                          <Loader2 className="animate-spin h-4 w-4" />
                        ) : (
                          <Send className="h-4 w-4 ml-0.5" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="bg-zinc-900 text-white text-xs">
                      Send message
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
            <p className="text-[10px] text-center text-zinc-400 mt-3 font-medium tracking-wide opacity-60">
              Nexus AI can make mistakes. Consider checking important
              information.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
