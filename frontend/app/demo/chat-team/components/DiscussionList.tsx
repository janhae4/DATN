import { use, useCallback, useEffect, useRef } from "react";
import { useChatStore } from "../store/useChatStore";
import { Loader2 } from "lucide-react";
import { DiscussionItem } from "./DiscussionItem";
import { Discussion, CurrentUser } from "../types/type";
import { useSocket } from "@/app/SocketContext";

interface DiscussionListProps {
  currentUser: CurrentUser;
  onSelectDiscussion: (discussion: Discussion) => void;
}
export const DiscussionList: React.FC<DiscussionListProps> = ({
  currentUser,
  onSelectDiscussion,
}) => {
  const {
    visibleDiscussions,
    selectedDiscussion,
    isLoadingDiscussions,
    loadInitialDiscussions,
    loadMoreDiscussions,
    currentPage,
    totalPages,
    chatMode
  } = useChatStore();

  useEffect(() => {console.log(visibleDiscussions)}, [visibleDiscussions]);

  const { socket } = useSocket();
  const listRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingTriggerRef = useRef<HTMLDivElement>(null);

  const hasMore = currentPage < totalPages;

  useEffect(() => {
    if (visibleDiscussions.length === 0) {
      loadInitialDiscussions(chatMode);
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

        if (entries[0].isIntersecting && !freshState.isLoadingDiscussions) {
          console.log("Intersection observer triggered load more...");
          loadMoreDiscussions(chatMode)
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
  }, [hasMore, loadMoreDiscussions]);

  const handleSelect = useCallback(
    (disc: Discussion) => {
      console.log(disc._id);
      socket?.emit(
        "join_room",
        { roomId: disc._id },
        (response: { status: string; roomId: string }) => {
          if (response.status === "ok") {
            console.log(`ĐÃ THAM GIA PHÒNG THÀNH CÔNG: ${response.roomId}`);
          } else {
            console.error(`Không thể tham gia phòng: ${response.status}`);
          }
        }
      );
      console.log(disc)
      onSelectDiscussion(disc);
    },
    [onSelectDiscussion, socket]
  );

  return (
    <div ref={listRef} className="overflow-y-auto h-full px-2 space-y-1">
      {visibleDiscussions.map((disc) => (
        <DiscussionItem
          key={disc._id}
          discussion={disc}
          selected={selectedDiscussion?._id === disc._id}
          onClick={() => handleSelect(disc)}
          currentUser={currentUser}
        />
      ))}

      {hasMore && (
        <div
          ref={loadingTriggerRef}
          style={{ height: "50px", marginTop: "10px" }}
        />
      )}

      {isLoadingDiscussions && (
        <div className="flex justify-center items-center py-4">
          <Loader2 className="animate-spin h-6 w-6 text-indigo-600" />
        </div>
      )}

      {!hasMore && visibleDiscussions.length > 0 && (
        <p className="text-center text-sm text-gray-500 py-3">Hết rồi 😅</p>
      )}
      {!isLoadingDiscussions && visibleDiscussions.length === 0 && (
        <p className="text-center text-sm text-gray-500 py-3">
          Không có cuộc thảo luận nào.
        </p>
      )}
    </div>
  );
};
