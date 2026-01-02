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
import { AiMessage } from "@/types";

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
  const [activeId, setActiveId] = React.useState<string | undefined>(undefined);
  const [input, setInput] = React.useState("");
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

  const { discussions, isLoading: isLoadingList } = useAiDiscussion();

  const {
    messages,
    sendMessage,
    streamingContent,
    isStreaming,
    isLoadingMessages,
  } = useAiChat(activeId);

  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, streamingContent]);

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;
    const currentInput = input;
    setInput("");
    try {
      await sendMessage(currentInput);
    } catch (error) {
      console.error("Failed to send:", error);
    }
  };

  const createNewChat = () => {
    setActiveId(undefined);
    setInput("");
  };

  return (
    <div className="flex h-screen w-full bg-white dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 overflow-hidden">
      {/* --- SIDEBAR --- */}
      <aside
        className={cn(
          "flex flex-col dark:bg-[#0c0c0e] border-r border-zinc-200/40 dark:border-zinc-800 transition-all duration-300",
          isSidebarOpen ? "w-72" : "w-0 opacity-0 -translate-x-full"
        )}
      >
        <div className="p-4">
          <Button
            onClick={createNewChat}
            className="w-full justify-start gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm"
            variant="outline"
          >
            <Plus className="h-4 w-4" />
            <span className="text-sm font-medium">New Chat</span>
          </Button>
        </div>

        <ScrollArea className="flex-1 px-3">
          <div className="space-y-1">
            <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">
              Recent
            </p>
            {isLoadingList ? (
              <div className="p-4 text-center">
                <Loader2 className="h-4 w-4 animate-spin mx-auto" />
              </div>
            ) : (
              discussions.map((chat) => (
                <button
                  key={chat._id}
                  onClick={() => setActiveId(chat._id)}
                  className={cn(
                    "w-full group flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all",
                    activeId === chat._id
                      ? "bg-zinc-200/60 dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100"
                      : "text-zinc-500 hover:bg-zinc-200/40 dark:hover:bg-zinc-800/40"
                  )}
                >
                  <MessageSquare className="h-4 w-4 shrink-0" />
                  <span className="text-sm font-medium truncate flex-1">
                    {chat.name || "Untitled Conversation"}
                  </span>
                  <MoreVertical className="h-3 w-3 opacity-0 group-hover:opacity-100" />
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </aside>

      {/* --- MAIN CHAT AREA --- */}
      <main className="flex-1 flex flex-col relative min-w-0">
        <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800/50 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-zinc-500"
            >
              {isSidebarOpen ? <PanelLeftClose /> : <PanelLeftOpen />}
            </Button>
            <div className="flex items-center gap-2">
              <BrainCircuit className="h-5 w-5 text-indigo-500" />
              <h2 className="text-sm font-bold tracking-tight">Nexus AI</h2>
            </div>
          </div>
        </header>

        <ScrollArea className="flex-1">
          <div className="max-w-3xl mx-auto py-10 px-4">
            {messages.length === 0 && !streamingContent ? (
              <div className="flex flex-col items-center justify-center min-h-[50vh] text-center animate-in fade-in duration-700">
                <div className="mb-8 p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-full ring-1 ring-zinc-200 dark:ring-zinc-800">
                  <Sparkles className="h-10 w-10 text-indigo-500" />
                </div>
                <h1 className="text-3xl font-extrabold tracking-tight mb-3">
                  Welcome to Nexus
                </h1>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm max-w-[400px]">
                  How can I help you architecture your ideas today?
                </p>
              </div>
            ) : (
              <div className="space-y-12">
                {/* Lịch sử tin nhắn */}
                {messages.map((msg: AiMessage) => (
                  <div
                    key={msg._id}
                    className={cn(
                      "flex w-full gap-5 animate-in slide-in-from-bottom-3",
                      msg.sender._id !== "ai" ? "flex-row-reverse" : "flex-row" // Kiểm tra ID sender
                    )}
                  >
                    {msg.sender._id === "ai" && (
                      <Avatar className="h-9 w-9 shrink-0">
                        <AvatarFallback>NX</AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={cn(
                        "relative max-w-[85%] text-[15px] px-5 py-3 rounded-2xl",
                        msg.sender._id !== "ai"
                          ? "bg-zinc-900 text-zinc-100 rounded-tr-none"
                          : "text-zinc-700 dark:text-zinc-300"
                      )}
                    >
                      <MarkdownRenderer text={msg.content} />
                      {/* Hiển thị thời gian nếu cần */}
                      <span className="text-[10px] opacity-40 block mt-1">
                        {new Date(msg.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}

                {/* Tin nhắn đang Streaming */}
                {streamingContent && (
                  <div className="flex w-full gap-5 animate-in slide-in-from-bottom-3 flex-row">
                    <Avatar className="h-9 w-9 border border-zinc-200 dark:border-zinc-800 shrink-0">
                      <AvatarFallback className="bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[10px] font-black">
                        NX
                      </AvatarFallback>
                    </Avatar>
                    <div className="relative max-w-[85%] text-[15px] leading-relaxed text-zinc-700 dark:text-zinc-300">
                      <MarkdownRenderer text={streamingContent} />
                      <span className="inline-block w-1.5 h-4 ml-1 bg-indigo-500 animate-pulse align-middle" />
                    </div>
                  </div>
                )}

                {isStreaming && !streamingContent && (
                  <div className="flex gap-5 items-center">
                    <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
                    <span className="text-xs text-zinc-400 font-medium italic">
                      Nexus is thinking...
                    </span>
                  </div>
                )}
                <div ref={scrollRef} className="h-32" />
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Floating Input Area */}
        <div className="p-6 bg-gradient-to-t from-white dark:from-[#09090b] via-white dark:via-[#09090b] to-transparent">
          <div className="max-w-3xl mx-auto">
            <div className="relative flex items-end w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-2.5 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" &&
                  !e.shiftKey &&
                  (e.preventDefault(), handleSend())
                }
                placeholder="Ask Nexus anything..."
                className="flex-1 min-h-[48px] max-h-52 py-3 px-3 bg-transparent border-none focus-visible:ring-0 text-zinc-900 dark:text-zinc-100 text-[15px] resize-none"
                rows={1}
              />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      onClick={handleSend}
                      disabled={!input.trim() || isStreaming}
                      className="h-10 w-10 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-2xl shadow-lg shrink-0"
                    >
                      {isStreaming ? (
                        <Loader2 className="animate-spin h-4 w-4" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-zinc-900 text-white text-xs">
                    Send message
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="text-[10px] text-center text-zinc-400 mt-4 font-bold tracking-widest uppercase opacity-50">
              Nexus Architecture Intelligence
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
