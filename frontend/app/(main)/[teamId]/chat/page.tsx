"use client";

import React from "react";
import { useParams } from "next/navigation";
import { ChatContainer } from "@/components/features/chat/ChatContainer";

export default function ChatPage() {
  const params = useParams();
  const teamId = params.teamId as string;

  return <ChatContainer teamId={teamId} />;
}
