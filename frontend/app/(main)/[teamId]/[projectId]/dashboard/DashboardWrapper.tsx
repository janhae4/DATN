"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { useTeamContext } from "@/contexts/TeamContext";
import { useProjects } from "@/hooks/useProjects";
import { TabsNav } from "@/components/tabsNav";
import { TaskManagementProvider } from "@/components/providers/TaskManagementContext";
import { DashboardSkeleton } from "@/components/skeletons/DashboardSkeleton";

export function DashboardWrapper() {
  const { activeTeam } = useTeamContext();
  const { projects, isLoading } = useProjects(activeTeam?.id);
  const params = useParams();
  const router = useRouter();

  const projectId = params.projectId as string | undefined;
  const teamId = params.teamId as string | undefined;
  React.useEffect(() => {
    if (!isLoading && projects.length > 0 && !projectId) {
      router.replace(`/${teamId}/${projects[0].id}/dashboard`);
    }
  }, [isLoading, projects, projectId, router]);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (!projectId) {
    return null;
  }

  return (
    <TaskManagementProvider projectId={projectId} teamId={teamId}>
      <TabsNav />
    </TaskManagementProvider>
  );
}
