"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTeams, useTeamMembers, useDeleteTeam, useLeaveTeam } from "@/hooks/useTeam";
import { useUserProfile } from "@/hooks/useAuth";
import { Team } from "@/types/social/team.interface";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Calendar, Search, Plus, Frown, MoreHorizontal, ShieldCheck, Trash2, LogOut, Settings } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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

// --- Sub-component: TeamCard ---

interface TeamCardProps {
  team: Team;
  currentUserId?: string;
  onDelete: (teamId: string) => void;
  onLeave: (teamId: string) => void;
}

function TeamCard({ team, currentUserId, onDelete, onLeave }: TeamCardProps) {
  const router = useRouter();
  const { data: members = [], isLoading: isLoadingMembers } = useTeamMembers(team.id);

  const isOwner = team.ownerId === currentUserId;
  const owner = members.find((m) => m && m.user && m.user.id === team.ownerId)?.user;

  const handleCardClick = () => {
    router.push(`/team/${team.id}`);
  };

  return (
    <Card
      className="group hover:shadow-lg hover:border-primary/50 transition-all duration-300 flex flex-col cursor-pointer h-full"
      onClick={handleCardClick}
    >
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 rounded-xl border bg-gradient-to-br from-primary/10 to-primary/5 text-primary">
            <AvatarImage src={team.avatar || `https://avatar.vercel.sh/${team.name}.png`} />
            <AvatarFallback className="rounded-xl font-bold">
              {team.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <h3 className="font-semibold leading-none tracking-tight truncate max-w-[150px]" title={team.name}>
              {team.name}
            </h3>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-primary/70" />
              <span className="truncate max-w-[100px]">
                {owner?.name || "Unknown Owner"}
              </span>
            </div>
          </div>
        </div>

        <div onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => router.push(`/${team.id}`)}>
                View Dashboard
              </DropdownMenuItem>
              
              {isOwner ? (
                <>
                  <DropdownMenuItem onClick={() => router.push(`/${team.id}/settings`)}>
                    <Settings className="mr-2 h-4 w-4" />
                    Team Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => onDelete(team.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Team
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                   <DropdownMenuSeparator />
                   <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => onLeave(team.id)}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Leave Team
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="flex-1">
        <div className="flex items-center justify-between mt-4">
          <Badge
            variant={team.status === "ACTIVE" ? "default" : "secondary"}
            className={`rounded-md px-2.5 py-0.5 text-xs font-medium ${
              team.status === "ACTIVE"
                ? "bg-green-500/15 text-green-700 hover:bg-green-500/25 dark:text-green-400"
                : ""
            }`}
          >
            {team.status}
          </Badge>

          <div className="flex -space-x-2.5 overflow-hidden pl-1">
            {isLoadingMembers ? (
               <Skeleton className="h-7 w-20 rounded-full" />
            ) : (
              <TooltipProvider delayDuration={100}>
                {members
                  .filter((m) => m && m.user)
                  .slice(0, 4)
                  .map((member) => (
                    <Tooltip key={member.id}>
                      <TooltipTrigger asChild>
                        <Avatar className="inline-block h-7 w-7 rounded-full ring-2 ring-background cursor-pointer hover:z-10 transition-transform hover:scale-110">
                          <AvatarImage src={member.user?.avatar} />
                          <AvatarFallback className="text-[9px] bg-muted">
                            {member.user?.name?.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="font-medium text-xs">{member.user?.name ?? "Unknown"}</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
              </TooltipProvider>
            )}
            
            {!isLoadingMembers && members.length > 4 && (
              <div className="flex h-7 w-7 items-center justify-center rounded-full ring-2 ring-background bg-muted text-[10px] font-medium text-muted-foreground hover:bg-muted/80 transition-colors cursor-default">
                +{members.length - 4}
              </div>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between text-xs text-muted-foreground border-t bg-muted/20 p-3 group-hover:bg-muted/40 transition-colors pt-3">
        <div className="flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5" />
          <span>{isLoadingMembers ? "..." : members.length} members</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5" />
          <span>{new Date(team.createdAt).toLocaleDateString()}</span>
        </div>
      </CardFooter>
    </Card>
  );
}

// --- Main Component: AllTeams ---

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
        requesterId: user.id
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