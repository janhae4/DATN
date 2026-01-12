"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { useTeamContext } from "@/contexts/TeamContext";
import { useProjects } from "@/hooks/useProjects";
import { TabsNav } from "@/components/tabsNav";
import { TaskManagementProvider } from "@/components/providers/TaskManagementContext";
import { DashboardSkeleton } from "@/components/skeletons/DashboardSkeleton";

export function DashboardWrapper() {
<<<<<<< HEAD
  // const { activeTeam } = useTeamContext();
  // const { projects, isLoading } = useProjects(activeTeam?.id);
=======
  const { activeTeam } = useTeamContext();
  const { projects, isLoading } = useProjects(activeTeam?.id);
>>>>>>> origin/blank_branch
  const params = useParams();
  const router = useRouter();

  const projectId = params.projectId as string | undefined;
  const teamId = params.teamId as string | undefined;
<<<<<<< HEAD
  // React.useEffect(() => {
  //   if (!isLoading && projects.length > 0 && !projectId) {
  //     router.replace(`/${teamId}/${projects[0].id}/dashboard`);
  //   }
  // }, [isLoading, projects, projectId, router]);

  // if (isLoading) {
  //   return <DashboardSkeleton />;
  // }

  // if (!projectId) {
  //   return null;
  // }
=======
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
>>>>>>> origin/blank_branch

  return (
    <TaskManagementProvider projectId={projectId} teamId={teamId}>
      <TabsNav />
    </TaskManagementProvider>
  );
}
