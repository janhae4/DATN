"use client";

import * as React from "react";
import {
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useAiDiscussion } from "@/hooks/useAiDiscussion";
import { useAiChat } from "@/hooks/useAiChat";
import { useQueryClient } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";

import { Button } from "@/components/ui/button";
import { Sidebar } from "./sidebar";
import { MessageList } from "./message-list";
import { ChatInput } from "./chat-input";

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

  // Handle auto-fetching discussions
  React.useEffect(() => {
    if (isSidebarBottomInView && hasNextPageDiscussions) {
      fetchNextPageDiscussions();
    }
  }, [isSidebarBottomInView, hasNextPageDiscussions, fetchNextPageDiscussions]);

  // Handle auto-fetching messages
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

  // Handle scroll position after fetching older messages
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

  // Handle auto-scroll to bottom
  React.useEffect(() => {
    const anchor = messageBottomRef.current;
    const viewport = messageViewportRef.current;

    if (!anchor || !viewport) return;

    const distanceFromBottom =
      viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
    const isAtBottom = distanceFromBottom < 150;

    if (isStreaming || streamingContent || isAtBottom) {
      anchor.scrollIntoView({
        behavior: isStreaming || streamingContent ? "smooth" : "auto",
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
                queryClient.invalidateQueries({
                  queryKey: ["ai-discussions"],
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
    setStreamingContent("");
  };

  return (
    <div className="flex w-full h-[85vh] md:h-[90vh] border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 overflow-hidden relative font-sans">
      <Sidebar
        isOpen={isSidebarOpen}
        discussions={discussions}
        activeId={activeId}
        isLoading={isLoadingList}
        isFetchingNextPage={isFetchingNextPageDiscussions}
        bottomRef={sidebarBottomRef}
        onNewChat={createNewChat}
        onSelectChat={(id) => {
          setStreamingContent("");
          setActiveId(id);
        }}
        onDeleteChat={deleteDiscussion}
      />

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
            </div>
          </div>
        </header>

        <MessageList
          messages={messages}
          streamingContent={streamingContent}
          isStreaming={isStreaming}
          isFetchingNextPage={isFetchingNextPageMessages}
          activeId={activeId}
          viewportRef={messageViewportRef}
          topRef={messageTopRef}
          bottomRef={messageBottomRef}
        />

        <ChatInput
          input={input}
          setInput={setInput}
          onSend={handleSend}
          isStreaming={isStreaming}
        />
      </main>
    </div>
  );
}