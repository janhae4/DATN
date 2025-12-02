"use client";

import { useState } from "react";
import TeamSidebar from "@/components/features/team/teamSidebar";
import ChatArea from "@/components/features/chat/chatArea";
import AllTeams from "@/components/features/team/allTeams";
import AllMembers from "@/components/features/team/allMembers";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

export default function TeamPage() {
  const [currentView, setCurrentView] = useState<"teams" | "members">("teams");
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  const renderContent = () => {
    switch (currentView) {
      case "teams":
        return <AllTeams />;
      case "members":
        return <AllMembers />;
      default:
        return <AllTeams />;
    }
  };

  return (
    <ResizablePanelGroup
      direction="horizontal"
      className="w-full rounded-lg border md:min-w-[450px] h-[calc(100vh-2rem)]"
    >
      <ResizablePanel
        defaultSize={20}
        minSize={15}
        maxSize={25}
        className="min-w-[250px]"
      >
        <TeamSidebar
          onNavigate={(view) => setCurrentView(view as "teams" | "members")}
          selectedTeamId={selectedTeamId}
          onSelectTeam={setSelectedTeamId}
        />
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize={80}>{renderContent()}</ResizablePanel>
    </ResizablePanelGroup>
  );
}
