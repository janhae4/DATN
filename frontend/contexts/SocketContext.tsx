"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@/contexts/AuthContext"; // Import AuthContext của bạn

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4001";

interface SocketContextType {
  socket: Socket | null;
  chatSocket: Socket | null;
  voiceSocket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const { user, isLoading } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [chatSocket, setChatSocket] = useState<Socket | null>(null);
  const [voiceSocket, setVoiceSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      if (socket) {
        console.log("User logged out, disconnecting sockets...");
        socket.disconnect();
        chatSocket?.disconnect();
        setSocket(null);
        setChatSocket(null);
        setIsConnected(false);
      }
      return;
    }

    if (!socket) {
      console.log("Initializing socket connections for user:", user.id);

      // Root Namespace Socket
      const newSocket = io(SOCKET_URL, {
        withCredentials: true,
        transports: ["websocket"],
      });

      // Chat Namespace Socket
      const newChatSocket = io(`${SOCKET_URL}/chat`, {
        withCredentials: true,
        transports: ["websocket"],
      });

      // Voice Namespace Socket
      const newVoiceSocket = io(`${SOCKET_URL}/voice`, {
        withCredentials: true,
        transports: ["websocket"],
      });

      newSocket.on("connect", () => {
        console.log("Main Socket connected:", newSocket.id);
        setIsConnected(true);
      });

      newChatSocket.on("connect", () => {
        console.log("Chat Socket connected:", newChatSocket.id);
      });

      newVoiceSocket.on("connect", () => {
        console.log("Voice Socket connected:", newVoiceSocket.id);
      });

      newSocket.on("disconnect", () => setIsConnected(false));

      setSocket(newSocket);
      setChatSocket(newChatSocket);
      setVoiceSocket(newVoiceSocket);
    }
  }, [user, isLoading, socket, chatSocket]);

  const value = {
    socket,
    chatSocket,
    voiceSocket,
    isConnected,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};
