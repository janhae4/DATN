"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronRight, LayoutGrid } from "lucide-react";

import {
  useTeam,
  useTeamMembers,
  useDeleteTeam,
  useLeaveTeam,
<<<<<<< HEAD
=======
  useTransferOwnership,
>>>>>>> origin/blank_branch
} from "@/hooks/useTeam";
import { useUserProfile } from "@/hooks/useAuth";
import { MemberRole } from "@/types/common/enums";
import { Skeleton } from "@/components/ui/skeleton";
import { TeamHeader } from "@/components/features/team/team-header";
import { TeamOverviewTab } from "@/components/features/team/team-overview-tab";

<<<<<<< HEAD
=======
import { useTeamTour } from "@/hooks/touring/useTeamTour";

>>>>>>> origin/blank_branch
export default function TeamDetailsPage() {
  const params = useParams();
  const teamId = params.teamId as string;
  const router = useRouter();

  const { data: user } = useUserProfile();
  const {
    data: team,
    isLoading: isTeamLoading,
  } = useTeam(teamId);
  const { data: members = [], isLoading: isMembersLoading } =
    useTeamMembers(teamId);

<<<<<<< HEAD
  const deleteTeamMutation = useDeleteTeam();
  const leaveTeamMutation = useLeaveTeam();
=======
  const { startTour } = useTeamTour();

  const deleteTeamMutation = useDeleteTeam();
  const leaveTeamMutation = useLeaveTeam();
  const transferOwnershipMutation = useTransferOwnership();
>>>>>>> origin/blank_branch

  const currentMember = members.find((m) => m.id === user?.id);
  const userRole = currentMember?.role;
  const isOwner = userRole === MemberRole.OWNER;
  const isAdmin = userRole === MemberRole.ADMIN;
  const canManage = isOwner || isAdmin;

  const handleDelete = async () => {
    try {
      await deleteTeamMutation.mutateAsync(teamId);
      toast.success("Team deleted");
      router.push("/dashboard");
    } catch (error) {
      toast.error("Failed to delete team");
    }
  };

  const handleLeave = async () => {
    if (!user) return;
    try {
      await leaveTeamMutation.mutateAsync({
        teamId,
      });
      toast.success("Left team successfully");
      router.push("/dashboard");
    } catch (error) {
      toast.error("Failed to leave team");
    }
  };

<<<<<<< HEAD
=======
  const handleTransferAndLeave = async (newOwnerId: string) => {
    try {
      await transferOwnershipMutation.mutateAsync({ teamId, newOwnerId });
      await leaveTeamMutation.mutateAsync({ teamId });
      toast.success("Ownership transferred and left team");
      router.push("/dashboard");
    } catch (error) {
      toast.error("Failed to transfer and leave");
    }
  };

>>>>>>> origin/blank_branch
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
<<<<<<< HEAD
          onSettingsClick={() => router.push(`/team/${teamId}/settings`)}
=======
          onTransferOwnership={handleTransferAndLeave}
          onSettingsClick={() => router.push(`/team/${teamId}/settings`)}
          onStartTour={startTour}
          members={members}
>>>>>>> origin/blank_branch
        />

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <TeamOverviewTab teamId={teamId} members={members} />
        </div>
      </div>
    </div>
  );
}
