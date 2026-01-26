"use client";

import { useTeamContext } from "@/contexts/TeamContext";
import { useTeamMembers } from "@/hooks/useTeam";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Frown } from "lucide-react";

export default function AllMembers() {
  const { activeTeam, isLoading: isTeamsLoading } = useTeamContext();
  const { data: members = [], isLoading: isMembersLoading } = useTeamMembers(
    activeTeam?.id ?? null
  );

  const isLoading = isTeamsLoading || isMembersLoading;

  return (
    <div className="flex-1 h-full p-6 overflow-y-auto bg-background">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">All Members</h2>
          <p className="text-muted-foreground text-sm">
            Directory of all members in the current team
          </p>
        </div>
      </div>

      {/* No active team selected */}
      {!activeTeam && !isLoading && (
        <div className="flex h-[300px] items-center justify-center border border-dashed rounded-lg bg-muted/10">
          <div className="text-center space-y-2">
            <p className="font-medium">No team selected</p>
            <p className="text-sm text-muted-foreground">
              Please select a team on the left sidebar to view its members.
            </p>
          </div>
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading && (
        <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {[...Array(10)].map((_, i) => (
            <Card
              key={i}
              className="overflow-hidden border-muted/60"
            >
              <CardHeader className="p-0 border-b h-24">
                <Skeleton className="h-full w-full rounded-none" />
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && activeTeam && members.length === 0 && (
        <div className="flex flex-col items-center justify-center h-[300px] border border-dashed rounded-lg bg-muted/10 text-center">
          <div className="p-4 rounded-full bg-muted mb-4">
            <Frown className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg">No members found</h3>
          <p className="text-muted-foreground text-sm max-w-sm mt-1">
            This team currently has no members. Invite people to collaborate with you.
          </p>
        </div>
      )}

      {!isLoading && activeTeam && members.length > 0 && (
        <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {members.map((member) => (
            <Card
              key={member.id}
              className="overflow-hidden hover:shadow-lg transition-all duration-200 border-muted/60 cursor-pointer group"
            >
              <CardHeader className="p-0 border-b h-24">
                <div className="w-full h-full overflow-hidden">
                  <Avatar className="h-full w-full rounded-none">
                    <AvatarImage
                      src={member.avatar}
                      alt={member.name ?? "Member"}
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <AvatarFallback className="rounded-none text-2xl bg-muted">
                      {(member.name ?? "?")
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </CardHeader>

              <CardContent className="p-4 text-center">
                <h3 className="font-semibold truncate">
                  {member.name ?? "Unknown"}
                </h3>
                <p className="text-sm text-muted-foreground truncate">
                  {member.email ?? "No email"}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
