// backlogs/BacklogFilterBar.tsx
"use client"

import * as React from "react"
import { db } from "@/public/mock-data/mock-data"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getAssigneeInitial, priorityMap } from "@/lib/backlog-utils"
import { Check, ChevronDown, PlusCircle, User, Flag, CheckCircle2, X, Layers } from "lucide-react"
import { cn } from "@/lib/utils"
import { TaskFilters } from "@/hooks/useTaskManagement"
import { useTaskManagementContext } from "@/components/providers/TaskManagementContext"
import { Task, List } from "@/types"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useList } from "@/hooks/useList"

// Lấy list priority từ map
const priorityList = Object.entries(priorityMap).map(([key, value]) => ({
  value: key as Task["priority"],
  label: value.label,
  icon: value.icon,
}))

// Lấy list user
const userList = [
  ...db.users,
  { id: "unassigned", name: "Unassigned" } // Thêm option "Unassigned"
]

interface BacklogFilterBarProps {
  showCreateSprint?: boolean
  showStatusFilter?: boolean
}

export function BacklogFilterBar({ showCreateSprint = true, showStatusFilter = true }: BacklogFilterBarProps) {
  const { filters, setFilters, projectId, epics } = useTaskManagementContext()
  const { lists } = useList(projectId)

  // Dùng state local để control UI, sau đó "debounce" update context
  const [searchText, setSearchText] = React.useState(filters.searchText)

  // Update context filter khi state local thay đổi
  const handleFilterChange = <K extends keyof TaskFilters>(
    key: K,
    value: TaskFilters[K]
  ) => {
    setFilters({
      ...filters,
      [key]: value,
    })
  }

  // Dùng useEffect để "debounce" S"
  React.useEffect(() => {
    const handler = setTimeout(() => {
      handleFilterChange("searchText", searchText)
    }, 300) // 300ms debounce
    return () => clearTimeout(handler)
  }, [searchText])

  // Reset filters
  const resetFilters = () => {
    setSearchText("")
    setFilters({
      searchText: "",
      assigneeIds: [],
      priorities: [],
      listIds: [],
      epicIds: [],
    })
  }

  const isFiltered =
    filters.searchText.length > 0 ||
    filters.assigneeIds.length > 0 ||
    filters.priorities.length > 0 ||
    filters.listIds.length > 0 ||
    filters.epicIds.length > 0

  // Lấy list status options
  const listOptions = lists.map(l => ({
    value: l.id,
    label: l.name,
    icon: () => <span className="h-2 w-2 rounded-full" style={{ backgroundColor: l.color }} />
  }))

  // Lấy list epic options
  const epicOptions = epics.map(e => ({
    value: e.id,
    label: e.title,
    icon: () => <div className="h-3 w-3 rounded-full border border-border" style={{ backgroundColor: e.color || "#a1a1aa" }} />
  }))

  return (
    <div className="flex w-full items-center gap-2  py-2">
      {/* Search Input */}
      <div className="flex-1">
        <Input
          placeholder="Search by title, ID..."
          className="h-9 max-w-sm"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>

      {/* Assignee Filter */}
      <MultiSelectFilter
        label="Assignee"
        icon={<User className="h-3.5 w-3.5" />}
        options={userList.map(u => ({
          value: u.id,
          label: u.name,
          icon: u.id === "unassigned" 
            ? () => <User className="h-4 w-4 text-muted-foreground" />
            : () => (
                <Avatar className="h-5 w-5">
                  <AvatarImage src={(u as any).avatar} alt={u.name} />
                  <AvatarFallback className="text-[10px]">{getAssigneeInitial(u.id)}</AvatarFallback>
                </Avatar>
              )
        }))}
        selectedValues={filters.assigneeIds}
        onSelectionChange={(values) => handleFilterChange("assigneeIds", values)}
      />
      
      {/* Priority Filter */}
      <MultiSelectFilter
        label="Priority"
        icon={<Flag className="h-3.5 w-3.5" />}
        options={priorityList as any}
        selectedValues={filters.priorities as any}
        onSelectionChange={(values) => handleFilterChange("priorities", values as any)}
      />

      {/* Status Filter */}
      {showStatusFilter && (
        <MultiSelectFilter
          label="Status"
          icon={<CheckCircle2 className="h-3.5 w-3.5" />}
          options={listOptions}
          selectedValues={filters.listIds}
          onSelectionChange={(values) => handleFilterChange("listIds", values)}
        />
      )}

      {/* Epic Filter */}
      <MultiSelectFilter
        label="Epic"
        icon={<Layers className="h-3.5 w-3.5" />}
        options={epicOptions}
        selectedValues={filters.epicIds}
        onSelectionChange={(values) => handleFilterChange("epicIds", values)}
      />

      {/* Clear Button */}
      {isFiltered && (
        <Button
          variant="ghost"
          size="sm"
          className="h-9 px-3 text-muted-foreground"
          onClick={resetFilters}
        >
          <X className="h-4 w-4 mr-1.5" />
          Clear all
        </Button>
      )}

      {showCreateSprint && <Button variant="default" size="sm" className="h-9 px-3">Create Sprint</Button>}
    </div>
  )
}

// --- Component con cho cái filter Popover ---
interface MultiSelectFilterProps<T> {
  label: string
  icon: React.ReactNode
  options: {
    value: T
    label: string
    icon: React.ComponentType<any>
  }[]
  selectedValues: T[]
  onSelectionChange: (selected: T[]) => void
}

function MultiSelectFilter<T extends string | null>({
  label,
  icon,
  options,
  selectedValues,
  onSelectionChange,
}: MultiSelectFilterProps<T>) {
  const toggleSelection = (value: T) => {
    if (selectedValues.includes(value)) {
      onSelectionChange(selectedValues.filter((v) => v !== value))
    } else {
      onSelectionChange([...selectedValues, value])
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 gap-1.5 px-3 data-[state=open]:bg-muted/50"
        >
          {icon}
          <span className="text-sm font-normal">{label}</span>
          {selectedValues.length > 0 && (
            <>
              <Separator orientation="vertical" className="h-4 mx-1" />
              <Badge
                variant="secondary"
                className="rounded-md px-1.5 py-0 text-xs"
              >
                {selectedValues.length}
              </Badge>
            </>
          )}
          <ChevronDown className="h-4 w-4 opacity-50 ml-1.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-60 p-0" align="start">
        <Command>
          <CommandInput placeholder={`Filter ${label.toLowerCase()}...`} />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value as string}
                  onSelect={() => toggleSelection(option.value)}
                  className="cursor-pointer"
                >
                  <div className={cn(
                    "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                    selectedValues.includes(option.value)
                      ? "bg-primary text-primary-foreground"
                      : "opacity-50 [&_svg]:invisible"
                  )}>
                    <Check className={cn("h-4 w-4")} />
                  </div>
                  <option.icon />
                  <span className="ml-2">{option.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}