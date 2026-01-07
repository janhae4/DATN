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
      url: "/dashboard",
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
    return projects.map((project) => ({
      name: project.name,
      url: `/${teamId}/${project.id}/dashboard`,
      icon: Frame,
    }))
  }, [projects, teamId])

  const [storedProjectId, setStoredProjectId] = React.useState<string | undefined>(undefined)

  // Load from local storage on mount or when teamId changes
  React.useEffect(() => {
    if (teamId) {
      const saved = localStorage.getItem(`lastProjectId:${teamId}`)
      if (saved) setStoredProjectId(saved)
    }
  }, [teamId])

  // Sync state with URL projectId when it exists
  React.useEffect(() => {
    if (projectId && teamId) {
      setStoredProjectId(projectId)
      localStorage.setItem(`lastProjectId:${teamId}`, projectId)
    }
  }, [projectId, teamId])

  const effectiveProjectId = React.useMemo(() => {
    if (projectId) return projectId
    if (storedProjectId) return storedProjectId
    if (projects && projects.length > 0) return projects[0].id
    return undefined
  }, [projectId, projects, storedProjectId])

  console.log("effectiveProjectId", effectiveProjectId)
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
        resolvedUrl = `/${teamId}/calendar`
      } else if (item.url === "meeting") {
        resolvedUrl = `/${teamId}/meeting`
      } else if (item.url === "documentation") {
        resolvedUrl = `/${teamId}/documentation`
      } else {
        resolvedUrl = `${basePath}/${item.url}`
      }

      return {
        ...item,
        url: resolvedUrl
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
