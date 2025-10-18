"use client";

import React, { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import {
  User,
  Bot,
  Send,
  FileText,
  Sparkles,
  LogOut,
  Loader2, // Đã dọn dẹp
  UploadCloud,
  Trash2,
  PlusCircle,
  MessageSquare,
  ChevronUp,
  X,
} from "lucide-react";

// --- ĐỊNH NGHĨA CÁC KIỂU DỮ LIỆU ---
interface ChatMessage {
  id: string;
  role: "user" | "ai" | "error";
  content: string;
}

interface UserInfo {
  id: string;
  username: string;
}

interface Document {
  id: string;
  name: string;
}

interface ConversationPreview {
  _id: string;
  title: string;
  updatedAt: string;
}

// [THÊM] Interface cho response của list
interface ConversationListResponse {
  data: ConversationPreview[];
  total: number;
  page: number;
  totalPages: number;
}

interface ConversationResponse {
  data: MessageResponse;
  total: number;
  page: number;
  totalPages: number;
}

interface MessageResponse {
  _id: string;
  title: string;
  user_id: string;
  messages: Array<{
    _id: string;
    role: "user" | "ai" | "system";
    content: string;
    timestamp: string;
  }>;
  totalMessages: number;
  page: number;
  totalPages: number;
}

// --- CÁC KIỂU DỮ LIỆU PAYLOAD CHO SOCKET ---
interface AskQuestionPayload {
  question: string;
  conversationId: string | null;
}

interface SummarizeDocumentPayload {
  fileName: string;
  conversationId: string | null;
}

// --- HẰNG SỐ ---
const NESTJS_GATEWAY_URL = "http://localhost:3006";
const NESTJS_HTTP_URL = "http://localhost:3000";

const CHATBOT_PATTERN = {
  // Gửi đi
  ASK_QUESTION: "ask_question",
  SUMMARIZE_DOCUMENT: "summarize_document",
  // Nhận về
  CONVERSATION_STARTED: "conversation_started",
  RESPONSE_CHUNK: "chatbot.response_chunk",
  RESPONSE_ERROR: "chatbot.response_error",
  RESPONSE_END: "chatbot.response_end",
};

// --- COMPONENT CHÍNH ---
export default function ChatPage() {
  // --- STATE ---
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserInfo | null>(null);

  // State cho Sidebar
  const [sidebarTab, setSidebarTab] = useState<"history" | "documents">(
    "history"
  );
  const [documents, setDocuments] = useState<Document[]>([]);
  const [conversationList, setConversationList] = useState<
    ConversationPreview[]
  >([]);

  // State cho form đăng nhập
  const [username, setUsername] = useState("chanhhy");
  const [password, setPassword] = useState("123123");
  const [loginError, setLoginError] = useState("");

  // State cho upload
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State cho chat
  const [socket, setSocket] = useState<Socket | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [prompt, setPrompt] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [messagePagination, setMessagePagination] = useState({
    page: 1,
    totalPages: 1,
  });
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  const chatboxRef = useRef<HTMLDivElement>(null);

  // --- EFFECTS ---

  // Tự động cuộn chatbox xuống dưới
  useEffect(() => {
    // Chỉ cuộn nếu không phải đang tải lịch sử cũ (tránh nhảy trang)
    if (!isHistoryLoading) {
      chatboxRef.current?.scrollTo({
        top: chatboxRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [chatMessages, isHistoryLoading]);

  // Kiểm tra token khi tải trang
  useEffect(() => {
    const storedToken = localStorage.getItem("auth_token");
    if (storedToken) setToken(storedToken);
  }, []);

  // Fetch dữ liệu user, tài liệu, và lịch sử chat sau khi có token
  useEffect(() => {
    if (!token) return;

    const fetchInitialData = async () => {
      try {
        // 1. Fetch User
        const userRes = await fetch(`${NESTJS_HTTP_URL}/auth/info`, {
          credentials: "include",
        });
        if (!userRes.ok)
          throw new Error("Session không hợp lệ. Vui lòng đăng nhập lại.");
        const userData = await userRes.json();
        setUser(userData);

        // 2. Fetch Documents
        const docsRes = await fetch(`${NESTJS_HTTP_URL}/chatbot/get-files`, {
          method: "POST",
          credentials: "include",
        });
        if (docsRes.ok) {
          const docsData = await docsRes.json();
          setDocuments(
            docsData.map((fullFileName: string) => {
              const underscoreIndex = fullFileName.indexOf("_");
              const dashIndex = fullFileName.indexOf("-", underscoreIndex);
              const displayName =
                dashIndex !== -1
                  ? fullFileName.substring(dashIndex + 1)
                  : fullFileName;
              return { id: fullFileName, name: displayName };
            })
          );
        } else {
          console.error("Không thể tải danh sách tài liệu.");
        }

        // 3. Fetch Conversation History
        fetchConversationList(1);
      } catch (error: any) {
        console.error("Lỗi khi fetch data:", error);
        handleLogout();
      }
    };

    fetchInitialData();
  }, [token]);

  // Khởi tạo và quản lý Socket connection
  useEffect(() => {
    if (!user) return;

    const newSocket = io(NESTJS_GATEWAY_URL, { withCredentials: true });
    setSocket(newSocket);

    const handleChunk = (chunk: string) => {
      setChatMessages((prev) => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage?.role === "ai") {
          return [
            ...prev.slice(0, -1),
            { ...lastMessage, content: lastMessage.content + chunk },
          ];
        }
        return [
          ...prev,
          { id: Date.now().toString(), role: "ai", content: chunk },
        ];
      });
    };

    const handleError = (error: string) => {
      setChatMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), role: "error", content: `Lỗi: ${error}` },
      ]);
      setIsStreaming(false);
    };

    // [SỬA] handleEnd sẽ fetch list để cập nhật title
    const handleEnd = (message: string) => {
      console.log("Stream ended:", message);
      setIsStreaming(false);
      fetchConversationList(1); // Cập nhật danh sách (lấy title mới)
    };

    // [SỬA] handleConversationStarted chỉ cập nhật UI tạm thời
    const handleConversationStarted = (data: { newConversationId: string }) => {
      console.log("Conversation started, new ID:", data.newConversationId);
      setActiveConversationId(data.newConversationId);
      // Cập nhật UI tạm thời
      setConversationList((prev) => [
        {
          _id: data.newConversationId,
          title: "Cuộc trò chuyện mới...",
          updatedAt: new Date().toISOString(),
        },
        ...prev.filter((c) => c._id !== data.newConversationId),
      ]);
    };

    // --- ĐĂNG KÝ LISTENER ---
    newSocket.on("connect", () => console.log("WebSocket connected."));
    newSocket.on(CHATBOT_PATTERN.RESPONSE_CHUNK, handleChunk);
    newSocket.on(CHATBOT_PATTERN.RESPONSE_ERROR, handleError);
    newSocket.on(CHATBOT_PATTERN.RESPONSE_END, handleEnd);
    newSocket.on(
      CHATBOT_PATTERN.CONVERSATION_STARTED,
      handleConversationStarted
    );

    // --- CLEANUP ---
    return () => {
      newSocket.off("connect");
      newSocket.off(CHATBOT_PATTERN.RESPONSE_CHUNK, handleChunk);
      newSocket.off(CHATBOT_PATTERN.RESPONSE_ERROR, handleError);
      newSocket.off(CHATBOT_PATTERN.RESPONSE_END, handleEnd);
      newSocket.off(
        CHATBOT_PATTERN.CONVERSATION_STARTED,
        handleConversationStarted
      );
      newSocket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // --- CÁC HÀM XỬ LÝ (API & ACTIONS) ---

  const fetchConversationList = async (page = 1, limit = 50) => {
    try {
      const url = new URL(`${NESTJS_HTTP_URL}/chatbot/conversations`);
      url.searchParams.append("page", String(page));
      url.searchParams.append("limit", String(limit));

      const res = await fetch(url.toString(), {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Không thể tải lịch sử chat.");

      const data: ConversationListResponse = await res.json();

      // Chỉ set data (chưa làm "Load more" cho list)
      setConversationList(data.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSelectConversation = async (conversationId: string) => {
    if (isStreaming && activeConversationId === conversationId) return;

    console.log(`Loading conversation: ${conversationId}`);
    setActiveConversationId(conversationId);
    setIsLoadingMessages(true);
    setChatMessages([]);
    setMessagePagination({ page: 1, totalPages: 1 });

    try {
      // Tải trang 1 (tin nhắn mới nhất)
      const url = new URL(
        `${NESTJS_HTTP_URL}/chatbot/conversations/${conversationId}`
      );
      url.searchParams.append("page", "1");
      url.searchParams.append("limit", "30");

      const res = await fetch(url.toString(), {
        method: "GET",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Không thể tải tin nhắn.");

      const data = await res.json();
      const messages: MessageResponse = data.data

      setChatMessages(
        messages.messages.map((msg) => ({
          id: msg._id,
          role: msg.role as "user" | "ai",
          content: msg.content,
        }))
      );

      setMessagePagination({
        page: data.page,
        totalPages: data.totalPages,
      });
    } catch (error) {
      console.error(error);
      setChatMessages([
        {
          id: "err",
          role: "error",
          content: "Không thể tải lịch sử tin nhắn.",
        },
      ]);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleLoadMoreMessages = async () => {
    if (
      !activeConversationId ||
      isHistoryLoading ||
      messagePagination.page >= messagePagination.totalPages
    ) {
      return;
    }

    setIsHistoryLoading(true);
    const nextPage = messagePagination.page + 1;

    try {
      const url = new URL(
        `${NESTJS_HTTP_URL}/chatbot/conversations/${activeConversationId}`
      );
      url.searchParams.append("page", String(nextPage));
      url.searchParams.append("limit", "30");

      const res = await fetch(url.toString(), {
        method: "GET",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Không thể tải thêm tin nhắn.");

      const data = await res.json();
      const messages: MessageResponse = data.data
      setChatMessages((prev) => [
        ...messages.messages.map((msg) => ({
          id: msg._id,
          role: msg.role as "user" | "ai",
          content: msg.content,
        })),
        ...prev,
      ]);

      setMessagePagination({
        page: data.page,
        totalPages: data.totalPages,
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const handleNewChat = () => {
    if (isStreaming) return;
    setActiveConversationId(null);
    setChatMessages([]);
    setPrompt("");
    setIsStreaming(false);
    setMessagePagination({ page: 1, totalPages: 1 });
  };

  const handleDeleteConversation = async (
    e: React.MouseEvent,
    conversationId: string
  ) => {
    e.stopPropagation();
    if (isStreaming && activeConversationId === conversationId) {
      alert("Không thể xóa cuộc hội thoại đang hoạt động.");
      return;
    }

    if (!window.confirm("Bạn có chắc muốn xóa cuộc hội thoại này?")) return;

    try {
      const res = await fetch(`${NESTJS_HTTP_URL}/chatbot/conversations`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ conversationId: conversationId }),
      });

      if (!res.ok) throw new Error("Không thể xóa.");

      setConversationList((prev) =>
        prev.filter((c) => c._id !== conversationId)
      );

      if (activeConversationId === conversationId) {
        handleNewChat();
      }
    } catch (error) {
      console.error(error);
      alert("Lỗi: Không thể xóa cuộc hội thoại.");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    try {
      const response = await fetch(`${NESTJS_HTTP_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: "include",
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Sai thông tin đăng nhập.");
      }
      const data = await response.json();
      localStorage.setItem("auth_token", data.access_token || "true");
      setToken(data.access_token || "true");
    } catch (error: any) {
      setLoginError(error.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    setToken(null);
    setUser(null);
    setDocuments([]);
    setChatMessages([]);
    setConversationList([]);
    setActiveConversationId(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploadStatus(`Đang tải lên '${selectedFile.name}'...`);
    const formData = new FormData();
    formData.append("file", selectedFile);
    try {
      const response = await fetch(
        `${NESTJS_HTTP_URL}/chatbot/process-document`,
        {
          method: "POST",
          body: formData,
          credentials: "include",
        }
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Lỗi server");

      setDocuments((prev) => [
        ...prev,
        { id: result.fileName, name: result.originalName },
      ]);
      setUploadStatus(`Tải lên thành công!`);
    } catch (error: any) {
      setUploadStatus(`Lỗi: ${error.message}`);
    } finally {
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setTimeout(() => setUploadStatus(""), 3000);
    }
  };

  const handleSendMessage = () => {
    if (!prompt.trim() || !socket || isStreaming) return;

    const payload: AskQuestionPayload = {
      question: prompt,
      conversationId: activeConversationId,
    };

    setChatMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), role: "user", content: prompt },
    ]);
    setIsStreaming(true);
    setChatMessages((prev) => [
      ...prev,
      { id: (Date.now() + 1).toString(), role: "ai", content: "" },
    ]);

    socket.emit(CHATBOT_PATTERN.ASK_QUESTION, payload);
    setPrompt("");
  };

  const handleSummarize = (file: Document) => {
    if (!socket || isStreaming) return;

    const userMessage = `Vui lòng tóm tắt tài liệu: ${file.name}`;
    setChatMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), role: "user", content: userMessage },
    ]);
    setIsStreaming(true);
    setChatMessages((prev) => [
      ...prev,
      { id: (Date.now() + 1).toString(), role: "ai", content: "" },
    ]);

    const payload: SummarizeDocumentPayload = {
      fileName: file.id,
      conversationId: activeConversationId,
    };
    socket.emit(CHATBOT_PATTERN.SUMMARIZE_DOCUMENT, payload);
  };

  const handleDeleteDocument = async (file: Document) => {
    try {
      await fetch(`${NESTJS_HTTP_URL}/chatbot/delete-file`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId: file.id }),
        credentials: "include",
      });
      setDocuments((prev) => prev.filter((doc) => doc.id !== file.id));
    } catch (error) {
      console.error(error);
    }
  };

  // --- GIAO DIỆN (RENDER) ---

  if (!token) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-100">
        <form
          onSubmit={handleLogin}
          className="p-8 bg-white rounded-lg shadow-xl w-full max-w-sm"
        >
          <h1 className="text-3xl font-bold mb-6 text-center text-slate-800">
            Đăng nhập
          </h1>
          <div className="space-y-4">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Tên đăng nhập"
              required
              className="w-full p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mật khẩu"
              required
              className="w-full p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          {loginError && (
            <p className="text-red-500 text-sm mt-4 text-center">
              {loginError}
            </p>
          )}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white p-3 mt-6 rounded-md font-semibold hover:bg-blue-700 transition-colors"
          >
            Đăng nhập
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800">
      {/* Sidebar */}
      <aside className="w-80 bg-white p-4 flex flex-col border-r border-slate-200 h-full">
        {/* 1. Nút New Chat */}
        <div className="px-2 mb-4">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white p-2.5 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <PlusCircle size={16} />
            Cuộc trò chuyện mới
          </button>
        </div>

        {/* 2. Tabs (History / Documents) */}
        <div className="flex border-b border-slate-200 mb-2">
          <button
            onClick={() => setSidebarTab("history")}
            className={`flex-1 p-2 text-sm font-medium ${
              sidebarTab === "history"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-slate-500 hover:bg-slate-100"
            }`}
          >
            Lịch sử
          </button>
          <button
            onClick={() => setSidebarTab("documents")}
            className={`flex-1 p-2 text-sm font-medium ${
              sidebarTab === "documents"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-slate-500 hover:bg-slate-100"
            }`}
          >
            Tài liệu
          </button>
        </div>

        {/* 3. Nội dung Tab (Scrollable) */}
        <div className="flex-1 overflow-y-auto space-y-1 pr-2">
          {/* --- Tab Lịch sử --- */}
          {sidebarTab === "history" && (
            <>
              {conversationList.map((convo) => (
                <div
                  key={convo._id}
                  onClick={() => handleSelectConversation(convo._id)}
                  className={`p-2 rounded-md hover:bg-slate-100 group flex items-center justify-between cursor-pointer ${
                    activeConversationId === convo._id ? "bg-slate-100" : ""
                  }`}
                >
                  <div className="flex items-center space-x-2 overflow-hidden">
                    <MessageSquare
                      size={16}
                      className="text-slate-500 flex-shrink-0"
                    />
                    <span
                      className="text-sm text-slate-700 truncate"
                      title={convo.title}
                    >
                      {convo.title}
                    </span>
                  </div>
                  <button
                    onClick={(e) => handleDeleteConversation(e, convo._id)}
                    title="Xóa cuộc hội thoại"
                    className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 flex-shrink-0 p-1 hover:bg-red-100 rounded"
                  >
                    <X size={16} className="text-red-500" />
                  </button>
                </div>
              ))}
              {/* (Có thể thêm nút "Tải thêm lịch sử" ở đây) */}
            </>
          )}

          {/* --- Tab Tài liệu --- */}
          {sidebarTab === "documents" && (
            <>
              {/* Nút Upload (chỉ hiển thị ở tab doc) */}
              <div className="px-2 mb-4">
                <label
                  htmlFor="file-upload"
                  className="w-full flex items-center justify-center gap-2 bg-blue-50 text-blue-600 p-2.5 rounded-md text-sm font-medium cursor-pointer hover:bg-blue-100 transition-colors"
                >
                  <UploadCloud size={16} />
                  Tải file mới
                </label>
                <input
                  id="file-upload"
                  ref={fileInputRef}
                  type="file"
                  onChange={(e) =>
                    setSelectedFile(e.target.files ? e.target.files[0] : null)
                  }
                  className="hidden"
                />
                {selectedFile && (
                  <div className="mt-2 text-sm flex items-center justify-between">
                    <span className="truncate text-slate-600">
                      {selectedFile.name}
                    </span>
                    <button
                      onClick={handleUpload}
                      className="text-blue-600 font-semibold"
                    >
                      Tải lên
                    </button>
                  </div>
                )}
                {uploadStatus && (
                  <p className="text-xs text-center mt-2 text-slate-500">
                    {uploadStatus}
                  </p>
                )}
              </div>
              {/* Danh sách tài liệu */}
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="p-2 rounded-md hover:bg-slate-100 group flex items-center justify-between"
                >
                  <div className="flex items-center space-x-2 overflow-hidden">
                    <FileText
                      size={16}
                      className="text-slate-500 flex-shrink-0"
                    />
                    <span
                      className="text-sm text-slate-700 truncate"
                      title={doc.name}
                    >
                      {doc.name}
                    </span>
                  </div>
                  <div className="flex-shrink-0">
                    <button
                      onClick={() => handleSummarize(doc)}
                      title="Tóm tắt file này"
                      className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 p-1 hover:bg-blue-100 rounded"
                    >
                      <Sparkles size={16} className="text-blue-500" />
                    </button>
                    <button
                      onClick={() => handleDeleteDocument(doc)}
                      title="Xóa file"
                      className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 p-1 hover:bg-red-100 rounded"
                    >
                      <Trash2 size={16} className="text-red-500" />
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* 4. User Profile (Ghim ở dưới) */}
        <div className="border-t border-slate-200 pt-4 mt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                <User size={16} />
              </div>
              <span className="text-sm font-semibold">{user?.username}</span>
            </div>
            <button
              onClick={handleLogout}
              title="Đăng xuất"
              className="p-2 rounded-md hover:bg-slate-100"
            >
              <LogOut size={16} className="text-red-500" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Chat Window */}
      <main className="flex-1 flex flex-col h-screen">
        <div ref={chatboxRef} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* --- [MỚI] Trạng thái Loading / Empty --- */}
          {isLoadingMessages ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="animate-spin text-blue-600" size={48} />
            </div>
          ) : chatMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
              <Sparkles size={64} className="mb-4 text-blue-500" />
              <h2 className="text-2xl font-semibold text-slate-700">
                Chào bạn, tôi là trợ lý AI
              </h2>
              <p>
                {activeConversationId
                  ? "Cuộc hội thoại này trống."
                  : "Hỏi tôi bất cứ điều gì hoặc chọn một tài liệu để bắt đầu."}
              </p>
            </div>
          ) : (
            // --- Hiển thị tin nhắn ---
            <>
              {/* Nút "Tải thêm" */}
              {messagePagination.page < messagePagination.totalPages && (
                <div className="flex justify-center">
                  <button
                    onClick={handleLoadMoreMessages}
                    disabled={isHistoryLoading}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-full hover:bg-blue-100 disabled:opacity-50"
                  >
                    {isHistoryLoading ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      <ChevronUp size={16} />
                    )}
                    Tải tin nhắn cũ hơn
                  </button>
                </div>
              )}

              {/* Danh sách tin nhắn */}
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-start gap-4 ${
                    msg.role === "user" ? "justify-end" : ""
                  }`}
                >
                  {msg.role === "ai" && (
                    <div className="w-8 h-8 bg-blue-600 p-2 rounded-full text-white flex-shrink-0 flex items-center justify-center">
                      <Bot size={16} />
                    </div>
                  )}

                  <div
                    className={`px-4 py-3 rounded-lg max-w-2xl shadow-sm ${
                      msg.role === "user"
                        ? "bg-blue-500 text-white"
                        : msg.role === "ai"
                        ? "bg-white text-slate-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed">
                      {msg.content}
                    </p>
                  </div>

                  {msg.role === "user" && (
                    <div className="w-8 h-8 bg-slate-200 p-2 rounded-full text-slate-700 flex-shrink-0 flex items-center justify-center">
                      <User size={16} />
                    </div>
                  )}
                </div>
              ))}
            </>
          )}

          {/* --- Biểu tượng "AI đang gõ" --- */}
          {isStreaming &&
            chatMessages[chatMessages.length - 1]?.role === "ai" && (
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 bg-blue-600 p-2 rounded-full text-white flex-shrink-0 flex items-center justify-center">
                  <Bot size={16} />
                </div>
                <Loader2 className="animate-spin text-slate-500" />
              </div>
            )}
        </div>

        {/* --- Input Bar --- */}
        <div className="border-t border-slate-200 p-4 bg-white">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center bg-slate-100 rounded-lg p-2 border border-slate-200 focus-within:ring-2 focus-within:ring-blue-500">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="Hỏi AI về tài liệu của bạn hoặc bắt đầu một cuộc trò chuyện..."
                disabled={isStreaming}
                className="flex-grow bg-transparent outline-none px-2 text-slate-800"
              />
              <button
                onClick={handleSendMessage}
                disabled={isStreaming || !prompt.trim()}
                className="p-2 rounded-md bg-blue-600 text-white disabled:bg-slate-300 transition-colors"
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
