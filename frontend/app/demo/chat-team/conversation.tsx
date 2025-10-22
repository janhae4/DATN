import { Loader2 } from "lucide-react";
import React, { useCallback, useEffect, useRef } from "react";
import { useChatStore } from "./useChatStore";

interface ConversationItemProps {
  conversation: Conversation;
  selected: boolean;
  onClick: () => void;
  currentUser: User;
}
const ConversationItem: React.FC<ConversationItemProps> = React.memo(
  ({ conversation, selected, onClick, currentUser }) => {
    console.log(conversation);
    const getDisplayData = () => {
      if (conversation.isGroupChat) {
        return {
          name: conversation.name || "Group Chat",
          avatar:
            conversation.avatar ||
            `https://placehold.co/100x100/7c3aed/ffffff?text=${(
              conversation.name || "G"
            )
              .charAt(0)
              .toUpperCase()}`,
        };
      }
      const otherUser = conversation.participants?.find(
        (p) => p._id !== currentUser.id
      );
      return {
        name: otherUser?.name || "Unknown User",
        avatar:
          otherUser?.avatar ||
          `https://i.pravatar.cc/150?u=${otherUser?._id || "unknown"}`,
      };
    };
    const display = getDisplayData();
    const latestMessageContent =
      conversation.latestMessage?.content || "Chưa có tin nhắn";
    const timestamp = conversation.latestMessage
      ? new Date(conversation.latestMessage.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";

    return (
      <div
        onClick={onClick}
        className={`flex items-center p-3 cursor-pointer rounded-lg transition-colors duration-200 ${
          selected ? "bg-indigo-100" : "hover:bg-gray-100"
        }`}
      >
        <img
          src={display.avatar}
          alt={display.name}
          className="w-12 h-12 rounded-full object-cover mr-4"
          onError={(e) =>
            (e.currentTarget.src = `https://placehold.co/100x100/cccccc/ffffff?text=?`)
          }
        />
        <div className="flex-1 overflow-hidden">
          <div className="flex justify-between items-center">
            <p className="font-semibold text-gray-800 truncate">
              {display.name}
            </p>
            <p className="text-xs text-gray-500">{timestamp}</p>
          </div>
          <p className="text-sm text-gray-600 truncate">
            {latestMessageContent}
          </p>
        </div>
      </div>
    );
  }
);
ConversationItem.displayName = "ConversationItem";

// --- Conversation List ---
interface ConversationListProps {
  currentUser: User;
  onSelectConversation: (conversation: Conversation) => void;
}
export const ConversationList: React.FC<ConversationListProps> = ({
  currentUser,
  onSelectConversation,
}) => {
  // ... (Giữ nguyên)
  const {
    visibleConversations,
    selectedConversation,
    isLoadingConversations,
    loadInitialConversations,
    loadMoreConversations,
    currentPage,
    totalPages,
  } = useChatStore();

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
    const currentList = listRef.current; // Lưu lại list root // Guard: Nếu hết trang hoặc trigger chưa render, dọn dẹp và thoát

    if (!hasMore || !currentTrigger) {
      if (observerRef.current) observerRef.current.disconnect();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        // Lấy state MỚI NHẤT trực tiếp từ store
        // vì state `isLoadingConversations` từ closure có thể đã cũ
        const freshState = useChatStore.getState();

        if (entries[0].isIntersecting && !freshState.isLoadingConversations) {
          console.log("Intersection observer triggered load more...");
          loadMoreConversations();
        }
      },
      {
        root: currentList, // Dùng biến đã lưu
        threshold: 0.8,
      }
    );

    observer.observe(currentTrigger);
    observerRef.current = observer;

    return () => {
      // Dọn dẹp: ngắt observe và ngắt kết nối
      if (currentTrigger) {
        observer.unobserve(currentTrigger);
      }
      observer.disconnect(); // Ngắt kết nối observer cũ khi effect chạy lại
    };
  }, [hasMore, loadMoreConversations]); // <-- BỎ `isLoadingConversations`
  
  const handleSelect = useCallback(
    (conv: Conversation) => {
      onSelectConversation(conv);
    },
    [onSelectConversation]
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

      {/* Phần tử trigger */}
      {/* Chỉ render trigger nếu có thể load thêm và không đang load */}
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
