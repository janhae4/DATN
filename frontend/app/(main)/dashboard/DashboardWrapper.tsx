"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTeamContext } from "@/contexts/TeamContext";
import { useProjects } from "@/hooks/useProjects";
import { EmptyProjectState } from "@/components/features/project/EmptyProjectState";
import { TabsNav } from "@/components/tabsNav";
import { TaskManagementProvider } from "@/components/providers/TaskManagementContext";
import { Loader2 } from "lucide-react";

export function DashboardWrapper() {
  const { activeTeam } = useTeamContext();
  const { projects, isLoading } = useProjects(activeTeam?.id);
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const projectId = searchParams.get("projectId");

  // Effect to auto-select first project if none selected but projects exist
  React.useEffect(() => {
    if (!isLoading && projects.length > 0 && !projectId) {
      router.replace(`/dashboard?projectId=${projects[0].id}`);
    }
  }, [isLoading, projects, projectId, router]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (projects.length === 0) {
    return <EmptyProjectState />;
  }

  // If we have projects but no projectId yet (and effect hasn't run), show loading or nothing
  if (!projectId) {
    return null; 
  }

  return (
    <TaskManagementProvider projectId={projectId}>
      <TabsNav />
    </TaskManagementProvider>
  );
}
