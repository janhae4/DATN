"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTeams, useDeleteTeam, useLeaveTeam } from "@/hooks/useTeam";
import { useUserProfile } from "@/hooks/useAuth";
import { Search, Plus, Frown,  } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import TeamCard from "./teamCard";

export default function AllTeams() {
  const router = useRouter();
  const { data: user } = useUserProfile();
  const { data: teams, isLoading } = useTeams();
  const [searchQuery, setSearchQuery] = useState("");

  const deleteTeamMutation = useDeleteTeam();
  const leaveTeamMutation = useLeaveTeam();

  const [teamToDelete, setTeamToDelete] = useState<string | null>(null);
  const [teamToLeave, setTeamToLeave] = useState<string | null>(null);

  const filteredTeams = useMemo(() => {
    if (!teams) return [];
    if (!searchQuery.trim()) return teams;
    const query = searchQuery.toLowerCase();
    return teams.filter((team) => team.name.toLowerCase().includes(query));
  }, [teams, searchQuery]);

  const handleDeleteTeam = async () => {
    if (!teamToDelete) return;
    try {
      await deleteTeamMutation.mutateAsync(teamToDelete);
      toast.success("Team deleted successfully");
    } catch (error) {
      toast.error("Failed to delete team");
    } finally {
      setTeamToDelete(null);
    }
  };

  const handleLeaveTeam = async () => {
    if (!teamToLeave || !user) return;
    try {
      await leaveTeamMutation.mutateAsync({
        teamId: teamToLeave,
      });
      toast.success("Left team successfully");
    } catch (error) {
      toast.error("Failed to leave team");
    } finally {
      setTeamToLeave(null);
    }
  };

  if (isLoading || !teams) {
    return (
      <div className="flex-1 h-full p-6 bg-background space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-[200px] rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 h-full p-6 overflow-y-auto bg-background animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">All Teams</h2>
          <p className="text-muted-foreground">Manage and collaborate with your squads.</p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search teams..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button onClick={() => router.push("/team-create")}>
            <Plus className="mr-2 h-4 w-4" /> Create Team
          </Button>
        </div>
      </div>

      {filteredTeams.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[400px] border border-dashed rounded-lg bg-muted/10 text-center animate-in zoom-in-95 duration-300">
          <div className="p-4 rounded-full bg-muted mb-4">
            <Frown className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg">No teams found</h3>
          <p className="text-muted-foreground text-sm max-w-sm mt-1 mb-4">
            We couldn't find any teams matching "{searchQuery}". Try a different keyword or create a new one.
          </p>
          <Button variant="outline" onClick={() => setSearchQuery("")}>
            Clear Search
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredTeams.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              currentUserId={user?.id}
              onDelete={setTeamToDelete}
              onLeave={setTeamToLeave}
            />
          ))}
        </div>
      )}

      <AlertDialog open={!!teamToDelete} onOpenChange={(open) => !open && setTeamToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the team and remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTeam} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Team
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!teamToLeave} onOpenChange={(open) => !open && setTeamToLeave(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave this team?</AlertDialogTitle>
            <AlertDialogDescription>
              You will lose access to all team projects and channels. You will need to be re-invited to join again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLeaveTeam}>
              Confirm Leave
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}