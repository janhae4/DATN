"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useProjects } from "@/hooks/useProjects";
import { useTeamContext } from "@/contexts/TeamContext";
import { useTeams } from "@/hooks/useTeam";

function RedirectToDefaultProject({ teamId }: { teamId: string }) {
  const router = useRouter();
  const { projects, isLoading } = useProjects(teamId);
  useEffect(() => {
    if (isLoading) return;

    if (projects && projects.length > 0) {
      router.replace(`/${teamId}/${projects[0].id}/dashboard`);
    } else {
      router.replace(`/${teamId}`);
    }
  }, [projects, isLoading, teamId, router]);
  return (
    <div className="h-screen w-full flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">
          Redirecting to your workspace...
        </p>
      </div>
    </div>
  );
}

export function TeamGuard({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const router = useRouter();
  const teamId = params.teamId as string | undefined;

  const { data: teams, isLoading, isRefetching } = useTeams();
  const { setActiveTeam } = useTeamContext();
  const currentTeam = teams?.find((t) => t.id === teamId)

  const shouldRedirect =
    !!teamId &&
    !isLoading &&
    Array.isArray(teams) &&
    teams.length > 0 &&
    !currentTeam;

  useEffect(() => {
    if (isLoading || teams === undefined) return;

    if (Array.isArray(teams) && teams.length === 0) {
      router.push("/team-create");
      return;
    }

    if (currentTeam) {
      setActiveTeam(currentTeam);
    }
  }, [teams, isLoading, currentTeam, setActiveTeam]);

  if (!teamId) {
    return <>{children}</>;
  }

  if (isLoading || teams === undefined) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (shouldRedirect && teams && teams.length > 0) {
    const defaultTeam = teams[0];
    return <RedirectToDefaultProject teamId={defaultTeam.id} />;
  }

  if (currentTeam) {
    return <>{children}</>;
  }

  return null;
}
