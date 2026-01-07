"use client";

import * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TimelineView from "./features/timeline/TimelineView";
import dynamic from "next/dynamic";
import { Loader2, HelpCircle } from "lucide-react";
import { Skeleton } from "./ui/skeleton";
import { BacklogSkeleton } from "./skeletons/BackLogSkeleton";
import { KanbanSkeleton } from "./skeletons/KanbanSkeleton";
import { SummarySkeleton } from "./skeletons/SummarySkeleton";
import { Button } from "@/components/ui/button";
import { useDashboardTour } from "@/hooks/useDashboardTour";

const Summary = dynamic(() => import("./features/summary/summary"), {
  loading: () => <SummarySkeleton />,
});
const Backlogs = dynamic(() => import("./features/backlogs/backlogs"), {
  loading: () => <BacklogSkeleton />,
});

const KanbanBoard = dynamic(
  () => import("./features/boards/KanbanBoard").then((mod) => mod.KanbanBoard),
  {
    loading: () => <KanbanSkeleton />,
    ssr: false,
  }
);

const GanttChart = dynamic(() => import("./shared/ganttchart/ganttChart"), {
  loading: () => <GenericTabSkeleton />,
  ssr: false,
});

// const TimelineView = dynamic(() => import("./features/timeline/TimelineView"), { ssr: false })

function getTabFromHash(): string {
  if (typeof window === "undefined") return "backlogs";
  const hash = window.location.hash.replace("#", "");
  if (["backlogs", "summary", "boards", "timeline"].includes(hash)) {
    return hash;
  }
  return "backlogs";
}

const GenericTabSkeleton = () => (
  <div className="p-4 space-y-4">
    <Skeleton className="h-8 w-1/3" />
    <div className="grid grid-cols-2 gap-4">
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  </div>
);

export function TabsNav() {
  const [activeTab, setActiveTab] = React.useState<string>("backlogs");
  const { startTour } = useDashboardTour();

  React.useEffect(() => {
    // Set initial tab from hash on mount
    setActiveTab(getTabFromHash());

    const handleHashChange = () => {
      setActiveTab(getTabFromHash());
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.hash = value;
      window.history.replaceState(null, "", url.toString());
    }
  };

  return (
    <div className="flex w-full h-full flex-col gap-6 overflow-hidden">
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="h-full flex flex-col w-full"
      >
        <div className="flex items-center justify-between gap-4">
          <TabsList id="dashboard-tabs-list">
            <TabsTrigger id="tab-backlogs" value="backlogs">Backlogs</TabsTrigger>
            <TabsTrigger id="tab-summary" value="summary">Summary</TabsTrigger>
            <TabsTrigger id="tab-boards" value="boards">Boards</TabsTrigger>
            <TabsTrigger id="tab-timeline" value="timeline">Timeline</TabsTrigger>
          </TabsList>
          <Button
            variant="outline"
            size="sm"
            onClick={startTour}
            className="hidden md:flex items-center gap-2"
          >
            <HelpCircle className="h-4 w-4" />
            <span>Tour</span>
          </Button>
        </div>
        <TabsContent
          value="backlogs"
          className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-secondary scrollbar-track-transparent"
        >
          <Backlogs />
        </TabsContent>
        <TabsContent value="summary" className="flex-1 overflow-y-auto">
          <Summary />
        </TabsContent>
        <TabsContent value="boards" className="flex-1 overflow-hidden min-w-0">
          <KanbanBoard />
        </TabsContent>
        <TabsContent
          value="timeline"
          className="flex-1 h-full  overflow-y-auto scrollbar-thin scrollbar-thumb-secondary scrollbar-track-transparent"
        >
          {/* <TimelineView /> */}
          <GanttChart />
        </TabsContent>
      </Tabs>
    </div>
  );
}
