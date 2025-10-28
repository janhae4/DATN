"use client";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  ReactNode,
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
};

interface SocketContextType {
  socket: Socket | null;
}

const SocketContext = createContext<SocketContextType>({ socket: null });

export const useSocket = () => useContext(SocketContext);

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider = ({ children }: SocketProviderProps) => {
  const socket = useMemo(() => {
    return io("http://localhost:4001", {
      autoConnect: true,
      transports: ["websocket"],
      withCredentials: true,
    });
  }, []);

  useEffect(() => {
    socket.on("connect", () =>
      console.log("Socket đã kết nối (ID:", socket.id, ")")
    );
    socket.on("disconnect", () => console.log("Socket đã ngắt kết nối."));

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.disconnect();
    };
  }, [socket]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};