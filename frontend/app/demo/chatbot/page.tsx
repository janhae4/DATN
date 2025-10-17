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
  Loader2,
  UploadCloud,
  Trash2,
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
  id: string; // Tên file đầy đủ (có timestamp) để gửi cho backend
  name: string; // Tên file gốc để hiển thị
}

// --- COMPONENT CHÍNH ---
export default function ChatPage() {
  // --- CẤU HÌNH ---
  const NESTJS_GATEWAY_URL = "http://localhost:3006";
  const NESTJS_HTTP_URL = "http://localhost:3000";

  // --- STATE ---
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);

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

  const chatboxRef = useRef<HTMLDivElement>(null);

  // --- EFFECTS ---

  // Tự động cuộn chatbox xuống dưới
  useEffect(() => {
    chatboxRef.current?.scrollTo({
      top: chatboxRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [chatMessages]);

  // Kiểm tra token khi tải trang
  useEffect(() => {
    const storedToken = localStorage.getItem("auth_token");
    if (storedToken) setToken(storedToken);
  }, []);

  // Fetch dữ liệu user và tài liệu sau khi có token
  useEffect(() => {
    if (!token) return;

    const fetchInitialData = async () => {
      try {
        const userRes = await fetch(`${NESTJS_HTTP_URL}/auth/info`, {
          credentials: "include",
        });
        if (!userRes.ok)
          throw new Error("Session không hợp lệ. Vui lòng đăng nhập lại.");
        const userData = await userRes.json();
        setUser(userData);

        const docsRes = await fetch(`${NESTJS_HTTP_URL}/chatbot/get-files`, {
          method: "POST",
          credentials: "include",
        });
        if (!docsRes.ok) throw new Error("Không thể tải danh sách tài liệu.");
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
      } catch (error: any) {
        console.error("Lỗi khi fetch data:", error);
        handleLogout();
      }
    };

    fetchInitialData();
  }, [token]);

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
    };
    const handleEnd = () => setIsStreaming(false);

    newSocket.on("connect", () => console.log("WebSocket connected."));
    newSocket.on("chatbot.response_chunk", handleChunk);
    newSocket.on("chatbot.response_error", handleError);
    newSocket.on("chatbot.response_end", handleEnd);

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  // --- CÁC HÀM XỬ LÝ ---

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

    const chatHistory = chatMessages
      .slice(-10)
      .map(({ role, content }) => ({ role, content }));
    const payload = { question: prompt, chatHistory };

    setChatMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), role: "user", content: prompt },
    ]);
    setIsStreaming(true);
    setChatMessages((prev) => [
      ...prev,
      { id: (Date.now() + 1).toString(), role: "ai", content: "" },
    ]);

    socket.emit("ask_question", payload);
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

    socket.emit("summarize_document", { fileName: file.id });
  };

  const handleDelete = async (file: Document) => {
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

  // --- GIAO DIỆN ---

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
      <aside className="w-72 bg-white p-4 flex flex-col border-r border-slate-200">
        <h2 className="text-xl font-bold mb-4 text-slate-800 px-2">Tài liệu</h2>

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

        <div className="flex-grow overflow-y-auto space-y-1 pr-2">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="p-2 rounded-md hover:bg-slate-100 group"
            >
              <div className="flex items-center justify-between">
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
                <button
                  onClick={() => handleSummarize(doc)}
                  title="Tóm tắt file này"
                  className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 flex-shrink-0"
                >
                  <Sparkles
                    size={16}
                    className="text-blue-500 hover:text-blue-700"
                  />
                </button>
                <button
                  onClick={() => handleDelete(doc)}
                  title="Xóa file"
                  className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 flex-shrink-0"
                >
                  <Trash2
                    size={16}
                    className="text-red-500 hover:text-red-700"
                  />
                </button>
              </div>
            </div>
          ))}
        </div>

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
          {isStreaming && (
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-blue-600 p-2 rounded-full text-white flex-shrink-0 flex items-center justify-center">
                <Bot size={16} />
              </div>
              <Loader2 className="animate-spin text-slate-500" />
            </div>
          )}
        </div>

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
