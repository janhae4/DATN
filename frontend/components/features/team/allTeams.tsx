"use client";

import { db } from "@/public/mock-data/mock-data";
import { useTeams } from "@/hooks/useTeam";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Calendar, MoreHorizontal, ShieldCheck } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function AllTeams() {
  const { data: teams } = useTeams();
  const members = db.team_members;
  const users = db.users;

  const getTeamMembers = (teamId: string) => {
    const teamMemberEntries = members.filter(m => m.teamId === teamId);
    return teamMemberEntries
      .map(tm => users.find(u => u.id === tm.userId))
      .filter((u): u is typeof users[0] => !!u);
  };

  const getOwner = (ownerId: string) => {
    return users.find(u => u.id === ownerId);
  };

  if (!teams) return <div>Loading...</div>;

  return (
    <div className="flex-1 h-full p-6 overflow-y-auto bg-background">
      <div className="flex items-center justify-between mb-6">
        <div>
            <h2 className="text-2xl font-bold tracking-tight">All Teams</h2>
            <p className="text-muted-foreground text-sm">Manage and view all your teams</p>
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {teams.map((team) => {
            const teamMembers = getTeamMembers(team.id);
            const owner = getOwner(team.ownerId);
            
            return (
              <Card key={team.id} className="group hover:shadow-md transition-all duration-200 border-muted/60 flex flex-col">
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 rounded-lg border bg-primary/5 text-primary">
                        <AvatarImage src={`https://avatar.vercel.sh/${team.name}.png`} />
                        <AvatarFallback className="rounded-lg text-lg">{team.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                        <h3 className="font-semibold leading-none tracking-tight text-base">{team.name}</h3>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <ShieldCheck className="h-3 w-3" />
                            <span>{owner?.name || 'Unknown'}</span>
                        </div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity -mr-2 -mt-2">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem>Manage Members</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">Leave Team</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent className="pb-2 flex-1">
                    <div className="flex items-center justify-between mt-2">
                        <Badge variant={team.status === 'ACTIVE' ? 'default' : 'secondary'} className="rounded-md font-normal px-2.5">
                            {team.status}
                        </Badge>
                        
                        <div className="flex -space-x-2 overflow-hidden">
                          <TooltipProvider>
                            {teamMembers.slice(0, 4).map((member) => (
                              <Tooltip key={member.id}>
                                <TooltipTrigger asChild>
                                  <Avatar className="inline-block h-6 w-6 rounded-full ring-2 ring-background cursor-pointer hover:z-10 transition-transform hover:scale-110">
                                    <AvatarImage src={member.avatar} />
                                    <AvatarFallback className="text-[10px] bg-muted">{member.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                  </Avatar>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{member.name}</p>
                                </TooltipContent>
                              </Tooltip>
                            ))}
                          </TooltipProvider>
                          {teamMembers.length > 4 && (
                             <div className="flex h-6 w-6 items-center justify-center rounded-full ring-2 ring-background bg-muted text-[10px] font-medium text-muted-foreground">
                                +{teamMembers.length - 4}
                             </div>
                          )}
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex items-center justify-between text-xs text-muted-foreground border-t bg-muted/10 p-3">
                    <div className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5" />
                        <span>{teamMembers.length} members</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{new Date(team.createdAt).toLocaleDateString()}</span>
                    </div>
                </CardFooter>
              </Card>
            );
        })}
      </div>
    </div>
  );
}
