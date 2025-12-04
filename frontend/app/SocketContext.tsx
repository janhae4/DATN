"use client";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  ReactNode,
  useState,
} from "react";
import { io, Socket } from "socket.io-client";

export const CHATBOT_PATTERN = {
  SUMMARIZE_DOCUMENT: "summarize_document",
  ASK_QUESTION: "ask_question",
  RESPONSE_CHUNK: "chatbot.response_chunk",
  RESPONSE_START: "chatbot.response_start",
  RESPONSE_ERROR: "chatbot.response_error",
  RESPONSE_END: "chatbot.response_end",
  NEW_MESSAGE: "new_message",
  CONVERSATION_STARTED: "conversation_started",
  MESSAGE_SAVED: "message_saved",
  NEW_AI_MESSAGE: "new_ai_message",
};

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({ socket: null, isConnected: false });

export const useSocket = () => useContext(SocketContext);

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider = ({ children }: SocketProviderProps) => {
  const [isConnected, setIsConnected] = useState(false);

  const socket = useMemo(() => {
    return io("http://localhost:4001", {
      autoConnect: true,
      transports: ["websocket"],
      withCredentials: true,
    });
  }, []);

  useEffect(() => {
    const onConnect = () => {
      console.log("✅ Socket connected:", socket.id);
      setIsConnected(true);
    };

    const onDisconnect = () => {
      console.log("❌ Socket disconnected");
      setIsConnected(false);
    };

    const onConnectError = (err: any) => {
      console.error("⚠️ Socket connection error:", err);
      setIsConnected(false);
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.disconnect();
    };
  }, [socket]);

  const contextValue = useMemo(
    () => ({
      socket,
      isConnected,
    }),
    [socket, isConnected]
  );

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};
