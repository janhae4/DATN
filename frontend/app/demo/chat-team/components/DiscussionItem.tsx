import React from "react";
import { Discussion, CurrentUser } from "../types/type";
import { useChatStore } from "../store/useChatStore";

interface DiscussionItemProps {
  discussion: Discussion;
  selected: boolean;
  onClick: () => void;
  currentUser: CurrentUser;
}
export const DiscussionItem: React.FC<DiscussionItemProps> = React.memo(
  ({ discussion, selected, onClick, currentUser }) => {
    const { chatMode } = useChatStore();
    const getDisplayData = () => {
      if (chatMode === 'ai' || discussion.isGroup) {
        return {
          name: discussion.name || "Group Chat",
          avatar:
            discussion.teamSnapshot?.avatar ||
            `https://placehold.co/100x100/7c3aed/ffffff?text=${(
              discussion.name || "G"
            )
              .charAt(0)
              .toUpperCase()}`,
        };
      }
      const otherUser = discussion.participants?.find(
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
      discussion.latestMessageSnapshot?.content || "Chưa có tin nhắn";
    const timestamp = discussion.latestMessageSnapshot?.createdAt
      ? new Date(
          discussion.latestMessageSnapshot?.createdAt
        ).toLocaleTimeString([], {
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
