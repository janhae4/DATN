import { useRouter } from "next/navigation";
import { useTeamMembers, } from "@/hooks/useTeam";
import { Team } from "@/types/social/team.interface";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Calendar, MoreHorizontal, ShieldCheck, Trash2, LogOut, Settings, MoreVertical } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
import { formatDistanceToNow } from "date-fns";

interface TeamCardProps {
    team: Team;
    currentUserId?: string;
    onDelete: (teamId: string) => void;
    onLeave: (teamId: string) => void;
}

export default function TeamCard({ team, currentUserId, onDelete, onLeave }: TeamCardProps) {
    const router = useRouter();
    const { data: members = [], isLoading: isLoadingMembers } = useTeamMembers(team.id);

    const isOwner = team.ownerId === currentUserId;
    const owner = members.find((m) => m && m.role === "OWNER");
    const handleCardClick = () => {
        router.push(`/team/${team.id}`);
    };

    return (
        <div onClick={handleCardClick} className="group cursor-pointer relative flex flex-col justify-between h-full rounded-xl border border-border bg-card text-card-foreground shadow-sm transition-all duration-300  hover:-translate-y-1 hover:border-primary/50">
            {/* 1. Card Header & Actions */}
            <div className="p-6 pb-2">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex gap-2 items-center">

                        {/* Avatar / Icon Placeholder */}
                        <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary font-bold text-xl">
                            {team.name.substring(0, 2).toUpperCase()}

                        </div>
                        
                        {/* Title & Description */}
                        <h3 className="font-semibold text-lg leading-none tracking-tight group-hover:text-primary transition-colors">
                            {team.name}
                        </h3>
                    </div>

                    {/* Action Menu */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreVertical className="h-4 w-4" />
                                <span className="sr-only">Menu</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => console.log("Navigate to settings")}>
                                <Settings className="mr-2 h-4 w-4" /> Manage Team
                            </DropdownMenuItem>
                            {isOwner ? (
                                <DropdownMenuItem
                                    onClick={() => onDelete(team.id)}
                                    className="text-destructive focus:text-destructive"
                                >
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete Team
                                </DropdownMenuItem>
                            ) : (
                                <DropdownMenuItem
                                    onClick={() => onLeave(team.id)}
                                    className="text-destructive focus:text-destructive"
                                >
                                    <LogOut className="mr-2 h-4 w-4" /> Leave Team
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>


                <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
                    {team.description || "No description provided for this team."}
                </p>
            </div>

            {/* 2. Card Footer / Meta Info */}
            <div className="p-6 pt-0 mt-auto">
                <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-4">
                    <div className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        <span>{team.members?.length || 1} members</span>
                    </div>
                    <div className="flex items-center gap-1">
                        {currentUserId && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div 
                                        className={`px-2 py-0.5 rounded-md text-xs font-medium ${
                                            members.find(m => m?.userId === currentUserId)?.role === 'OWNER'
                                                ? 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800/50'
                                                : members.find(m => m?.userId === currentUserId)?.role === 'ADMIN'
                                                ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50'
                                                : 'bg-gray-500/10 text-gray-700 dark:text-gray-400 border border-gray-200 dark:border-gray-800/50'
                                        }`}
                                    >
                                        {members.find(m => m?.userId === currentUserId)?.role || 'MEMBER'}
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Your role in this team</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                    </div>
                </div>
            </div>

            {/* Decorative colored bar at bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-b-xl" />
        </div>
    );
}