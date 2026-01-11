"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useProjects } from "@/hooks/useProjects";
import { EmptyProjectState } from "@/components/features/project/EmptyProjectState";
import { Skeleton } from "@/components/ui/skeleton";

function DefaultTeamPage() {
  const router = useRouter();
  const params = useParams();
  const teamId = params.teamId as string;

  const { projects, isLoading } = useProjects(teamId);

  useEffect(() => {
    if (!isLoading && projects && projects.length > 0) {
      const firstProjectId = projects[0].id;
      router.replace(`/${teamId}/${firstProjectId}/dashboard`);
    }
  }, [isLoading, projects, teamId, router]);

  if (isLoading) {
    return (
      <div className="p-8 space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] items-center justify-center">
      <EmptyProjectState />
    </div>
  );
}

export default DefaultTeamPage;
