"use client";

import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { 
  FolderKanban, 
  MessageSquare, 
  Users, 
  Plus, 
  ArrowRight, 
  TrendingUp,
  Activity,
  Zap
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

// Hooks
import { useProjects } from "@/hooks/useProjects";
import { useDiscussions } from "@/hooks/useTeam";
import { TeamMember } from "@/types/social";

// Components
import { TeamAnalytics } from "./team-analytics";
import { AddMemberDialog } from "./AddMemberDialog";
import { CreateProjectModal } from "@/components/features/project/CreateProjectModal";

interface TeamOverviewTabProps {
  teamId: string;
  members: TeamMember[];
}

export function TeamOverviewTab({ teamId, members }: TeamOverviewTabProps) {
  const router = useRouter();

  // Fetch Data
  const { projects, isLoading: isLoadingProjects } = useProjects(teamId);
  const { data: discussions, isLoading: isLoadingDiscussions } = useDiscussions(teamId);

  // Computed Stats
  const activeProjectsCount = projects?.length || 0;
  const discussionsCount = discussions?.length || 0;
  
  const recentDiscussions = discussions?.slice(0, 5) || [];
  const recentProjects = projects?.slice(0, 3) || [];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      
      {/* SECTION 1: WELCOME & ACTIONS */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">Overview of your team's performance and recent activities.</p>
        </div>
        <div className="flex gap-2">
          <AddMemberDialog teamId={teamId}>
            <Button variant="outline">
              <Users className="mr-2 h-4 w-4" /> Invite Member
            </Button>
          </AddMemberDialog>
          <CreateProjectModal>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> New Project
            </Button>
          </CreateProjectModal>
        </div>
      </div>

      {/* SECTION 2: ENHANCED STATS CARDS */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatsCard 
          title="Total Projects" 
          value={activeProjectsCount} 
          icon={FolderKanban} 
          trend="+2 this month"
          trendUp={true}
          description="Active workspaces"
          loading={isLoadingProjects}
        />
        <StatsCard 
          title="Team Members" 
          value={members.length} 
          icon={Users} 
          trend="Stable"
          trendUp={null} // Neutral
          description="Collaborators joined"
          loading={false}
        />
        <StatsCard 
          title="Discussions" 
          value={discussionsCount} 
          icon={MessageSquare} 
          trend="Active now"
          trendUp={true}
          description="Open channels"
          loading={isLoadingDiscussions}
        />
      </div>

      {/* SECTION 3: ANALYTICS CHARTS */}
      <TeamAnalytics members={members} projects={projects || []} />

      <Separator />

      {/* SECTION 4: RECENT LISTS GRID */}
      <div className="grid gap-6 md:grid-cols-2">
        
        {/* RECENT PROJECTS */}
        <Card className="h-full flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <CardTitle className="text-xl">Recent Projects</CardTitle>
              <CardDescription>Recently accessed projects.</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => router.push(`/team/${teamId}/projects`)}>
              View All <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent className="flex-1">
            {isLoadingProjects ? (
               <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
            ) : recentProjects.length === 0 ? (
               <EmptyState icon={FolderKanban} title="No projects" description="Get started by creating a project." />
            ) : (
              <div className="space-y-4">
                {recentProjects.map((project) => (
                  <div 
                    key={project.id} 
                    onClick={() => router.push(`/project/${project.id}`)}
                    className="flex items-center justify-between p-4 rounded-xl border bg-card/50 hover:bg-accent/50 hover:shadow-sm transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                        {project.icon ? <span className="text-lg">{project.icon}</span> : <Zap className="h-5 w-5" />}
                      </div>
                      <div>
                        <h4 className="font-semibold">{project.name}</h4>
                        <p className="text-xs text-muted-foreground line-clamp-1">{project.description || "No description"}</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-muted/50">{project.visibility}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ACTIVE DISCUSSIONS */}
        <Card className="h-full flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <CardTitle className="text-xl">Discussions</CardTitle>
              <CardDescription>Latest team conversations.</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="text-xs">
              View All <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent className="flex-1 p-0">
             <ScrollArea className="h-[300px] px-6">
                {isLoadingDiscussions ? (
                   <div className="space-y-4 py-2">{[1,2,3,4].map(i => <Skeleton key={i} className="h-12 w-full rounded-full" />)}</div>
                ) : recentDiscussions.length === 0 ? (
                   <div className="py-6"><EmptyState icon={MessageSquare} title="No messages" description="Start chatting with your team." /></div>
                ) : (
                  <div className="space-y-1 py-2">
                    {recentDiscussions.map((discussion) => (
                      <div key={discussion.id} className="p-3 rounded-lg hover:bg-muted/50 transition-colors flex items-start gap-3 cursor-pointer group">
                        <div className="relative">
                          <Avatar className="h-9 w-9 border-2 border-background group-hover:border-muted transition-colors">
                            <AvatarFallback className={discussion.isGroup ? "bg-indigo-100 text-indigo-600" : "bg-emerald-100 text-emerald-600"}>
                               {discussion.isGroup ? <Users className="h-4 w-4" /> : "DM"}
                            </AvatarFallback>
                          </Avatar>
                          {/* Online indicator mock */}
                          <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-background"></span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <p className="text-sm font-medium truncate">{discussion.name || "General Chat"}</p>
                            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                              {discussion.updatedAt ? formatDistanceToNow(new Date(discussion.updatedAt), { addSuffix: true }) : ''}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate group-hover:text-foreground transition-colors">
                             {discussion.latestMessageSnapshot?.content || <span className="italic">No messages yet</span>}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
             </ScrollArea>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

// --- SUB COMPONENTS ---

function StatsCard({ title, value, icon: Icon, description, loading, trend, trendUp }: any) {
  return (
    <Card className="overflow-hidden border-l-4 border-l-primary/20 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="p-2 bg-primary/10 rounded-full">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline justify-between">
          {loading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <div className="text-3xl font-bold tracking-tight">{value}</div>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1">
           {trend && (
             <span className={`text-xs font-medium flex items-center ${trendUp === true ? 'text-green-600' : trendUp === false ? 'text-red-600' : 'text-muted-foreground'}`}>
               {trendUp === true ? <TrendingUp className="h-3 w-3 mr-1" /> : trendUp === false ? <TrendingUp className="h-3 w-3 mr-1 rotate-180" /> : <Activity className="h-3 w-3 mr-1" />}
               {trend}
             </span>
           )}
           <p className="text-xs text-muted-foreground truncate ml-auto">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ icon: Icon, title, description }: any) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground/80">
      <div className="p-3 bg-muted rounded-full mb-3">
         <Icon className="h-5 w-5" />
      </div>
      <h3 className="font-medium text-foreground">{title}</h3>
      <p className="text-xs max-w-[200px]">{description}</p>
    </div>
  );
}