"use client";
import React, { useMemo } from "react";
import { Users as UsersIcon, SearchIcon } from "lucide-react";

export function ChatHeader({
  currentUser,
  selectedConversation,
  onManageMembers,
  onSearch,
}: {
  currentUser: User;
  selectedConversation: Conversation;
  onManageMembers: () => void;
  onSearch: () => void;
}) {
  // Logic tính toán headerData được đưa vào đây
  const headerData = useMemo(() => {
    if (selectedConversation.isGroupChat) {
      return {
        name: selectedConversation.name || "Group Chat",
        avatar:
          selectedConversation.avatar ||
          `https://placehold.co/100x100/7c3aed/ffffff?text=${(
            selectedConversation.name || "G"
          )
            .charAt(0)
            .toUpperCase()}`,
        members: selectedConversation.participants,
      };
    }
    const otherUser = selectedConversation.participants?.find(
      (p) => p._id !== currentUser.id
    );
    return {
      name: otherUser?.name || "Unknown",
      avatar:
        otherUser?.avatar ||
        `https://i.pravatar.cc/150?u=${otherUser?._id || "unknown"}`,
      members: selectedConversation.participants,
    };
  }, [selectedConversation, currentUser.id]);

  return (
    <header className="flex items-center justify-between p-4 border-b border-gray-200 bg-white shadow-sm flex-shrink-0">
      <div className="flex items-center min-w-0">
        <img
          src={headerData.avatar}
          alt={headerData.name}
          className="w-10 h-10 rounded-full object-cover mr-4 flex-shrink-0"
          onError={(e) =>
            (e.currentTarget.src = `https://placehold.co/100x100/cccccc/ffffff?text=?`)
          }
        />
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-gray-800 truncate">
            {headerData.name}
          </h2>
          <p className="text-sm text-gray-500">
            {selectedConversation.isGroupChat
              ? `${headerData.members?.length || 0} thành viên`
              : "Online"}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-center gap-2">
        {selectedConversation.isGroupChat && (
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
