"use client"

import * as React from "react"
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
} from "lucide-react"

import { NavMain } from "@/components/sidebar/nav-main"
import { NavProjects } from "@/components/sidebar/nav-projects"
import { TeamSwitcher } from "@/components/sidebar/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

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
      isActive: true
    },
    {
      title: "Team",
      url: "team",
      icon: Users,
      isActive: true
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
      isActive: true
    },
    {
      title: "AI Assistant",
      url: "ai-assistant",
      icon: Sparkles,
      isActive: true
    },
  ],

}

import { useProjects } from "@/hooks/useProjects"
import { useParams } from "next/navigation"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const params = useParams()
  const teamId = params.teamId as string
  const projectId = params.projectId as string | undefined
  const { projects } = useProjects(teamId)

  const formattedProjects = React.useMemo(() => {
    return projects.map((project) => ({
      name: project.name,
      url: `/${teamId}/${project.id}/dashboard`,
      icon: Frame,
    }))
  }, [projects, teamId])

  const effectiveProjectId = React.useMemo(() => {
    if (projectId) return projectId
    if (projects && projects.length > 0) return projects[0].id
    return undefined
  }, [projectId, projects])

  const navMainWithParams = React.useMemo(() => {
    if (!teamId || !effectiveProjectId) {
      return data.navMain
    }

    const basePath = `/${teamId}/${effectiveProjectId}`

    return data.navMain.map((item) => {
      // Xử lý đặc biệt cho Team, Calendar và Meeting
      let resolvedUrl: string
      if (item.url === "team") {
        resolvedUrl = `/${teamId}/team`
      } else if (item.url === "calendar") {
        resolvedUrl = "/calendar"
      } else if (item.url === "meeting") {
        resolvedUrl = `/${teamId}/meeting`
      } else {
        resolvedUrl = `${basePath}/${item.url}` 
      }

      return {
        ...item,
        url: resolvedUrl,
        items: item.items
          ? item.items.map((subItem) => ({
            ...subItem,
            url: item.url === "meeting" 
              ? `/${teamId}/${subItem.url}` 
              : `${basePath}/${subItem.url}`,
          }))
          : item.items,
      }
    })
  }, [teamId, effectiveProjectId])

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
  )
}
