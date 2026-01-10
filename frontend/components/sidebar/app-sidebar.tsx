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

const data: {
  navMain: {
    title: string
    url: string
    icon: any
    isActive?: boolean
    items?: {
      title: string
      url: string
    }[]
  }[]
} = {
  navMain: [
    {
      title: "Project management",
      url: "dashboard",
      icon: Bot,
      isActive: true,
    },
    // {
    //   title: "Meeting",
    //   url: "meeting",
    //   icon: SquareTerminal,
    //   isActive: true,
    //   items: [
    //     {
    //       title: "Join a meeting",
    //       url: "meeting",
    //     },
    //     {
    //       title: "Meeting history",
    //       url: "meeting/summary",
    //     },
    //   ],
    // },
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
    // {
    //   title: "Messages",
    //   url: "chat",
    //   icon: MessageCircle,
    //   isActive: true
    // },
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
    return projects
      .map((project) => ({
        id: project.id,
        name: project.name,
        url: `/${teamId}/${project.id}/dashboard`,
        icon: Frame,
        raw: project, 
      }))
  }, [projects, teamId])

  const effectiveProjectId = React.useMemo(() => {
    if (projectId) return projectId
    if (projects && projects.length > 0) return projects[0].id
    return undefined
  }, [projectId, projects])

  const navMainWithParams = React.useMemo(() => {
    if (!teamId) {
      return data.navMain
    }

    const basePath = effectiveProjectId ? `/${teamId}/${effectiveProjectId}` : null

    return data.navMain.map((item) => {
      let resolvedUrl: string

      // Routes that only need teamId
      if (item.url === "team") {
        resolvedUrl = `/${teamId}/team`
      } else if (item.url === "calendar") {
        resolvedUrl = `/${teamId}/calendar`
      } else if (item.url === "meeting") {
        resolvedUrl = `/${teamId}/meeting`
      } else if (item.url === "documentation") {
        resolvedUrl = `/${teamId}/documentation`
      } else if (item.url === "dashboard" && item.title === "Project management") {
        resolvedUrl = `/${teamId}`
      } else {
        // Routes that need both teamId and projectId
        resolvedUrl = basePath ? `${basePath}/${item.url}` : `/${teamId}`
      }

      return {
        ...item,
        url: resolvedUrl,
        items: item.items
          ? item.items.map((subItem) => ({
            ...subItem,
            url: item.url === "meeting"
              ? `/${teamId}/${subItem.url}`
              : basePath
                ? `${basePath}/${subItem.url}`
                : `/${teamId}`,
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
