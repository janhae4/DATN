// app/notification/page.tsx

"use client";

import React, { useState, useEffect } from "react";
import { Bell, Check, X, Info, Archive } from "lucide-react";
import { io, Socket } from "socket.io-client";

// 1. Định nghĩa kiểu (type)
// (Giữ nguyên như code của bạn)
type NotificationType =
  | "SUCCESS"
  | "ERROR"
  | "INFO"
  | "DOCUMENT"
  | "success"
  | "error"
  | "info"
  | "document";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string; // Nên dùng kiểu Date hoặc string ISO, nhưng 'string' vẫn ổn
  isRead: boolean;
  userId?: string; // Thêm userId để khớp với DTO
}

// 2. Component Icon (Helper)
// (Giữ nguyên như code của bạn)
const NotificationIcon = ({ type }: { type: any }) => {
  switch (type) {
    case "success":
      return <Check className="h-5 w-5 text-green-500" />;
    case "error":
      return <X className="h-5 w-5 text-red-500" />;
    case "info":
      return <Info className="h-5 w-5 text-blue-500" />;
    case "document":
      return <Archive className="h-5 w-5 text-gray-500" />;
    default:
      return <Bell className="h-5 w-5 text-gray-500" />;
  }
};

// 3. Component chính của trang
export default function NotificationPage() {
  // Bắt đầu với mảng rỗng
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const MOCK_USER_ID = "ffadeb5a-a5ad-47af-9de4-ad1fbe9194b9";

  const NOTIFICATION_GATEWAY_URL = "http://localhost:4001";
  const API_GATEWAY_URL = "http://localhost:3000";

  useEffect(() => {
    // TODO: Bạn cần tạo một API endpoint (HTTP GET)
    // để lấy tất cả thông báo cũ từ DB
    async function fetchInitialNotifications() {
      const response = await fetch(
        `${API_GATEWAY_URL}/notification?userId=${MOCK_USER_ID}`
      );
      const data = await response.json();
      setNotifications(data);

      // Tạm thời dùng mock data để demo
      setNotifications([]); // Bắt đầu trống
    }

    fetchInitialNotifications();
  }, []);

  // --- KẾT NỐI WEBSOCKET ---
  useEffect(() => {
    const socket = io(NOTIFICATION_GATEWAY_URL, {
      query: {
        userId: MOCK_USER_ID,
      },
    });

    socket.on("connect", () => {
      console.log("Connected to WebSocket server");
    });

    // Lắng nghe sự kiện 'notification' mà backend gửi
    socket.on(
      "notification",
      (newEvent: Omit<Notification, "id" | "timestamp" | "isRead">) => {
        console.log("Received new notification:", newEvent);

        // Tạo một object notification hoàn chỉnh
        const newNotification: Notification = {
          ...newEvent,
          id: new Date().toISOString(), // Tạo ID tạm thời
          timestamp: "Vừa xong",
          isRead: false,
        };

        // Thêm thông báo mới vào ĐẦU danh sách
        setNotifications((prevNotifications) => [
          newNotification,
          ...prevNotifications,
        ]);
      }
    );

    socket.on("disconnect", () => {
      console.log("Disconnected from WebSocket server");
    });

    // Cleanup: Ngắt kết nối khi component unmount
    return () => {
      socket.disconnect();
    };
  }, [MOCK_USER_ID]);

  // Hàm (ví dụ) để đánh dấu đã đọc
  const markAsRead = (id: string) => {
    // TODO: Gọi API (HTTP PATCH) để cập nhật DB
    fetch(`${API_GATEWAY_URL}/notification/${id}/read`, { method: "PATCH" });

    // Cập nhật local state
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === id ? { ...notif, isRead: true } : notif
      )
    );
  };

  // Hàm (ví dụ) để đánh dấu tất cả đã đọc
  const markAllAsRead = () => {
    // TODO: Gọi API (HTTP POST) để cập nhật DB
    fetch(`${API_GATEWAY_URL}/notification/read-all`, { method: "POST" });

    setNotifications((prev) =>
      prev.map((notif) => ({ ...notif, isRead: true }))
    );
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="mx-auto max-w-3xl">
        {/* Tiêu đề trang và nút "Đánh dấu tất cả đã đọc" */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Thông báo</h1>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              Đánh dấu tất cả đã đọc ({unreadCount})
            </button>
          )}
        </div>

        {/* Danh sách thông báo */}
        <div className="space-y-4">
          {notifications.length === 0 ? (
            <div className="text-center text-gray-500 p-10 bg-white rounded-lg shadow">
              <Bell className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-2">Bạn không có thông báo nào.</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => markAsRead(notif.id)}
                className={`flex cursor-pointer items-start space-x-4 rounded-lg bg-white p-4 shadow transition-all hover:shadow-md ${
                  !notif.isRead
                    ? "border-l-4 border-blue-500"
                    : "border-l-4 border-transparent"
                }`}
              >
                {/* Icon */}
                <div className="mt-1 flex-shrink-0">
                  <NotificationIcon type={notif.type} />
                </div>

                {/* Nội dung */}
                <div className="flex-1">
                  <h3 className="text-md font-semibold text-gray-800">
                    {notif.title}
                  </h3>
                  <p className="text-sm text-gray-600">{notif.message}</p>
                  <p className="mt-2 text-xs text-gray-400">
                    {notif.timestamp}
                  </p>
                </div>

                {/* Chấm "Chưa đọc" */}
                {!notif.isRead && (
                  <div className="flex-shrink-0">
                    <span
                      className="mt-1 block h-3 w-3 rounded-full bg-blue-500"
                      title="Chưa đọc"
                    ></span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
