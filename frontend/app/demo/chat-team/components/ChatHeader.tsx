"use client";
import React, { useMemo } from "react";
import { Users as UsersIcon, SearchIcon, Bot } from "lucide-react";
import { Discussion, CurrentUser } from "../types/type";
import { useChatStore } from "../store/useChatStore";

export function ChatHeader({
  currentUser,
  selectedDiscussion,
  onManageMembers,
  onSearch,
}: {
  currentUser: CurrentUser;
  selectedDiscussion: Discussion;
  onManageMembers: () => void;
  onSearch: () => void;
}) {
  const { chatMode } = useChatStore();

  const headerData = useMemo(() => {
    if (chatMode === "ai") {
      return {
        isAi: true,
        name: selectedDiscussion.name || "AI Assistant",
        avatar: null,
        members: [],
      };
    }

    if (selectedDiscussion.isGroup) {
      return {
        isAi: false,
        name: selectedDiscussion.name || "Group Chat",
        avatar:
          selectedDiscussion.teamSnapshot?.avatar ||
          `https://placehold.co/100x100/7c3aed/ffffff?text=${(
            selectedDiscussion.name || "G"
          )
            .charAt(0)
            .toUpperCase()}`,
        members: selectedDiscussion.participants,
      };
    }

    const otherUser = selectedDiscussion.participants?.find(
      (p) => p.id !== currentUser.id
    );
    return {
      isAi: false,
      name: otherUser?.name || "Unknown User",
      avatar:
        otherUser?.avatar ||
        `https://i.pravatar.cc/150?u=${otherUser?.id || "unknown"}`,
      members: selectedDiscussion.participants,
    };
  }, [selectedDiscussion, currentUser.id, chatMode]);

  return (
    <header className="flex items-center justify-between p-4 border-b border-gray-200 bg-white shadow-sm flex-shrink-0">
      <div className="flex items-center min-w-0">
        {headerData.isAi ? (
          <div className="w-10 h-10 bg-indigo-600 p-2.5 rounded-full text-white flex-shrink-0 flex items-center justify-center mr-4">
            <Bot size={20} />
          </div>
        ) : (
          <img
            src={headerData.avatar as string}
            alt={headerData.name}
            className="w-10 h-10 rounded-full object-cover mr-4 flex-shrink-0"
            onError={(e) =>
              (e.currentTarget.src = `https://placehold.co/100x100/cccccc/ffffff?text=?`)
            }
          />
        )}
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-gray-800 truncate">
            {headerData.name}
          </h2>
          <p className="text-sm text-gray-500">
            {headerData.isAi
              ? "Trợ lý ảo"
              : selectedDiscussion.isGroup
              ? `${headerData.members?.length || 0} thành viên`
              : "Online"}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-center gap-2">
        {selectedDiscussion.isGroup && (
          <button
            onClick={onManageMembers}
            title="Quản lý thành viên"
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <UsersIcon className="w-6 h-6 text-gray-500" />
          </button>
        )}
        <button
          onClick={onSearch}
          title="Tìm kiếm tin nhắn"
          className="p-2 rounded-full flex items-center hover:bg-gray-100"
        >
          <SearchIcon className="w-6 h-6 text-gray-500" />
        </button>
      </div>
    </header>
  );
}
