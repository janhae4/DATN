"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Folder, Loader2 } from "lucide-react"
import { useRouter, useParams } from "next/navigation"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

// Import hooks
import { useProjects, useProject } from "@/hooks/useProjects"

export function ProjectTogglerCombobox() {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()
  
  // 1. Get IDs directly from URL (Single Source of Truth)
  const params = useParams()
  const teamId = params.teamId as string
  console.log("Current teamId in ProjectTogglerCombobox:", teamId);
  const projectId = params.projectId as string

  // 2. Fetch Projects list for the current Team
  const { projects } = useProjects(teamId)

  console.log("Projects in ProjectTogglerCombobox:", projects);
  // 3. Fetch details for the currently active Project
  const { project: selectedProject, isLoading: isProjectLoading } = useProject(projectId)

  const handleSelectProject = (newProjectId: string) => {
    setOpen(false)
    if (teamId) {
      router.push(`/${teamId}/${newProjectId}/dashboard`)
    }
  }

  // Determine label text
  const displayLabel = isProjectLoading 
    ? "Loading..." 
    : selectedProject?.name || "Select project..."

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between pl-3"
        >
          <div className="flex items-center gap-2 truncate">
            {/* Show Spinner if loading, otherwise Folder icon */}
            {isProjectLoading ? (
               <Loader2 className="h-4 w-4 shrink-0 animate-spin opacity-50" />
            ) : (
               <Folder className="h-4 w-4 shrink-0 opacity-50" />
            )}
            <span className="truncate">{displayLabel}</span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-[200px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search project..." className="h-9" />
          <CommandList>
            <CommandEmpty>No project found.</CommandEmpty>
            <CommandGroup heading="Projects">
              {projects.map((project) => (
                <CommandItem
                  key={project.id}
                  value={project.name}
                  onSelect={() => handleSelectProject(project.id)}
                  className="cursor-pointer"
                >
                  {project.name}
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      projectId === project.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}