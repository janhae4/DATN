"use client";

import { Loader2 } from "lucide-react";
import React, { useState, useEffect } from "react";
import { LoginPage } from "./login";
import { ChatComponent } from "./chat";
import { ApiService } from "./api-service";
import { useChatStore } from "./useChatStore";

export default function Page() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const loadInitialConversations = useChatStore(
    (state) => state.loadInitialConversations
  );

  const handleLogout = async () => {
    try {
      await ApiService.logout();
    } catch (error) {
      console.error("Logout failed", error);
    } finally {
      setCurrentUser(null);
      useChatStore.setState({
        visibleConversations: [],
        selectedConversation: null,
        messages: {},
        messagePages: {},
        hasMoreMessages: {},
        metaMap: {},
        currentPage: 0,
        totalPages: 1,
        isLoadingConversations: false,
      }); 
    }
  };

  useEffect(() => {
    const verifyUser = async () => {
      setIsAuthenticating(true);
      try {
        const userInfo = await ApiService.getInfo();
        if (!userInfo) {
          setCurrentUser(null);
          useChatStore.setState({
            visibleConversations: [],
            selectedConversation: null,
            messages: {},
            messagePages: {},
            hasMoreMessages: {},
            metaMap: {},
            currentPage: 0,
            totalPages: 1,
            isLoadingConversations: false,
          });
            setCurrentUser(userInfo);
            loadInitialConversations();
          }
      } catch (error) {
        console.error("Verification failed:", error);
        setCurrentUser(null);
        useChatStore.setState({
          visibleConversations: [],
          selectedConversation: null,
          messages: {},
          messagePages: {},
          hasMoreMessages: {},
          metaMap: {},
          currentPage: 0,
          totalPages: 1,
          isLoadingConversations: false,
        })
      } finally {
        setIsAuthenticating(false); 
      }
    };
    verifyUser();
  }, []); 

  if (isAuthenticating) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <Loader2 className="animate-spin h-8 w-8 text-indigo-600" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <LoginPage
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          loadInitialConversations();
        }}
      />
    );
  }

  return <ChatComponent currentUser={currentUser} onLogout={handleLogout} />;
}
