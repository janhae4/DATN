"use client";

import { Team } from "@/types/social";
import { MemberRole, TeamStatus } from "@/types/common/enums";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Settings, LogOut, Trash2, Users } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";

interface TeamHeaderProps {
  team?: Team;
  memberCount: number;
  isLoading: boolean;
  isOwner: boolean;
  canManage: boolean;
  onDelete: () => void;
  onLeave: () => void;
  onSettingsClick: () => void;
}

export function TeamHeader({
  team,
  memberCount,
  isLoading,
  isOwner,
  canManage,
  onDelete,
  onLeave,
  onSettingsClick,
}: TeamHeaderProps) {
  if (isLoading || !team) {
    return <Skeleton className="h-48 w-full rounded-xl" />;
  }

  return (
    <div className="relative mb-8 group">
      {/* Cover Background */}
      <div className="absolute inset-0 h-32 bg-gradient-to-r from-blue-600/20 via-purple-500/20 to-pink-500/20 rounded-t-xl -z-10" />
      
      <div className="pt-16 px-6 pb-6 flex flex-col md:flex-row items-end md:items-center justify-between gap-6">
        <div className="flex items-end gap-5">
          <Avatar className="h-24 w-24 rounded-2xl border-4 border-background shadow-sm">
            <AvatarImage src={team.avatar} />
            <AvatarFallback className="text-3xl font-bold bg-secondary text-secondary-foreground rounded-2xl">
              {team.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="mb-2 space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">{team.name}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant={team.status === TeamStatus.ACTIVE ? "default" : "secondary"} className="rounded-md">
                {team.status}
              </Badge>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted/50">
                <Users className="h-3.5 w-3.5" />
                {memberCount} members
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-2">
          {canManage && (
            <Button variant="outline" size="sm" onClick={onSettingsClick} className="shadow-sm">
              <Settings className="mr-2 h-4 w-4" /> Settings
            </Button>
          )}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              {isOwner ? (
                <Button variant="destructive" size="sm" className="shadow-sm">
                  <Trash2 className="mr-2 h-4 w-4" /> Delete Team
                </Button>
              ) : (
                <Button variant="secondary" size="sm" className="text-destructive hover:bg-destructive/10 shadow-sm">
                  <LogOut className="mr-2 h-4 w-4" /> Leave Team
                </Button>
              )}
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{isOwner ? "Delete Team?" : "Leave Team?"}</AlertDialogTitle>
                <AlertDialogDescription>
                  {isOwner 
                    ? "This action is irreversible. All messages, tasks, and data will be permanently deleted." 
                    : "You will lose access to all private channels and projects in this team."}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={isOwner ? onDelete : onLeave} 
                  className={isOwner ? "bg-destructive hover:bg-destructive/90" : ""}
                >
                  Confirm
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}