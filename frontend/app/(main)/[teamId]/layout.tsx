"use client";

import { useTeam, useTeams } from "@/hooks/useTeam";
import AccessDeniedState from "@/components/features/team/AccessDenied";
import { TeamProvider } from "@/contexts/TeamContext";
import { TeamGuard } from "@/providers/team-guard";
import { Skeleton } from "@/components/ui/skeleton";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { AxiosError } from "axios";

const isValidUUID = (id: string) => {
  const regex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return regex.test(id);
};

export default function TeamLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const router = useRouter();
  const teamId = params.teamId as string;
  const isUUID = isValidUUID(teamId);

  const {
    data: team,
    isLoading: isLoadingTeam,
    error,
  } = useTeam(isUUID ? teamId : null);

  const { data: teams = [], isLoading: isLoadingTeams } = useTeams();

  useEffect(() => {
    if (isLoadingTeam || isLoadingTeams) return;

    if (!isUUID || !team) {
      if (teams.length > 0) {
        router.replace(`/${teams[0].id}`);
      } else {
        router.replace("/team-create");
      }
    }
  }, [isUUID, team, teams, isLoadingTeam, isLoadingTeams, router]);

  if (isLoadingTeam || isLoadingTeams || (!isUUID && !team)) {
    return (
      <div className="p-6 space-y-4 h-screen w-full bg-background">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-md" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-[200px] w-full rounded-xl" />
      </div>
    );
  }

  const isAccessDenied = (error as AxiosError)?.response?.status === 403;
  if (isAccessDenied) {
    return <AccessDeniedState message="You are not a member of this team." />;
  }

  return (
<<<<<<< HEAD
    <TeamProvider>
      <TeamGuard>{children}</TeamGuard>
    </TeamProvider>
=======
    <TeamGuard>{children}</TeamGuard>
>>>>>>> origin/blank_branch
  );
}
