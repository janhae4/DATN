"use client";

import { useEffect, useState } from "react";
import { ChatSidebar } from "./components/ChatSideBar";
import { ChatWindow } from "./components/ChatWindow";
import { useSocketHandler } from "./hooks/useSocketHandler";
import { useChatStore } from "./store/useChatStore";
import { CurrentUser } from "./types/type";
import { useShallow } from "zustand/shallow";
import { LoginPage } from "./login";
import { Loader2 } from "lucide-react";
import { ApiService } from "./services/api-service";
import { ChatPage } from "./chat";

const resetChatStore = () => {
  useChatStore.setState({
    visibleDiscussions: [],
    selectedDiscussion: null,
    metaMap: {},
    currentPage: 0,
    totalPages: 1,
    isLoadingDiscussions: false,
    messages: [],
    messagePage: 1,
    hasMoreMessages: true,
    isStreamingResponse: false,
    isHistoryLoading: false,
    currentPrompt: "",
    personalAiDiscussionId: null,
  });
};

export default function Page() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const loadInitialConversations = useChatStore(
    (state) => state.loadInitialDiscussions
  );

  const handleLogout = async () => {
    try {
      await ApiService.logout();
    } catch (error) {
      console.error("Logout failed", error);
    } finally {
      setCurrentUser(null);
      resetChatStore();
    }
  };

  useEffect(() => {
    const verifyUser = async () => {
      setIsAuthenticating(true);
      try {
        const userInfo = await ApiService.getInfo();
        if (!userInfo) {
          setCurrentUser(null);
          resetChatStore();
        } else {
          setCurrentUser(userInfo);
          loadInitialConversations("team");
        }
      } catch (error) {
        console.error("Verification failed:", error);
        setCurrentUser(null);
        resetChatStore(); 
      } finally {
        setIsAuthenticating(false);
      }
    };
    verifyUser();
  }, [loadInitialConversations]);

  if (isAuthenticating) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
                <Loader2 className="animate-spin h-8 w-8 text-indigo-600" />   
         {" "}
      </div>
    );
  }

  if (!currentUser) {
    return (
      <LoginPage
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          loadInitialConversations("team");
        }}
      />
    );
  }

  return <ChatPage currentUser={currentUser} onLogout={handleLogout} />;
}
