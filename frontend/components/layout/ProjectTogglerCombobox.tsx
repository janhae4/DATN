"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"

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
import { useProjects } from "@/hooks/useProjects"

export function ProjectTogglerCombobox() {
  const [open, setOpen] = React.useState(false)
  const { projects, isLoading } = useProjects()
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentProjectId = searchParams.get("projectId") || "project-phoenix-1"

  const selectedProject = React.useMemo(() => {
    return projects.find((p) => p.id === currentProjectId)
  }, [projects, currentProjectId])

  const handleSelectProject = (projectId: string) => {
    router.push(`/dashboard?projectId=${projectId}`)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="flex gap-1 items-center">
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[200px] justify-between"
          >
            {selectedProject ? selectedProject.name : "Select project..."}
            <ChevronsUpDown className="opacity-50" />
          </Button>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search project..." className="h-9" />
          <CommandList>
            <CommandEmpty>No project found.</CommandEmpty>
            <CommandGroup>
              {projects.map((project) => (
                <CommandItem
                  key={project.id}
                  value={project.name} // CommandItem uses value for filtering, usually text
                  onSelect={() => handleSelectProject(project.id)}
                >
                  {project.name}
                  <Check
                    className={cn(
                      "ml-auto",
                      currentProjectId === project.id ? "opacity-100" : "opacity-0"
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
