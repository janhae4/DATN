"use client";
import React from "react";
import { Loader2, XIcon } from "lucide-react";
import { useChatSearch } from "../hooks/useChatSearch";

export function SearchPanel({
  conversationId,
  onClose,
}: {
  conversationId: string;
  onClose: () => void;
}) {
  const {
    searchQuery,
    setSearchQuery,
    isApiSearching,
    searchApiResults,
    searchHasMore,
    totalSearchHits,
    handleLoadMoreSearch,
  } = useChatSearch(conversationId, true);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Thanh Input Tìm Kiếm */}
      <div className="p-2 bg-white border-b border-gray-200 flex items-center gap-2 flex-shrink-0 sticky top-0 z-10">
        <input
          type="text"
          placeholder="Tìm kiếm trong cuộc trò chuyện này..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") onClose();
          }}
          className="flex-1 bg-gray-100 border border-gray-300 rounded-lg py-1 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          autoFocus
        />
        <span className="text-sm text-gray-500 w-24 text-center">
          {isApiSearching && searchApiResults.length === 0
            ? "..."
            : totalSearchHits > 0
            ? `${totalSearchHits} kết quả`
            : searchQuery
            ? "0 kết quả"
            : ""}
        </span>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-gray-200"
          title="Đóng tìm kiếm (Esc)"
        >
          <XIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Khu vực kết quả */}
      <div className="flex-1 p-6 overflow-y-auto">
        {isApiSearching && searchApiResults.length === 0 && (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="animate-spin h-6 w-6 text-indigo-600" />
          </div>
        )}
        {searchApiResults.length === 0 && !isApiSearching && (
          <div className="flex justify-center items-center h-full">
            <p className="text-gray-500">
              {searchQuery
                ? "Không tìm thấy kết quả nào."
                : "Nhập để tìm kiếm."}
            </p>
          </div>
        )}

        <div className="flex flex-col gap-4">
          {searchApiResults.map((msg) => (
            <div key={msg.id} className="p-2 bg-white rounded shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <img
                  src={
                    msg.message.sender.avatar ||
                    `https://i.pravatar.cc/150?u=${msg.message.sender._id}`
                  }
                  alt={msg.message.sender.name}
                  className="w-6 h-6 rounded-full"
                />
                <span className="font-semibold">{msg.message.sender.name}</span>
                <span className="text-xs text-gray-500">
                  {new Date(msg.message.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="text-sm text-gray-700">{msg.message.content}</p>
            </div>
          ))}
        </div>

        {searchHasMore && (
          <div className="flex justify-center items-center py-4">
            <button
              onClick={handleLoadMoreSearch}
              disabled={isApiSearching}
              className="text-indigo-600 hover:underline disabled:opacity-50"
            >
              {isApiSearching ? "Đang tải..." : "Tải thêm kết quả"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
