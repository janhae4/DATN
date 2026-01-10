"use client";

import * as React from "react";
import {
  AudioWaveform,
  BookOpen,
  Bot,
  Command,
  Frame,
  GalleryVerticalEnd,
  Map,
  PieChart,
  Sparkle,
  Sparkles,
  SquareTerminal,
  Star,
  Users,
  MessageCircle,
  CalendarDays,
} from "lucide-react";

import { NavMain } from "@/components/sidebar/nav-main";
import { NavProjects } from "@/components/sidebar/nav-projects";
import { TeamSwitcher } from "@/components/sidebar/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";

const data = {
  navMain: [
    {
      title: "Project management",
      url: "dashboard",
      icon: Bot,
      isActive: true,
      items: [
        {
          title: "Dashboard",
          url: "dashboard#summary",
        },
        {
          title: "Boards",
          url: "dashboard#boards",
        },
        {
          title: "Backlogs",
          url: "dashboard#backlogs",
        },
        {
          title: "Timeline",
          url: "dashboard#timeline",
        },
      ],
    },
    {
      title: "Meeting",
      url: "meeting",
      icon: SquareTerminal,
      isActive: true,
      items: [
        {
          title: "Join a meeting",
          url: "meeting",
        },
        {
          title: "Meeting history",
          url: "meeting/summary",
        },
      ],
    },
    {
      title: "Documentation",
      url: "documentation",
      icon: BookOpen,
      isActive: true,
    },
    {
      title: "Team",
      url: "team",
      icon: Users,
      isActive: true,
    },
    {
      title: "Calendar",
      url: "calendar",
      icon: CalendarDays,
      isActive: true,
    },
    {
      title: "Messages",
      url: "chat",
      icon: MessageCircle,
      isActive: true,
    },
    {
      title: "AI Assistant",
      url: "ai-assistant",
      icon: Sparkles,
      isActive: true,
    },
  ],
};

import { useProjects } from "@/hooks/useProjects";
import { useParams } from "next/navigation";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const params = useParams();
  const teamId = params.teamId as string;
  const projectId = params.projectId as string | undefined;
  const { projects } = useProjects(teamId);

  const formattedProjects = React.useMemo(() => {
    return projects.map((project) => ({
      name: project.name,
      url: `/${teamId}/${project.id}/dashboard`,
      icon: Frame,
    }));
  }, [projects, teamId]);

  const effectiveProjectId = React.useMemo(() => {
    if (projectId) return projectId;
    if (projects && projects.length > 0) return projects[0].id;
    return undefined;
  }, [projectId, projects]);

  const navMainWithParams = React.useMemo(() => {
    if (!teamId) {
      return data.navMain.map((item) => ({
        ...item,
        url: "#",
        items: item.items?.map((sub) => ({ ...sub, url: "#" })),
      }));
    }

    const projectBasePath = effectiveProjectId
      ? `/${teamId}/${effectiveProjectId}`
      : `/${teamId}`;

    return data.navMain.map((item) => {
      let resolvedUrl: string;

      if (
        ["team", "calendar", "meeting", "documentation", "chat"].includes(
          item.url
        )
      ) {
        resolvedUrl = `/${teamId}/${item.url}`;
      } else if (item.url === "dashboard") {
        resolvedUrl = effectiveProjectId
          ? `${projectBasePath}/dashboard`
          : `/${teamId}/create-project`;
      } else if (item.url === "ai-assistant") {
        resolvedUrl = `/ai-assistant`;
      } else {
        resolvedUrl = `${projectBasePath}/${item.url}`;
      }

      return {
        ...item,
        url: resolvedUrl,
        items: item.items
          ? item.items.map((subItem) => {
              if (item.url === "meeting") {
                return { ...subItem, url: `/${teamId}/${subItem.url}` };
              }
              return {
                ...subItem,
                url: effectiveProjectId
                  ? `${projectBasePath}/${
                      subItem.url.split("#")[1]
                        ? "dashboard#" + subItem.url.split("#")[1]
                        : subItem.url
                    }`
                  : "#",
              };
            })
          : item.items,
      };
    });
  }, [teamId, effectiveProjectId]);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMainWithParams} />
        <NavProjects projects={formattedProjects} />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
