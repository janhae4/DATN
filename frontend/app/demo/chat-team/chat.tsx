"use client";

import {
  Loader2,
  LogOut as LogOutIcon,
  Plus as PlusIcon,
  SearchIcon,
  Send as SendIcon,
  Users as UsersIcon,
  XIcon,
} from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useChatStore } from "./useChatStore";
import { ApiService } from "./api-service";
import { CreateTeamModal } from "./modal";
import { ManageMembersModal } from "./team";
import { Message, NewChatModal } from "./message";
import { ConversationList } from "./conversation";

const MESSAGE_LIMIT = 20;

export function ChatComponent({
  currentUser,
  onLogout,
}: {
  currentUser: User;
  onLogout: () => void;
}) {
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingOlderMessages, setIsLoadingOlderMessages] = useState(false);
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [isCreateTeamModalOpen, setIsCreateTeamModalOpen] = useState(false);
  const [isManageMembersModalOpen, setIsManageMembersModalOpen] =
    useState(false);
  const [newMessage, setNewMessage] = useState("");

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const isNearTop = useRef(false);

  const {
    selectedConversation,
    messages,
    messagePages,
    hasMoreMessages,
    ensureConversationVisible,
    upsertConversationMeta,
    moveConversationToTop,
    appendMessage,
    prependMessages,
    setSelectedConversation,
    updateConversationInList,
    loadInitialConversations,
    setMessagesForConversation,
    setMessagePage,
    setHasMoreMessages,
    replaceTempMessage,
    removeTempMessage,
  } = useChatStore();

  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isApiSearching, setIsApiSearching] = useState(false);
  const [searchApiResults, setSearchApiResults] = useState<MessageData[]>([]);
  const [searchPage, setSearchPage] = useState(1);
  const [searchHasMore, setSearchHasMore] = useState(false);
  const [totalSearchHits, setTotalSearchHits] = useState(0);

  const onConversationUpdated = useCallback(
    (updatedConversation: Conversation) => {
      updateConversationInList(updatedConversation);
      setIsManageMembersModalOpen(false);
    },
    [updateConversationInList]
  );
  const onUserLeave = useCallback(() => {
    setIsManageMembersModalOpen(false);
    setSelectedConversation(null);
    loadInitialConversations();
  }, [setSelectedConversation, loadInitialConversations]);

  useEffect(() => {
    const socket = io("http://localhost:4001", { withCredentials: true });
    socketRef.current = socket;

    socket.on("connect", () => console.log("✅ Socket connected", socket.id));
    socket.on("disconnect", (reason) =>
      console.warn("⚠️ Socket disconnected:", reason)
    );

    socket.on("new_message", async (payload: MessageData) => {
      console.log("Received new message via socket:", payload);
      const { conversationId } = payload;
      if (!conversationId) {
        console.error("Received message without conversationId:", payload);
        return;
      }

      upsertConversationMeta({ _id: conversationId, latestMessage: payload });

      await ensureConversationVisible(conversationId, async (id) => {
        console.log(`Fetching missing conversation details for ID: ${id}`);
        try {
          return await ApiService.getConversationById(id);
        } catch (error) {
          console.error(`Error fetching conversation ${id}:`, error);
          return null;
        }
      });

      moveConversationToTop(conversationId);
      appendMessage(conversationId, payload);
    });

    return () => {
      console.log("Disconnecting socket...");
      socket.disconnect();
      socket.off("connect");
      socket.off("disconnect");
      socket.off("new_message");
      socketRef.current = null;
    };
  }, [
    upsertConversationMeta,
    ensureConversationVisible,
    moveConversationToTop,
    appendMessage,
  ]);

  // ===== AUTO SCROLL =====
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    if (isSearchActive) return;

    const isDifferentConversation =
      container.dataset.convoId !== selectedConversation?._id;

    const scrollThreshold = 100;
    const isScrolledToBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight <
      scrollThreshold;

    if (
      messagesEndRef.current &&
      (isScrolledToBottom || isDifferentConversation)
    ) {
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({
            behavior: "smooth",
            block: "end",
          });
        }
      }, 100);
      if (selectedConversation) {
        container.dataset.convoId = selectedConversation._id;
      }
    }
  }, [messages, selectedConversation?._id]);

  const currentMessages = selectedConversation
    ? messages[selectedConversation._id] || []
    : [];
  const currentPage = selectedConversation
    ? messagePages[selectedConversation._id] || 1
    : 1;
  const currentHasMore = selectedConversation
    ? hasMoreMessages[selectedConversation._id] ?? true
    : false;

  // ===== LOAD MESSAGES ON SELECTION CHANGE (INITIAL LOAD) =====
  useEffect(() => {
    const fetchInitialMessages = async () => {
      if (!selectedConversation) return;
      closeSearch();

      const convoId = selectedConversation._id;
      if (!messages[convoId]) {
        try {
          console.log(`Fetching INITIAL messages for ${convoId}...`);
          setIsLoadingMessages(true);
          const data = await ApiService.getMessages(convoId, 1, MESSAGE_LIMIT);
          const reversedData = data.reverse();
          const hasMore = data.length === MESSAGE_LIMIT;

          setMessagesForConversation(convoId, reversedData, 1, hasMore);

          console.log(
            `Initial messages for ${convoId} loaded. Has more: ${hasMore}`
          );

          setTimeout(
            () =>
              messagesEndRef.current?.scrollIntoView({
                behavior: "auto",
                block: "end",
              }),
            100
          );
        } catch (error) {
          console.error(
            `Failed to fetch initial messages for ${convoId}:`,
            error
          );
          setMessagesForConversation(convoId, [], 1, false);
        } finally {
          setIsLoadingMessages(false);
        }
      } else {
        setIsLoadingMessages(false);
        setTimeout(
          () =>
            messagesEndRef.current?.scrollIntoView({
              behavior: "auto",
              block: "end",
            }),
          100
        );
      }
    };
    fetchInitialMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConversation?._id, setMessagesForConversation]);

  // ===== LOAD OLDER MESSAGES LOGIC =====
  const loadOlderMessages = useCallback(async () => {
    if (!selectedConversation || isLoadingOlderMessages || !currentHasMore) {
      return;
    }

    console.log(
      `Loading older messages for ${selectedConversation._id}, page ${
        currentPage + 1
      }`
    );
    setIsLoadingOlderMessages(true);
    const convoId = selectedConversation._id;
    const nextPage = currentPage + 1;

    try {
      const olderMessages = await ApiService.getMessages(
        convoId,
        nextPage,
        MESSAGE_LIMIT
      );
      const reversedOlderMessages = olderMessages.reverse();
      const hasMore = olderMessages.length === MESSAGE_LIMIT;

      const container = chatContainerRef.current;
      const oldScrollHeight = container?.scrollHeight || 0;

      prependMessages(convoId, reversedOlderMessages);
      setMessagePage(convoId, nextPage);
      setHasMoreMessages(convoId, hasMore);

      requestAnimationFrame(() => {
        if (container) {
          const newScrollHeight = container.scrollHeight;
          container.scrollTop =
            newScrollHeight - oldScrollHeight + container.scrollTop;
        }
      });

      console.log(
        `Loaded page ${nextPage} for ${convoId}. Has more: ${hasMore}`
      );
    } catch (error) {
      console.error(`Failed to load older messages for ${convoId}:`, error);
    } finally {
      setIsLoadingOlderMessages(false);
    }
  }, [
    selectedConversation,
    isLoadingOlderMessages,
    currentHasMore,
    currentPage,
    prependMessages,
    setMessagePage,
    setHasMoreMessages,
  ]);

  const handleScroll = useCallback(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    isNearTop.current = container.scrollTop < 50;

    if (container.scrollTop < 50 && !isLoadingOlderMessages && currentHasMore) {
      loadOlderMessages();
    }
  }, [isLoadingOlderMessages, currentHasMore, loadOlderMessages]);

  const handleSendMessage = useCallback(
    async (e: React.FormEvent<HTMLFormElement> | React.KeyboardEvent) => {
      e.preventDefault();
      if (!newMessage.trim() || !selectedConversation) return;

      const convoId = selectedConversation._id;
      const tempMessageId = `temp-${Date.now()}`;
      const tempMessage: MessageData = {
        _id: tempMessageId,
        content: newMessage,
        sender: {
          _id: currentUser.id,
          name: currentUser.name,
          avatar: currentUser.avatar,
          role: selectedConversation.participants?.find(
            (p) => p._id === currentUser.id
          )?.role,
        },
        createdAt: new Date().toISOString(),
        conversationId: convoId,
      };

      appendMessage(convoId, tempMessage);
      moveConversationToTop(convoId);
      upsertConversationMeta({ _id: convoId, latestMessage: tempMessage });

      const messageToSend = newMessage;
      setNewMessage("");

      try {
        const savedMessage = await ApiService.sendMessage(
          convoId,
          messageToSend
        );
        replaceTempMessage(convoId, tempMessageId, savedMessage);
        upsertConversationMeta({ _id: convoId, latestMessage: savedMessage });
        moveConversationToTop(convoId);
      } catch (error) {
        console.error("❌ Failed to send:", error);
        removeTempMessage(convoId, tempMessageId);
        setNewMessage(messageToSend);
        alert("Gửi tin nhắn thất bại!");
      }
    },
    [
      newMessage,
      selectedConversation,
      currentUser,
      appendMessage,
      moveConversationToTop,
      upsertConversationMeta,
      replaceTempMessage,
      removeTempMessage,
    ]
  );

  const handleChatCreated = useCallback(
    (newConversation: Conversation) => {
      ensureConversationVisible(
        newConversation._id,
        async () => newConversation
      ).then(() => {
        moveConversationToTop(newConversation._id);
        setSelectedConversation(newConversation);
      });
      setIsNewChatModalOpen(false);
      setIsCreateTeamModalOpen(false);
    },
    [ensureConversationVisible, moveConversationToTop, setSelectedConversation]
  );

  const closeSearch = () => {
    setIsSearchActive(false);
    setSearchQuery("");
    setSearchApiResults([]);
    setSearchPage(1);
    setSearchHasMore(false);
    setTotalSearchHits(0);
    setIsApiSearching(false);
  };

  useEffect(() => {
    // Không chạy nếu search không active, không có convo, hoặc query rỗng
    if (!isSearchActive || !selectedConversation || !searchQuery.trim()) {
      setSearchApiResults([]);
      setSearchPage(1);
      setSearchHasMore(false);
      setTotalSearchHits(0);
      return;
    }

    const debouncedSearch = setTimeout(async () => {
      setIsApiSearching(true);
      setSearchPage(1); // Luôn reset về page 1 khi có query mới
      try {
        const data = await ApiService.searchMessages(
          searchQuery,
          selectedConversation._id,
          1,
          MESSAGE_LIMIT
        );

        setSearchApiResults(data.hits);
        setTotalSearchHits(data.totalHits);
        setSearchHasMore(data.totalPages > data.currentPage);
      } catch (error) {
        console.error("Failed to search messages:", error);
      } finally {
        setIsApiSearching(false);
      }
    }, 300); // Debounce 300ms

    return () => clearTimeout(debouncedSearch);
  }, [searchQuery, isSearchActive, selectedConversation]); // Bỏ `messages` // (ĐÃ XÓA: handleSearchNav) // Hàm tải thêm kết quả tìm kiếm

  const handleLoadMoreSearch = async () => {
    if (!selectedConversation || isApiSearching || !searchHasMore) return;

    const nextPage = searchPage + 1;
    setIsApiSearching(true);
    try {
      const data = await ApiService.searchMessages(
        selectedConversation._id,
        searchQuery,
        nextPage,
        MESSAGE_LIMIT
      ); // Nối kết quả cũ với kết quả mới
      setSearchApiResults((prev) => [...prev, ...data.hits]);
      setSearchPage(nextPage);
      setSearchHasMore(data.totalPages > data.currentPage);
    } catch (error) {
      console.error("Failed to load more search results:", error);
    } finally {
      setIsApiSearching(false);
    }
  };

  const headerData = (() => {
    if (!selectedConversation) return { name: "", avatar: "", members: [] };
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
  })();

  // ===== RENDER =====
  return (
    <>
      <NewChatModal
        isOpen={isNewChatModalOpen}
        onClose={() => setIsNewChatModalOpen(false)}
        onChatCreated={handleChatCreated}
      />
      <CreateTeamModal
        isOpen={isCreateTeamModalOpen}
        onClose={() => setIsCreateTeamModalOpen(false)}
        onChatCreated={handleChatCreated}
      />
      {selectedConversation && selectedConversation.isGroupChat && (
        <ManageMembersModal
          isOpen={isManageMembersModalOpen}
          onClose={() => setIsManageMembersModalOpen(false)}
          conversation={selectedConversation}
          currentUser={currentUser}
          onUserLeave={onUserLeave}
          onConversationUpdated={onConversationUpdated}
        />
      )}

      {/* ===== MAIN LAYOUT ===== */}
      <div className="flex h-screen bg-gray-50 text-gray-900 font-sans antialiased">
        {/* ==== LEFT SIDEBAR ==== */}
        <aside className="w-1/4 xl:w-1/5 bg-white flex flex-col border-r border-gray-200">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">Chat</h1>
            <button
              onClick={onLogout}
              title="Đăng xuất"
              className="p-2 rounded-full hover:bg-gray-200 transition-colors"
            >
              <LogOutIcon className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          <ConversationList
            currentUser={currentUser}
            onSelectConversation={setSelectedConversation}
          />

          <div className="p-4 border-t border-gray-200 space-y-2">
            <button
              onClick={() => setIsNewChatModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
            >
              <PlusIcon className="w-5 h-5" /> Trò chuyện mới
            </button>
            <button
              onClick={() => setIsCreateTeamModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
            >
              <UsersIcon className="w-5 h-5" /> Tạo Team mới
            </button>
          </div>
        </aside>

        {/* ==== MAIN CHAT AREA ==== */}
        <main className="flex-1 flex flex-col bg-gray-100">
          {selectedConversation ? (
            <>
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
                      {" "}
                      {headerData.name}{" "}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {" "}
                      {selectedConversation.isGroupChat
                        ? `${headerData.members?.length || 0} thành viên`
                        : "Online"}{" "}
                    </p>
                  </div>
                </div>
                {selectedConversation.isGroupChat && (
                  <button
                    onClick={() => setIsManageMembersModalOpen(true)}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors flex-shrink-0"
                    title="Quản lý thành viên"
                  >
                    <UsersIcon className="w-6 h-6 text-gray-500" />
                  </button>
                )}
                <div className="flex items-center gap-2">
                  {selectedConversation.isGroupChat && (
                    <button
                      onClick={() => setIsManageMembersModalOpen(true)}
                      title="Quản lý thành viên"
                      className="p-2 rounded-full hover:bg-gray-100"
                    >
                      <UsersIcon className="w-6 h-6 text-gray-500" />
                    </button>
                  )}
                   
                  <button
                    onClick={() => setIsSearchActive(true)}
                    title="Tìm kiếm tin nhắn"
                    className="p-2 rounded-full hover:bg-gray-100"
                  >
                    <SearchIcon className="w-6 h-6 text-gray-500" /> 
                  </button>
                </div>
              </header>

              {isSearchActive && (
                <div className="p-2 bg-white border-b border-gray-200 flex items-center gap-2 flex-shrink-0 sticky top-0 z-10">
                  <input
                    type="text"
                    placeholder="Tìm kiếm trong cuộc trò chuyện này..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") closeSearch();
                    }}
                    className="flex-1 bg-gray-100 border border-gray-300 rounded-lg py-1 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    autoFocus
                  />
                  <span className="text-sm text-gray-500 w-24 text-center">
                    {isApiSearching
                      ? "..."
                      : totalSearchHits > 0
                      ? `${totalSearchHits} kết quả`
                      : searchQuery
                      ? "0 kết quả"
                      : ""}
                  </span>
                  <button
                    onClick={closeSearch}
                    className="p-1 rounded hover:bg-gray-200"
                    title="Đóng tìm kiếm (Esc)"
                  >
                    <XIcon className="w-5 h-5" />
                  </button>
                </div>
              )}

              <div
                ref={chatContainerRef}
                onScroll={!isSearchActive ? handleScroll : undefined} // Chỉ bật scroll-load khi không search
                className="flex-1 p-6 overflow-y-auto"
                style={{ scrollBehavior: "auto" }}
              >
                {/* ---- Logic Render Mới ---- */}
                {isSearchActive ? (
                  /* == CHẾ ĐỘ XEM TÌM KIẾM == */
                  <>
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
                    {searchApiResults.map((msg) => (
                      <div className="bg-white">
                          <div className="flex items-center">
                            <img
                              src={msg.sender.avatar}
                              alt={msg.sender.name}
                              className="w-10 h-10 rounded-full object-cover mr-4 flex-shrink-0"
                              onError={(e) =>
                                (e.currentTarget.src = `https://placehold.co/100x100/cccccc/ffffff?text=?`)
                              }
                            />
                            <div className="min-w-0">
                              <h2 className="text-lg font-semibold text-gray-800 truncate">
                                {msg.sender.name}
                              </h2>
                              <p className="text-sm text-gray-500">
                                {msg.content}
                              </p>
                            </div>
                          </div>
                      </div>
                    ))}
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
                  </>
                ) : (
                  /* == CHẾ ĐỘ XEM THÔNG THƯỜNG == */
                  <>
                    {isLoadingOlderMessages && (
                      <div className="flex justify-center items-center py-4">
                        <Loader2 className="animate-spin h-6 w-6 text-indigo-600" />
                      </div>
                    )}
                    {isLoadingMessages && currentMessages.length === 0 && (
                      <div className="flex justify-center items-center h-full">
                        <Loader2 className="animate-spin h-6 w-6 text-indigo-600" />
                      </div>
                    )}
                    {!isLoadingMessages && currentMessages.length === 0 && (
                      <div className="flex justify-center items-center h-full">
                        <p className="text-gray-500">Chưa có tin nhắn nào.</p>
                      </div>
                    )}
                    {/* (ĐÃ XÓA logic highlight và data-message-id) */}
                    {currentMessages.map((msg) => {
                      if (!msg || !msg.sender) return null;
                      return (
                        <Message
                          key={msg._id || msg.createdAt}
                          message={msg}
                          isCurrentUser={msg.sender._id === currentUser.id}
                        />
                      );
                    })}
                    <div ref={messagesEndRef} style={{ height: "1px" }} />
                  </>
                )}
              </div>

              <div
                ref={chatContainerRef}
                onScroll={handleScroll}
                className="flex-1 p-6 overflow-y-auto"
                style={{ scrollBehavior: "auto" }}
              >
                {isLoadingOlderMessages && (
                  <div className="flex justify-center items-center py-4">
                    <Loader2 className="animate-spin h-6 w-6 text-indigo-600" />
                  </div>
                )}

                {isLoadingMessages && currentMessages.length === 0 && (
                  <div className="flex justify-center items-center h-full">
                    <Loader2 className="animate-spin h-6 w-6 text-indigo-600" />
                  </div>
                )}

                {!isLoadingMessages && currentMessages.length === 0 && (
                  <div className="flex justify-center items-center h-full">
                    <p className="text-gray-500">Chưa có tin nhắn nào.</p>
                  </div>
                )}
                {currentMessages.map((msg) => {
                  if (!msg || !msg.sender) {
                    console.warn("Invalid message object found:", msg);
                    return null;
                  }
                  console.log(msg.sender);
                  console.log(currentUser.id);
                  return (
                    <Message
                      key={msg._id || msg.createdAt}
                      message={msg}
                      isCurrentUser={msg.sender._id === currentUser.id}
                    />
                  );
                })}
                <div ref={messagesEndRef} style={{ height: "1px" }} />
              </div>

              <footer className="p-4 border-t border-gray-200 bg-white flex-shrink-0">
                <form
                  onSubmit={handleSendMessage}
                  className="flex items-center gap-4"
                >
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Nhập tin nhắn..."
                    className="flex-1 bg-gray-100 border border-gray-300 rounded-lg py-2 px-4 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
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
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-gray-500 text-center px-4">
                {useChatStore.getState().visibleConversations.length > 0
                  ? "Chọn một cuộc hội thoại để bắt đầu trò chuyện."
                  : "Bạn chưa có cuộc trò chuyện nào. Hãy tạo mới hoặc bắt đầu một team!"}
              </p>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
