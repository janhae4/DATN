"use client";

import { useState } from "react";
import TeamSidebar from "@/components/features/team/teamSidebar";
import ChatArea from "@/components/features/chat/chatArea";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const ContentLoading = () => (
  <div className="flex h-full w-full items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
  </div>
);

const AllTeams = dynamic(() => import("@/components/features/team/allTeams"), {
  loading: () => <ContentLoading />,
});

const AllMembers = dynamic(
  () => import("@/components/features/team/allMembers"),
  {
    loading: () => <ContentLoading />,
  }
);

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
