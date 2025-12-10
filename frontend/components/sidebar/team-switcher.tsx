"use client"

import * as React from "react"
import { ChevronsUpDown, Plus, GalleryVerticalEnd } from "lucide-react"
import { useRouter, useParams } from "next/navigation" // 1. Import useParams

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { useTeams } from "@/hooks/useTeam"

export function TeamSwitcher() {
  const { isMobile } = useSidebar()
  const router = useRouter()
  const params = useParams() 
  
  const { data: teams, isLoading } = useTeams()

  const activeTeam = React.useMemo(() => {
    if (!teams || teams.length === 0) return undefined;
    
    const currentTeamId = params?.teamId as string;
    
    if (currentTeamId) {
        return teams.find(t => t.id === currentTeamId) || teams[0];
    }
    
    return teams[0];
  }, [teams, params?.teamId]);

  // Format teams for the UI
  const formattedTeams = React.useMemo(() => {
    return (teams || []).map((team) => ({
      name: team.name,
      logo: GalleryVerticalEnd,
      plan: team.role,
      original: team
    }))
  }, [teams])

  const activeFormattedTeam = React.useMemo(() => {
    if (!activeTeam) return undefined;
    return {
      name: activeTeam.name,
      logo: GalleryVerticalEnd,
      plan: activeTeam.role,
      original: activeTeam
    }
  }, [activeTeam])

  if (isLoading || !activeFormattedTeam) {
    return <div className="h-12 w-full animate-pulse bg-sidebar-accent/10 rounded-lg" /> // Simple loading state
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <activeFormattedTeam.logo className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{activeFormattedTeam.name}</span>
                <span className="truncate text-xs">{activeFormattedTeam.plan}</span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Teams
            </DropdownMenuLabel>
            {formattedTeams.map((team, index) => (
              <DropdownMenuItem
                key={team.name}
                onClick={() => {
                    router.push(`/${team.original.id}`); 
                }}
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-md border">
                  <team.logo className="size-3.5 shrink-0" />
                </div>
                {team.name}
                <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem 
                className="gap-2 p-2 cursor-pointer" 
                onClick={() => router.push("/team-create")}
            >
              <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                <Plus className="size-4" />
              </div>
              <div className="text-muted-foreground font-medium">Add team</div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}