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
} from "lucide-react"

import { NavMain } from "@/components/sidebar/nav-main"
import { NavProjects } from "@/components/sidebar/nav-projects"
import { TeamSwitcher } from "@/components/sidebar/team-switcher"
import Image from "next/image"
// import logo from "@/public/assets/logo/logo_white .png"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Acme Inc",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: AudioWaveform,
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: Command,
      plan: "Free",
    },
  ],
  projects: [
    {
      name: "Design Engineering",
      url: "#",
      icon: Frame,
    },
    {
      name: "Sales & Marketing",
      url: "#",
      icon: PieChart,
    },
    {
      name: "Travel",
      url: "#",
      icon: Map,
    },
  ],
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
      title: "AI Assistant",
      url: "ai-assistant",
      icon: Sparkles,
      isActive: true
    },
  ],

}

import { useProjects } from "@/hooks/useProjects"

// ...existing code...

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { projects } = useProjects()

  const formattedProjects = React.useMemo(() => {
    return projects.map((project) => ({
      name: project.name,
      url: `/dashboard?projectId=${project.id}`,
      icon: Frame, // Default icon
    }))
  }, [projects])

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
        {/* <Image src={logo} alt={""} /> */}
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={formattedProjects} />
      </SidebarContent>
      {/* <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter> */}
      <SidebarRail />
    </Sidebar>
  )
}
