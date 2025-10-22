"use client";

import {
  Loader2,
  LogOut as LogOutIcon, // Đổi tên import
  Plus as PlusIcon,
  Send as SendIcon,
  Users as UsersIcon,
  Crown as CrownIcon,
  Shield as ShieldIcon,
  X as XIcon,
  Trash2 as TrashIcon, // Đổi tên import
  UserPlus as UserPlusIcon,
  MoreVertical as MoreVerticalIcon,
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
  const [isLoadingOlderMessages, setIsLoadingOlderMessages] = useState(false); // State mới
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [isCreateTeamModalOpen, setIsCreateTeamModalOpen] = useState(false);
  const [isManageMembersModalOpen, setIsManageMembersModalOpen] =
    useState(false);
  const [newMessage, setNewMessage] = useState("");

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const chatContainerRef = useRef<HTMLDivElement | null>(null); // Ref cho div cuộn tin nhắn
  const isNearTop = useRef(false); // Ref để theo dõi vị trí cuộn cũ

  // Zustand store actions and state
  const {
    selectedConversation,
    messages,
    messagePages, // Lấy page state từ store
    hasMoreMessages, // Lấy hasMore state từ store
    ensureConversationVisible,
    upsertConversationMeta,
    moveConversationToTop,
    appendMessage,
    prependMessages, // Lấy action prepend
    setSelectedConversation,
    updateConversationInList,
    loadInitialConversations,
    setMessagesForConversation,
    setMessagePage, // Lấy action set page
    setHasMoreMessages, // Lấy action set hasMore
    replaceTempMessage,
    removeTempMessage,
  } = useChatStore();

  // Callbacks for member management modal
  const onConversationUpdated = useCallback(
    /* ... giữ nguyên ... */
    (updatedConversation: Conversation) => {
      updateConversationInList(updatedConversation);
      setIsManageMembersModalOpen(false);
    },
    [updateConversationInList]
  );
  const onUserLeave = useCallback(
    /* ... giữ nguyên ... */
    () => {
      setIsManageMembersModalOpen(false);
      setSelectedConversation(null);
      loadInitialConversations(); // Reload initial list after leaving
    },
    [setSelectedConversation, loadInitialConversations]
  );

  // ===== SOCKET SETUP =====
  useEffect(() => {
    // ... (Giữ nguyên logic socket)
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
      appendMessage(conversationId, payload); // Append message to store's map
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
    // Chỉ cuộn xuống nếu đang ở gần cuối hoặc khi conversation thay đổi
    const container = chatContainerRef.current;
    if (!container) return;

    // Kiểm tra xem có phải do người dùng chọn conversation khác không
    const isDifferentConversation =
      container.dataset.convoId !== selectedConversation?._id;

    // Kiểm tra xem có gần cuối không TRƯỚC khi tin nhắn mới được thêm vào DOM
    const scrollThreshold = 100; // Khoảng cách pixel từ đáy
    const isScrolledToBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight <
      scrollThreshold;

    if (
      messagesEndRef.current &&
      (isScrolledToBottom || isDifferentConversation)
    ) {
      // console.log("Scrolling to bottom");
      // Dùng setTimeout để đảm bảo DOM đã cập nhật sau khi state messages thay đổi
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({
            behavior: "smooth",
            block: "end",
          });
        }
      }, 100); // Delay nhỏ
    }

    // Cập nhật dataset để theo dõi conversation hiện tại
    if (selectedConversation) {
      container.dataset.convoId = selectedConversation._id;
    }
  }, [messages, selectedConversation?._id]); // Phụ thuộc vào messages và ID conversation

  // Current messages for the selected conversation from store
  const currentMessages = selectedConversation
    ? messages[selectedConversation._id] || []
    : [];
  const currentPage = selectedConversation
    ? messagePages[selectedConversation._id] || 1
    : 1;
  const currentHasMore = selectedConversation
    ? hasMoreMessages[selectedConversation._id] ?? true
    : false; // Mặc định là true

  // ===== LOAD MESSAGES ON SELECTION CHANGE (INITIAL LOAD) =====
  useEffect(() => {
    const fetchInitialMessages = async () => {
      if (!selectedConversation) return;

      const convoId = selectedConversation._id;
      // Chỉ fetch trang đầu tiên nếu messages chưa có trong store
      if (!messages[convoId]) {
        try {
          console.log(`Fetching INITIAL messages for ${convoId}...`);
          setIsLoadingMessages(true); // Chỉ loading cho lần đầu
          const data = await ApiService.getMessages(convoId, 1, MESSAGE_LIMIT); // Luôn load trang 1
          const reversedData = data.reverse(); // Đảo ngược để hiển thị đúng thứ tự
          const hasMore = data.length === MESSAGE_LIMIT; // Kiểm tra xem còn trang sau không

          // Cập nhật store với trang đầu tiên
          setMessagesForConversation(convoId, reversedData, 1, hasMore);

          console.log(
            `Initial messages for ${convoId} loaded. Has more: ${hasMore}`
          );

          // Cuộn xuống đáy sau khi load xong trang đầu tiên
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
          setMessagesForConversation(convoId, [], 1, false); // Set rỗng nếu lỗi
        } finally {
          setIsLoadingMessages(false);
        }
      } else {
        // Messages đã có, không cần loading ban đầu
        setIsLoadingMessages(false);
        // Vẫn cuộn xuống đáy khi chuyển convo
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
  }, [selectedConversation?._id, setMessagesForConversation]); // Chỉ chạy khi ID thay đổi

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
      const reversedOlderMessages = olderMessages.reverse(); // API trả về mới nhất trước, cần đảo lại
      const hasMore = olderMessages.length === MESSAGE_LIMIT;

      // Lưu chiều cao cũ để giữ vị trí cuộn
      const container = chatContainerRef.current;
      const oldScrollHeight = container?.scrollHeight || 0;

      // Thêm tin nhắn cũ vào ĐẦU danh sách trong store
      prependMessages(convoId, reversedOlderMessages);
      // Cập nhật trang hiện tại và trạng thái hasMore trong store
      setMessagePage(convoId, nextPage);
      setHasMoreMessages(convoId, hasMore);

      // Khôi phục vị trí cuộn sau khi DOM cập nhật
      requestAnimationFrame(() => {
        if (container) {
          const newScrollHeight = container.scrollHeight;
          container.scrollTop =
            newScrollHeight - oldScrollHeight + container.scrollTop;
          // console.log(`Restored scroll. OldH: ${oldScrollHeight}, NewH: ${newScrollHeight}, NewScrollTop: ${container.scrollTop}`);
        }
      });

      console.log(
        `Loaded page ${nextPage} for ${convoId}. Has more: ${hasMore}`
      );
    } catch (error) {
      console.error(`Failed to load older messages for ${convoId}:`, error);
      // Có thể hiển thị lỗi cho người dùng
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

  // ===== SCROLL EVENT HANDLER FOR LOADING OLDER MESSAGES =====
  const handleScroll = useCallback(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    // Lưu lại trạng thái gần đầu để dùng trong auto-scroll xuống
    isNearTop.current = container.scrollTop < 50;

    // Trigger load older messages khi cuộn gần đến đỉnh (ví dụ: cách đỉnh 50px)
    if (container.scrollTop < 50 && !isLoadingOlderMessages && currentHasMore) {
      loadOlderMessages();
    }
  }, [isLoadingOlderMessages, currentHasMore, loadOlderMessages]);

  // ===== SEND MESSAGE HANDLER =====
  const handleSendMessage = useCallback(
    async (e: React.FormEvent<HTMLFormElement> | React.KeyboardEvent) => {
      // ... (Giữ nguyên logic gửi tin nhắn)
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

  // ===== CHAT CREATED HANDLER =====
  const handleChatCreated = useCallback(
    (newConversation: Conversation) => {
      // ... (Giữ nguyên logic)
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

  // ===== HEADER DATA =====
  const headerData = (() => {
    // ... (Giữ nguyên logic)
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
          {/* ... (Giữ nguyên header và footer sidebar) ... */}
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
                {/* ... (Giữ nguyên header) ... */}
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
              </header>

              {/* === Vùng hiển thị tin nhắn - CÓ SCROLL HANDLER === */}
              <div
                ref={chatContainerRef} // Gán ref
                onScroll={handleScroll} // Gán scroll handler
                className="flex-1 p-6 overflow-y-auto" // Đảm bảo có overflow-y-auto
                style={{ scrollBehavior: "auto" }} // Tắt smooth scroll mặc định khi load tin nhắn cũ
              >
                {/* Loading indicator cho tin nhắn cũ */}
                {isLoadingOlderMessages && (
                  <div className="flex justify-center items-center py-4">
                    <Loader2 className="animate-spin h-6 w-6 text-indigo-600" />
                  </div>
                )}

                {/* Loading indicator cho tin nhắn ban đầu */}
                {isLoadingMessages &&
                  currentMessages.length === 0 && ( // Chỉ hiển thị khi chưa có tin nhắn nào
                    <div className="flex justify-center items-center h-full">
                      <Loader2 className="animate-spin h-6 w-6 text-indigo-600" />
                    </div>
                  )}

                {/* Render danh sách tin nhắn */}
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
              {/* ... (Giữ nguyên màn hình chờ) ... */}
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
