"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";

// ============================================================================
// ĐỊNH NGHĨA CÁC KIỂU DỮ LIỆU (TYPESCRIPT)
// ============================================================================
interface User {
  id: string;
  name: string;
  avatar: string;
}

interface Participant {
  _id: string;
  name: string;
  avatar?: string;
}

// Dùng chung cho tin nhắn từ API và tin nhắn từ Socket
interface MessageData {
  _id: string;
  content: string;
  sender: Participant;
  createdAt: string;
  conversationId: string; // Thêm trường này để biết tin nhắn thuộc về conversation nào
}

interface Conversation {
  _id: string;
  isGroupChat: boolean;
  name?: string;
  avatar?: string;
  participants: Participant[];
  latestMessage?: MessageData;
}

// ============================================================================
// CẤU HÌNH API & SOCKET
// ============================================================================
const API_BASE_URL = "http://localhost:3000";
const SOCKET_URL = "http://localhost:4001"; // URL của Socket Gateway

const ApiService = {
  request: async (endpoint: string, options: RequestInit = {}) => {
    const config: RequestInit = {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      credentials: "include",
    };
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: response.statusText }));
      throw new Error(errorData.message || "Something went wrong");
    }
    if (response.status === 204) return null;
    return response.json();
  },

  login: (username: string, password: string) =>
    ApiService.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),

  getInfo: (): Promise<User> => ApiService.request("/auth/info"),

  logout: () => ApiService.request("/auth/logout", { method: "POST" }),

  getConversations: (): Promise<Conversation[]> =>
    ApiService.request("/chat/conversations"),

  getMessages: (
    conversationId: string,
    page = 1,
    limit = 50
  ): Promise<MessageData[]> =>
    ApiService.request(
      `/chat/conversations/${conversationId}/messages?page=${page}&limit=${limit}`
    ),

  sendMessage: (
    conversationId: string,
    content: string
  ): Promise<MessageData> =>
    ApiService.request(`/chat/conversations/${conversationId}/messages`, {
      method: "POST",
      body: JSON.stringify({ content }),
    }),

  createDirectChat: (partnerId: string): Promise<Conversation> =>
    ApiService.request("/chat/conversations/direct", {
      method: "POST",
      body: JSON.stringify({ partnerId }),
    }),

  createTeam: (name: string, participantIds: string[]): Promise<Conversation> =>
    ApiService.request("/team", {
      method: "POST",
      body: JSON.stringify({ name, participantIds }), // Sửa thành participantIds
    }),
};

// ============================================================================
// CÁC ICON COMPONENT
// ============================================================================
const SendIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    {" "}
    <path d="m22 2-7 20-4-9-9-4Z" /> <path d="M22 2 11 13" />{" "}
  </svg>
);
const PlusIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    {" "}
    <path d="M5 12h14" /> <path d="M12 5v14" />{" "}
  </svg>
);
const UsersIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    {" "}
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />{" "}
    <circle cx="9" cy="7" r="4" /> <path d="M22 21v-2a4 4 0 0 0-3-3.87" />{" "}
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />{" "}
  </svg>
);
const LogOutIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    {" "}
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />{" "}
    <polyline points="16 17 21 12 16 7" />{" "}
    <line x1="21" x2="9" y1="12" y2="12" />{" "}
  </svg>
);
const Spinner = () => (
  <svg
    className="animate-spin h-5 w-5 text-white"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    {" "}
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    ></circle>{" "}
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>{" "}
  </svg>
);

// ============================================================================
// CÁC COMPONENT GIAO DIỆN CON
// ============================================================================
interface ConversationItemProps {
  conversation: Conversation;
  selected: boolean;
  onClick: () => void;
  currentUser: User;
}
const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  selected,
  onClick,
  currentUser,
}) => {
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
    const otherUser = conversation.participants.find(
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
      />
      <div className="flex-1 overflow-hidden">
        <div className="flex justify-between items-center">
          <p className="font-semibold text-gray-800 truncate">{display.name}</p>
          <p className="text-xs text-gray-500">{timestamp}</p>
        </div>
        <p className="text-sm text-gray-600 truncate">{latestMessageContent}</p>
      </div>
    </div>
  );
};

interface MessageProps {
  message: MessageData;
  isCurrentUser: boolean;
}
const Message: React.FC<MessageProps> = ({ message, isCurrentUser }) => (
  <div
    className={`flex items-start gap-3 my-4 ${
      isCurrentUser ? "justify-end" : "justify-start"
    }`}
  >
    {!isCurrentUser && (
      <img
        src={
          message.sender.avatar ||
          `https://i.pravatar.cc/150?u=${message.sender._id}`
        }
        alt={message.sender.name}
        className="w-10 h-10 rounded-full object-cover"
      />
    )}
    <div
      className={`flex flex-col ${isCurrentUser ? "items-end" : "items-start"}`}
    >
      {!isCurrentUser && (
        <p className="text-xs text-gray-500 mb-1">{message.sender.name}</p>
      )}
      <div
        className={`px-4 py-2 rounded-2xl max-w-md md:max-w-lg shadow-sm ${
          isCurrentUser
            ? "bg-indigo-500 text-white rounded-br-none"
            : "bg-white text-gray-800 rounded-bl-none border border-gray-200"
        }`}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
      </div>
      <p className="text-xs text-gray-400 mt-1">
        {new Date(message.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </p>
    </div>
    {isCurrentUser && (
      <img
        src={message.sender.avatar}
        alt={message.sender.name}
        className="w-10 h-10 rounded-full object-cover"
      />
    )}
  </div>
);

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChatCreated: (conversation: Conversation) => void;
}
const NewChatModal: React.FC<NewChatModalProps> = ({
  isOpen,
  onClose,
  onChatCreated,
}) => {
  const [partnerId, setPartnerId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!partnerId.trim()) return;
    setIsLoading(true);
    setError("");
    try {
      const newConversation = await ApiService.createDirectChat(partnerId);
      onChatCreated(newConversation);
    } catch (err: any) {
      setError(err.message || "Không thể tạo cuộc trò chuyện.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Tạo cuộc trò chuyện mới</h2>
        <form onSubmit={handleSubmit}>
          <p className="text-sm text-gray-600 mb-2">
            {" "}
            Nhập ID của người bạn muốn trò chuyện.{" "}
          </p>
          <input
            type="text"
            value={partnerId}
            onChange={(e) => setPartnerId(e.target.value)}
            placeholder="User ID"
            className="w-full p-2 border border-gray-300 rounded"
            required
          />
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          <div className="flex justify-end gap-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded text-gray-600 bg-gray-100 hover:bg-gray-200"
            >
              {" "}
              Hủy{" "}
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 rounded text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 flex items-center"
            >
              {" "}
              {isLoading ? <Spinner /> : "Tạo"}{" "}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface CreateTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChatCreated: (conversation: Conversation) => void;
}
const CreateTeamModal: React.FC<CreateTeamModalProps> = ({
  isOpen,
  onClose,
  onChatCreated,
}) => {
  const [teamName, setTeamName] = useState("");
  const [participantIds, setParticipantIds] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!teamName.trim() || !participantIds.trim()) {
      setError("Vui lòng nhập tên team và ID thành viên.");
      return;
    }
    const ids = participantIds
      .split(",")
      .map((id) => id.trim())
      .filter((id) => id);
    if (ids.length === 0) {
      setError("Bạn cần nhập ít nhất một ID thành viên hợp lệ.");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const newTeamConversation = await ApiService.createTeam(teamName, ids);
      setTeamName("");
      setParticipantIds("");
      onChatCreated(newTeamConversation);
    } catch (err: any) {
      setError(err.message || "Không thể tạo team.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Tạo Team mới</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="teamName"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {" "}
              Tên Team{" "}
            </label>
            <input
              type="text"
              id="teamName"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Tên team của bạn..."
              className="w-full p-2 border border-gray-300 rounded"
              required
            />
          </div>
          <div>
            <label
              htmlFor="participantIds"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {" "}
              ID Thành viên (cách nhau bằng dấu phẩy){" "}
            </label>
            <textarea
              id="participantIds"
              value={participantIds}
              onChange={(e) => setParticipantIds(e.target.value)}
              placeholder="Nhập User ID, cách nhau bằng dấu phẩy..."
              className="w-full p-2 border border-gray-300 rounded min-h-[100px]"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              {" "}
              Ví dụ: 60d...1, 60d...2, 60d...3{" "}
            </p>
          </div>
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          <div className="flex justify-end gap-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded text-gray-600 bg-gray-100 hover:bg-gray-200"
            >
              {" "}
              Hủy{" "}
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 rounded text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 flex items-center"
            >
              {" "}
              {isLoading ? <Spinner /> : "Tạo Team"}{" "}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================================================
// COMPONENT CHAT CHÍNH
// ============================================================================
interface ChatComponentProps {
  currentUser: User;
  onLogout: () => void;
}
function ChatComponent({ currentUser, onLogout }: ChatComponentProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [isCreateTeamModalOpen, setIsCreateTeamModalOpen] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchConversations = useCallback(async () => {
    try {
      setIsLoadingConversations(true);
      const data = await ApiService.getConversations();
      setConversations(data);
      if (data.length > 0 && !selectedConversation) {
        setSelectedConversation(data[0]);
      }
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
    } finally {
      setIsLoadingConversations(false);
    }
  }, [selectedConversation]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Thiết lập kết nối Socket.IO
  useEffect(() => {
    if (!currentUser) return;

    const newSocket = io(SOCKET_URL, {
      withCredentials: true, // Gửi cookie để xác thực
    });
    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Socket connected:", newSocket.id);
    });

    newSocket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
    });

    return () => {
      console.log("Disconnecting socket...");
      newSocket.off("connect");
      newSocket.off("disconnect");
      newSocket.disconnect();
    };
  }, [currentUser]);

  
  
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (newMessage: MessageData) => {
      console.log("Received new message via socket:", newMessage);

      setConversations((prev) => {
        const convoIndex = prev.findIndex(
          (c) => c._id === newMessage.conversationId
        );
        if (convoIndex === -1) return prev; 

        const updatedConvo = { ...prev[convoIndex], latestMessage: newMessage };
        const otherConvos = prev.filter(
          (c) => c._id !== newMessage.conversationId
        );
        return [updatedConvo, ...otherConvos];
      });
      setSelectedConversation((currentSelected) => {
        if (currentSelected?._id === newMessage.conversationId) {
          setMessages((prev) => [...prev, newMessage]);
        }
        return currentSelected;
      });
    };
    socket.on("new_message", handleNewMessage);
    return () => {
      socket.off("new_message", handleNewMessage);
    };
  }, [socket]);
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedConversation) return;
      try {
        setIsLoadingMessages(true);
        const data = await ApiService.getMessages(selectedConversation._id);
        setMessages(data.reverse());
      } catch (error) {
        console.error("Failed to fetch messages:", error);
        setMessages([]);
      } finally {
        setIsLoadingMessages(false);
      }
    };
    fetchMessages();
  }, [selectedConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (newMessage.trim() === "" || !selectedConversation) return;

    // Optimistic UI update
    const tempMessageId = `temp-${Date.now()}`;
    const messageData: MessageData = {
      _id: tempMessageId,
      content: newMessage,
      sender: {
        _id: currentUser.id,
        name: currentUser.name,
        avatar: currentUser.avatar,
      },
      createdAt: new Date().toISOString(),
      conversationId: selectedConversation._id,
    };
    setMessages((prev) => [...prev, messageData]);
    setNewMessage("");

    try {
      const savedMessage = await ApiService.sendMessage(
        selectedConversation._id,
        newMessage
      );
      // Replace temp message with saved message from API
      setMessages((prev) =>
        prev.map((msg) => (msg._id === tempMessageId ? savedMessage : msg))
      );
      // Refetch conversations to update latest message
      await fetchConversations();
    } catch (error) {
      console.error("Failed to send message:", error);
      // Rollback optimistic update on failure
      setMessages((prev) => prev.filter((msg) => msg._id !== tempMessageId));
    }
  };

  const handleChatCreated = (newConversation: Conversation) => {
    setConversations((prev) => [
      newConversation,
      ...prev.filter((c) => c._id !== newConversation._id),
    ]);
    setSelectedConversation(newConversation);
    setIsNewChatModalOpen(false);
    setIsCreateTeamModalOpen(false); // Sửa lỗi: đóng cả modal team
  };

  const getHeaderData = () => {
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
    const otherUser = selectedConversation.participants.find(
      (p) => p._id !== currentUser.id
    );
    return {
      name: otherUser?.name || "Unknown",
      avatar:
        otherUser?.avatar ||
        `https://i.pravatar.cc/150?u=${otherUser?._id || "unknown"}`,
      members: selectedConversation.participants,
    };
  };
  const headerData = getHeaderData();

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

      <div className="flex h-screen bg-gray-50 text-gray-900 font-sans antialiased">
        <aside className="w-1/4 xl:w-1/5 bg-white flex flex-col border-r border-gray-200">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">Chat</h1>
            <button
              onClick={onLogout}
              title="Đăng xuất"
              className="p-2 rounded-full hover:bg-gray-200 transition-colors"
            >
              {" "}
              <LogOutIcon className="w-5 h-5 text-gray-600" />{" "}
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {isLoadingConversations ? (
              <div className="flex justify-center items-center h-full">
                {" "}
                <Spinner />{" "}
              </div>
            ) : (
              conversations.map((conv) => (
                <ConversationItem
                  key={conv._id}
                  conversation={conv}
                  selected={selectedConversation?._id === conv._id}
                  onClick={() => setSelectedConversation(conv)}
                  currentUser={currentUser}
                />
              ))
            )}
          </div>
          <div className="p-4 border-t border-gray-200 space-y-2">
            <button
              onClick={() => setIsNewChatModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300"
            >
              {" "}
              <PlusIcon className="w-5 h-5" /> Trò chuyện mới{" "}
            </button>
            <button
              onClick={() => setIsCreateTeamModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300"
            >
              {" "}
              <UsersIcon className="w-5 h-5" /> Tạo Team mới{" "}
            </button>
          </div>
        </aside>
        <main className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              <header className="flex items-center justify-between p-4 border-b border-gray-200 bg-white shadow-sm">
                <div className="flex items-center">
                  <img
                    src={headerData.avatar}
                    alt={headerData.name}
                    className="w-10 h-10 rounded-full object-cover mr-4"
                  />
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800">
                      {" "}
                      {headerData.name}{" "}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {" "}
                      {selectedConversation.isGroupChat
                        ? `${headerData.members.length} thành viên`
                        : "Online"}{" "}
                    </p>
                  </div>
                </div>
                <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                  {" "}
                  <UsersIcon className="w-6 h-6 text-gray-500" />{" "}
                </button>
              </header>
              <div className="flex-1 p-6 overflow-y-auto bg-gray-100">
                {isLoadingMessages ? (
                  <div className="flex justify-center items-center h-full">
                    {" "}
                    <Spinner />{" "}
                  </div>
                ) : (
                  messages.map((msg) => (
                    <Message
                      key={msg._id}
                      message={msg}
                      isCurrentUser={msg.sender._id === currentUser.id}
                    />
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
              <footer className="p-4 border-t border-gray-200 bg-white">
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
                  />
                  <button
                    type="submit"
                    className="bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-indigo-300 disabled:cursor-not-allowed"
                    disabled={!newMessage.trim()}
                  >
                    {" "}
                    <SendIcon className="w-6 h-6" />{" "}
                  </button>
                </form>
              </footer>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-100">
              <p className="text-gray-500">
                {" "}
                Chọn một cuộc hội thoại để bắt đầu{" "}
              </p>
            </div>
          )}
        </main>
      </div>
    </>
  );
}

// ============================================================================
// COMPONENT ĐĂNG NHẬP
// ============================================================================
interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
}
function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [email, setEmail] = useState("chanhhy");
  const [password, setPassword] = useState("123123");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      await ApiService.login(email, password);
      const userInfo = await ApiService.getInfo();
      onLoginSuccess(userInfo);
    } catch (err: any) {
      setError(err.message || "Đăng nhập thất bại. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center text-gray-800">
          {" "}
          Đăng nhập{" "}
        </h1>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="text-sm font-bold text-gray-600 block">
              {" "}
              Email{" "}
            </label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded mt-1"
              required
            />
          </div>
          <div>
            <label className="text-sm font-bold text-gray-600 block">
              {" "}
              Mật khẩu{" "}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded mt-1"
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 rounded-md text-white text-sm flex items-center justify-center"
          >
            {" "}
            {isLoading ? <Spinner /> : "Đăng nhập"}{" "}
          </button>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENT GỐC CỦA TRANG
// ============================================================================
export default function Page() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(true);

  const handleLogout = async () => {
    try {
      await ApiService.logout();
    } catch (error) {
      console.error("Logout failed", error);
    } finally {
      setCurrentUser(null);
    }
  };

  useEffect(() => {
    const verifyUser = async () => {
      try {
        const userInfo = await ApiService.getInfo();
        if (!userInfo) {
          setCurrentUser(null);
        }
        setCurrentUser(userInfo);
      } catch (error) {
        setCurrentUser(null);
      } finally {
        setIsAuthenticating(false);
      }
    };
    verifyUser();
  }, []);

  if (isAuthenticating) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <Spinner />
      </div>
    );
  }

  if (!currentUser) {
    return <LoginPage onLoginSuccess={setCurrentUser} />;
  }

  return <ChatComponent currentUser={currentUser} onLogout={handleLogout} />;
}
