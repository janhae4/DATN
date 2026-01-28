"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Pie,
  PieChart,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
  Legend
} from "recharts";
import { format, subMonths, parseISO, formatDistanceToNow, differenceInCalendarMonths, addHours } from "date-fns";
import {
  FolderPlus,
  UserPlus,
  Activity,
  TrendingUp,
  Circle,
  GitCommit
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import { Member, TeamMember } from "@/types/social";
import { Project } from "@/types/project";
import { MemberRole } from "@/types/common/enums";
import { CreateProjectModal } from "@/components/features/project/CreateProjectModal";

// --- CONFIGURATION ---
const COLORS = {
  primary: "hsl(var(--primary))",
  chart1: "#3b82f6", // Blue
  chart2: "#ec4899", // Pink
  pie: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"] 
};

interface TeamAnalyticsProps {
  members: Member[];
  projects: Project[];
}

type ActivityItem = {
  id: string;
  type: 'MEMBER_JOIN' | 'PROJECT_CREATE';
  date: Date;
  title: string;
  subtitle: string;
  user?: { name: string; avatar?: string };
};

// Custom Tooltip cho Area Chart
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border rounded-lg shadow-xl p-3 text-xs">
        <p className="font-semibold mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-muted-foreground capitalize">{entry.name}:</span>
            <span className="font-mono font-medium">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// Helper to ensure date is treated as UTC and adjust to +7 timezone
const ensureUTC = (dateStr: string | undefined) => {
  if (!dateStr) return new Date();

  let date: Date;
  if (dateStr.includes('Z') || /[+-]\d{2}:?\d{2}$/.test(dateStr)) {
    date = parseISO(dateStr);
  } else {
    // If it looks like 'YYYY-MM-DD HH:mm:ss', convert to 'YYYY-MM-DDTHH:mm:ssZ'
    date = parseISO(`${dateStr.replace(' ', 'T')}Z`);
  }

  // Force add 7 hours as requested
  return addHours(date, 7);
};

export function TeamAnalytics({ members, projects }: TeamAnalyticsProps) {

  const { growthData, monthlyPulse } = useMemo(() => {
    const today = new Date();

    const last6Months = Array.from({ length: 6 }, (_, i) => subMonths(today, 5 - i));

    // Stats for pulse calculation
    let newMembersThisMonth = 0;
    let newProjectsThisMonth = 0;

    const data = last6Months.map((date) => {
      const monthStr = format(date, "MMM");
      const isCurrentMonth = differenceInCalendarMonths(today, date) === 0;

      const membersCount = members.filter(m => {
        const joinDate = ensureUTC(m.joinedAt);
        if (isCurrentMonth && differenceInCalendarMonths(today, joinDate) === 0) {
          newMembersThisMonth++;
        }
        return joinDate <= date;
      }).length;

      const projectsCount = projects.filter(p => {
        const createDate = ensureUTC(p.createdAt);
        if (isCurrentMonth && differenceInCalendarMonths(today, createDate) === 0) {
          newProjectsThisMonth++;
        }
        return createDate <= date;
      }).length;

      return {
        name: monthStr,
        members: membersCount,
        projects: projectsCount,
      };
    });

    return {
      growthData: data,
      monthlyPulse: { members: newMembersThisMonth, projects: newProjectsThisMonth }
    };
  }, [members, projects]);

  // 3. ROLE DATA
  const roleData = useMemo(() => {
    const counts = { 
      [MemberRole.OWNER]: 0, 
      [MemberRole.ADMIN]: 0, 
      [MemberRole.MEMBER]: 0,
      [MemberRole.SYSTEM]: 0,
      [MemberRole.AI]: 0
    };
    members.forEach((m) => { 
      if (counts[m.role] !== undefined) counts[m.role]++; 
    });
    return [
      { name: "Owners", value: counts[MemberRole.OWNER] },
      { name: "Admins", value: counts[MemberRole.ADMIN] },
      { name: "Members", value: counts[MemberRole.MEMBER] },
      { name: "System", value: counts[MemberRole.SYSTEM] },
      { name: "AI", value: counts[MemberRole.AI] },
    ].filter(item => item.value > 0);
  }, [members]);

  const recentActivities = useMemo(() => {
    const activities: ActivityItem[] = [];
    members.forEach((m) => {
      if (m.joinedAt) {
        const name = m.name ?? "Unknown";
        activities.push({
          id: `member-${m.id}`,
          type: 'MEMBER_JOIN',
          date: ensureUTC(m.joinedAt),
          title: "Team Member Joined",
          subtitle: `${name} joined as ${m.role.toLowerCase()}`,
          user: { name, avatar: m.avatar }
        });
      }
    });

    projects.forEach(p => {
      if (p.createdAt) {
        activities.push({
          id: `project-${p.id}`,
          type: 'PROJECT_CREATE',
          date: ensureUTC(p.createdAt),
          title: "Project Created",
          subtitle: `New project "${p.name}" initialized`,
        });
      }
    });

    return activities.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 10);
  }, [members, projects]);

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">

      {/* LEFT COLUMN: CHARTS (4/7) */}
      <div className="col-span-4 space-y-6">

        {/* GROWTH CHART CARD */}
        <Card className="shadow-sm border-muted/60">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Growth Trends</CardTitle>
                <CardDescription>Cumulative accumulation over 6 months</CardDescription>
              </div>
              {/* Real Data Pulse */}
              <div className="flex gap-3">
                {monthlyPulse.members > 0 && (
                  <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border-none">
                    <UserPlus className="w-3 h-3 mr-1" /> +{monthlyPulse.members}
                  </Badge>
                )}
                {monthlyPulse.projects > 0 && (
                  <Badge variant="secondary" className="bg-pink-500/10 text-pink-600 hover:bg-pink-500/20 border-none">
                    <FolderPlus className="w-3 h-3 mr-1" /> +{monthlyPulse.projects}
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pl-0 pb-2">
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={growthData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorMembers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.chart1} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={COLORS.chart1} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorProjects" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.chart2} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={COLORS.chart2} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="name"
                    stroke="#888"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                  />
                  <YAxis
                    stroke="#888"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}`}
                  />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                  <RechartsTooltip content={<CustomTooltip />} cursor={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1, strokeDasharray: '4 4' }} />
                  <Area
                    type="monotone"
                    dataKey="members"
                    stroke={COLORS.chart1}
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorMembers)"
                    name="Members"
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="projects"
                    stroke={COLORS.chart2}
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorProjects)"
                    name="Projects"
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* ROLE DONUT CHART */}
          <Card className="flex flex-col shadow-sm border-muted/60">
            <CardHeader className="pb-0">
              <CardTitle className="text-sm font-medium">Role Distribution</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 min-h-[180px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={roleData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {roleData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS.pie[index % COLORS.pie.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              {/* Center Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold">{members.length}</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Members</span>
              </div>
            </CardContent>
            <CardFooter className="pt-0 justify-center gap-4 text-xs text-muted-foreground">
              {roleData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.pie[index % COLORS.pie.length] }} />
                  {entry.name}
                </div>
              ))}
            </CardFooter>
          </Card>

          {/* PULSE SUMMARY CARD */}
          <Card className="flex flex-col justify-between shadow-sm border-muted/60 bg-gradient-to-br from-primary/5 via-transparent to-transparent">
            <CardHeader>
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                <Activity className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-base">Monthly Pulse</CardTitle>
              <CardDescription>Activity in {format(new Date(), 'MMMM')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <UserPlus className="h-4 w-4" /> New Members
                  </span>
                  <span className="font-bold">{monthlyPulse.members}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <FolderPlus className="h-4 w-4" /> New Projects
                  </span>
                  <span className="font-bold">{monthlyPulse.projects}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                {monthlyPulse.members + monthlyPulse.projects > 0
                  ? "Your team is growing and active! 🚀"
                  : "No new activity recorded this month yet."}
              </p>
              <CreateProjectModal>
                <Button size="sm" variant="outline" className="text-xs h-7 px-3">
                  <FolderPlus className="h-3 w-3 mr-1" /> New Project
                </Button>
              </CreateProjectModal>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* RIGHT COLUMN: ACTIVITY FEED (3/7) */}
      <Card className="col-span-3 flex flex-col h-full shadow-sm border-muted/60">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="relative">
                  <GitCommit className="h-5 w-5 text-primary" />
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-primary rounded-full animate-pulse border-2 border-background" />
                </div>
                Activity Log
              </CardTitle>
              <CardDescription>Recent updates timeline</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-0 overflow-hidden">
          <ScrollArea className="h-full px-6">
            <div className="relative border-l border-muted/60 ml-3.5 my-2 space-y-8 pb-8 pt-2">
              {recentActivities.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground space-y-3">
                  <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center">
                    <Activity className="h-6 w-6 opacity-50" />
                  </div>
                  <p className="text-sm">No recent activity recorded.</p>
                </div>
              ) : (
                recentActivities.map((activity) => (
                  <div key={activity.id} className="relative pl-8 group">
                    {/* Custom Timeline Node */}
                    <div className={`absolute -left-[9px] top-0 p-1 rounded-full border bg-background transition-colors ${activity.type === 'MEMBER_JOIN'
                      ? 'border-blue-200 text-blue-500 group-hover:border-blue-500'
                      : 'border-pink-200 text-pink-500 group-hover:border-pink-500'
                      }`}>
                      {activity.type === 'MEMBER_JOIN' ? <UserPlus className="h-3 w-3" /> : <FolderPlus className="h-3 w-3" />}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <p className="text-sm font-semibold text-foreground">{activity.title}</p>
                        <span className="text-[10px] text-muted-foreground font-mono bg-muted/50 px-1.5 py-0.5 rounded w-fit">
                          {formatDistanceToNow(activity.date, { addSuffix: true })}
                        </span>
                      </div>

                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {activity.subtitle}
                      </p>

                      {/* Enhanced Entity Preview */}
                      {activity.type === 'MEMBER_JOIN' && activity.user && (
                        <div className="flex items-center gap-2 mt-1.5 p-2 rounded-lg bg-secondary/30 border border-border/50">
                          <Avatar className="h-6 w-6 border shadow-sm">
                            <AvatarImage src={activity.user.avatar} />
                            <AvatarFallback className="text-[8px]">{activity.user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <span className="text-xs font-medium">{activity.user.name}</span>
                        </div>
                      )}

                      {activity.type === 'PROJECT_CREATE' && (
                        <div className="flex items-center gap-2 mt-1.5">
                          <Badge variant="outline" className="text-[10px] font-normal px-2 py-0.5 gap-1.5 bg-background hover:bg-accent transition-colors">
                            <FolderPlus className="h-3 w-3 text-pink-500" /> Project
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}