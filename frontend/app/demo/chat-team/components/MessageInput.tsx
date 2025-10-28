"use client";
import React from "react";
import { Send as SendIcon } from "lucide-react";
import { useMessageSender } from "../hooks/useMessageSender";

export function MessageInput({
  currentUser,
  selectedConversation,
}: {
  currentUser: User;
  selectedConversation: Conversation;
}) {
  const { newMessage, setNewMessage, handleSendMessage } = useMessageSender(
    selectedConversation,
    currentUser
  );

  return (
    <footer className="p-4 border-t border-gray-200 bg-white flex-shrink-0">
      <form onSubmit={handleSendMessage} className="flex items-center gap-4">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Nhập tin nhắn..."
          className="flex-1 bg-gray-100 border border-gray-300 rounded-lg py-2 px-4 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage(e);
            }
          }}
        />
        <button
          type="submit"
          className="bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-indigo-300 disabled:cursor-not-allowed"
          disabled={!newMessage.trim()}
        >
          <SendIcon className="w-6 h-6" />
        </button>
      </form>
    </footer>
  );
}
