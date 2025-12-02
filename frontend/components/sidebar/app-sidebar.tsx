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
  MessageCircle
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
          url: "dashboard",
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
          url: "meeting-history",
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
  const teamId = useParams().teamId as string
  const { projects } = useProjects(teamId)

  const formattedProjects = React.useMemo(() => {
    return projects.map((project) => ({
      name: project.name,
      url: `/${teamId}/${project.id}/dashboard`,
      icon: Frame, 
    }))
  }, [projects])

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={formattedProjects} />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
