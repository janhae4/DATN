import { useCallback, useEffect, useRef } from "react";
import { useChatStore } from "../store/useChatStore";
import { Loader2 } from "lucide-react";
import { ConversationItem } from "./ConversationItem";
import { Conversation, CurrentUser } from "../types/type";
import { useSocket } from "@/app/SocketContext";
import { useSocketHandler } from "../hooks/useSocketHandler";

interface ConversationListProps {
  currentUser: CurrentUser;
  onSelectConversation: (conversation: Conversation) => void;
}
export const ConversationList: React.FC<ConversationListProps> = ({
  currentUser,
  onSelectConversation,
}) => {
  const {
    visibleConversations,
    selectedConversation,
    isLoadingConversations,
    loadInitialConversations,
    loadMoreConversations,
    currentPage,
    totalPages,
  } = useChatStore();

  const { socket } = useSocket();
  const listRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingTriggerRef = useRef<HTMLDivElement>(null);

  const hasMore = currentPage < totalPages;

  useEffect(() => {
    if (visibleConversations.length === 0) {
      loadInitialConversations();
    }
  }, []);

  useEffect(() => {
    const currentTrigger = loadingTriggerRef.current;
    const currentList = listRef.current;

    if (!hasMore || !currentTrigger) {
      if (observerRef.current) observerRef.current.disconnect();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const freshState = useChatStore.getState();

        if (entries[0].isIntersecting && !freshState.isLoadingConversations) {
          console.log("Intersection observer triggered load more...");
          loadMoreConversations();
        }
      },
      {
        root: currentList,
        threshold: 0.8,
      }
    );

    observer.observe(currentTrigger);
    observerRef.current = observer;

    return () => {
      if (currentTrigger) {
        observer.unobserve(currentTrigger);
      }
      observer.disconnect();
    };
  }, [hasMore, loadMoreConversations]);

  const handleSelect = useCallback(
    (conv: Conversation) => {
      console.log(conv._id);
      socket?.emit(
        "join_room",
        {roomId: conv._id},
        (response: { status: string; roomId: string }) => {
          if (response.status === "ok") {
            console.log(`ĐÃ THAM GIA PHÒNG THÀNH CÔNG: ${response.roomId}`);
          } else {
            console.error(`Không thể tham gia phòng: ${response.status}`);
          }
        }
      );
      onSelectConversation(conv);
    },
    [onSelectConversation, socket]
  );

  return (
    <div ref={listRef} className="overflow-y-auto h-full px-2 space-y-1">
      {visibleConversations.map((conv) => (
        <ConversationItem
          key={conv._id}
          conversation={conv}
          selected={selectedConversation?._id === conv._id}
          onClick={() => handleSelect(conv)}
          currentUser={currentUser}
        />
      ))}

      {hasMore && (
        <div
          ref={loadingTriggerRef}
          style={{ height: "50px", marginTop: "10px" }}
        />
      )}

      {/* Loading indicator */}
      {isLoadingConversations && (
        <div className="flex justify-center items-center py-4">
          <Loader2 className="animate-spin h-6 w-6 text-indigo-600" />
        </div>
      )}

      {!hasMore && visibleConversations.length > 0 && (
        <p className="text-center text-sm text-gray-500 py-3">Hết rồi 😅</p>
      )}
      {!isLoadingConversations && visibleConversations.length === 0 && (
        <p className="text-center text-sm text-gray-500 py-3">
          Không có cuộc trò chuyện nào.
        </p>
      )}
    </div>
  );
};
