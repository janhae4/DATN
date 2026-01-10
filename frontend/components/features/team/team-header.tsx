"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Team } from "@/types/social";
import { MemberRole, TeamStatus } from "@/types/common/enums";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Settings,
  LogOut,
  Trash2,
  Users,
  ShieldCheck,
  CalendarDays,
  MoreVertical,
  Plus,
  HelpCircle
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { CreateProjectModal } from "../project/CreateProjectModal";
import { AddMemberDialog } from "./AddMemberDialog";

interface TeamHeaderProps {
  team?: Team;
  memberCount: number;
  isLoading: boolean;
  isOwner: boolean;
  canManage: boolean;
  onDelete: () => void;
  onLeave: () => void;
  onSettingsClick: () => void;
  onStartTour?: () => void;
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
  onStartTour,
}: TeamHeaderProps) {
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const params = useParams();
  const teamId = params?.teamId as string;

  if (isLoading || !team) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full rounded-xl" />
        <div className="flex gap-4 px-4">
          <Skeleton className="h-24 w-24 rounded-full -mt-12 border-4 border-background" />
          <div className="space-y-2 pt-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      </div>
    );
  }

  const createdDate = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <>
      <div className="group relative w-full bg-card rounded-xl border shadow-sm overflow-hidden">
        {/* Cover Background */}
        <div className="relative h-40 w-full bg-gradient-to-r from-blue-600/10 via-purple-500/10 to-pink-500/10">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

          {/* Action Menu (Top Right) */}
          <div className="absolute top-4 right-4 z-10">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="icon" className="h-8 w-8 bg-background/50 backdrop-blur-sm hover:bg-background border shadow-sm">
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Team Options</DropdownMenuLabel>

                {canManage && (
                  <DropdownMenuItem onClick={onSettingsClick} className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={() => setIsAlertOpen(true)}
                  className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                >
                  {isOwner ? (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      <span>Delete Team</span>
                    </>
                  ) : (
                    <>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Leave Team</span>
                    </>
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="px-6 pb-6">
          <div id="team-header">
            {/* Main Layout: Stack on Mobile, Row on Desktop */}
            <div className="flex flex-col md:flex-row gap-6">

              {/* 1. Avatar Section */}
              <div className="relative -mt-12 shrink-0 self-start">
                <Avatar className="h-28 w-28 rounded-2xl border-[6px] border-background shadow-md bg-background">
                  <AvatarImage src={team.avatar} className="object-cover" />
                  <AvatarFallback className="text-3xl font-bold bg-primary/10 text-primary rounded-2xl">
                    {team.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className={cn(
                  "absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-background",
                  team.status === TeamStatus.ACTIVE ? "bg-green-500" : "bg-gray-400"
                )} />
              </div>

              {/* 2. Info Section (Chiếm phần lớn không gian) */}
              <div className="flex-1 pt-0 md:pt-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold tracking-tight text-foreground line-clamp-1">
                      {team.name}
                    </h1>
                    {isOwner && (
                      <Badge variant="secondary" className="shrink-0 text-xs px-2 py-0.5 h-6 gap-1 font-normal bg-blue-500/10 text-blue-600 border-0">
                        <ShieldCheck className="h-3 w-3" /> Owner
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Users className="h-4 w-4" />
                      <span>{memberCount} members</span>
                    </div>
                    <div className="hidden sm:block w-1 h-1 rounded-full bg-border" />
                    <div className="flex items-center gap-1.5">
                      <CalendarDays className="h-4 w-4" />
                      <span>Created {createdDate}</span>
                    </div>
                  </div>
                </div>
              </div>


              <div className="flex flex-col items-center sm:flex-row gap-3 mt-2 md:mt-4 md:ml-auto shrink-0">
                <AddMemberDialog teamId={teamId}>
                  <Button variant="outline" className="w-full sm:w-auto shadow-sm">
                    <Users className="mr-2 h-4 w-4" /> Invite Member
                  </Button>
                </AddMemberDialog>

                <CreateProjectModal>
                  <Button className="w-full sm:w-auto shadow-sm">
                    <Plus className="mr-2 h-4 w-4" /> New Project
                  </Button>
                </CreateProjectModal>

                {onStartTour && (
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 shadow-sm"
                    onClick={onStartTour}
                    title="Take a tour"
                  >
                    <HelpCircle className="h-4 w-4" />
                  </Button>
                )}
              </div>

            </div>
          </div>
        </div>

      </div>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
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
              onClick={() => {
                isOwner ? onDelete() : onLeave();
                setIsAlertOpen(false);
              }}
              className={isOwner ? "bg-red-600 hover:bg-red-700" : ""}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}