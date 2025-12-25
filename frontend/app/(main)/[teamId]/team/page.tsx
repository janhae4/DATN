"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronRight, LayoutGrid } from "lucide-react";

import { 
  useTeam, 
  useTeamMembers, 
  useDeleteTeam, 
  useLeaveTeam 
} from "@/hooks/useTeam";
import { useUserProfile } from "@/hooks/useAuth";
import { MemberRole } from "@/types/common/enums";
import { Skeleton } from "@/components/ui/skeleton";
import { TeamHeader } from "@/components/features/team/team-header";
import { TeamOverviewTab } from "@/components/features/team/team-overview-tab";

export default function TeamDetailsPage() {
  const params = useParams();
  const teamId = params.teamId as string;
  const router = useRouter();
  
  // Data Fetching
  const { data: user } = useUserProfile();
  const { data: team, isLoading: isTeamLoading } = useTeam(teamId);
  const { data: members = [], isLoading: isMembersLoading } = useTeamMembers(teamId);

  // Mutations
  const deleteTeamMutation = useDeleteTeam();
  const leaveTeamMutation = useLeaveTeam();

  // Permissions
  const currentMember = members.find(m => m.userId === user?.id);
  const userRole = currentMember?.role;
  const isOwner = userRole === MemberRole.OWNER;
  const isAdmin = userRole === MemberRole.ADMIN;
  const canManage = isOwner || isAdmin;

  // Handlers
  const handleDelete = async () => {
    try {
      await deleteTeamMutation.mutateAsync(teamId);
      toast.success("Team deleted");
      router.push("/team-create");
    } catch (error) {
      toast.error("Failed to delete team");
    }
  };

  const handleLeave = async () => {
    if (!user) return;
    try {
      await leaveTeamMutation.mutateAsync({
        teamId,
        requesterId: user.id,
      });
      toast.success("Left team successfully");
      router.push("/team-create");
    } catch (error) {
      toast.error("Failed to leave team");
    }
  };

  // Loading State
  if (isTeamLoading || isMembersLoading) {
    return (
      <div className="flex-1 p-6 space-y-6 bg-background/50">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-48 w-full rounded-xl" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="p-10 text-center text-muted-foreground">
        Team not found
      </div>
    );
  }

  return (
    <div className="flex-1 h-full overflow-y-auto bg-background/50">
      <div className="container max-w-7xl mx-auto px-2 space-y-6">
        <TeamHeader
          team={team}
          memberCount={members.length}
          isLoading={false}
          isOwner={isOwner}
          canManage={canManage}
          onDelete={handleDelete}
          onLeave={handleLeave}
          onSettingsClick={() => router.push(`/team/${teamId}/settings`)}
        />

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <TeamOverviewTab teamId={teamId} members={members} />
        </div>
      </div>
    </div>
  );
};

