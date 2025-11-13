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
  CommandSeparator,
} from "@/components/ui/command"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { getAssigneeInitial, priorityMap, statusesForProject1 } from "@/lib/backlog-utils"
import { Check, ChevronDown, PlusCircle, User, Flag, CheckCircle2, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { TaskFilters } from "@/hooks/useTaskManagement"
import { useTaskManagementContext } from "@/components/providers/TaskManagementContext"
import { Task } from "@/types/task.type"
import { Badge } from "@/components/ui/badge"

// Lấy list priority từ map
const priorityList = Object.entries(priorityMap).map(([key, value]) => ({
  value: key as Task["priority"],
  label: value.label,
  icon: value.icon,
}))

// Lấy list status
const statusList = statusesForProject1.map(s => ({
  value: s.id,
  label: s.name,
  icon: () => <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
}))

// Lấy list user
const userList = [
  ...db.users,
  { id: "unassigned", name: "Unassigned" } // Thêm option "Unassigned"
]

export function BacklogFilterBar() {
  const { filters, setFilters } = useTaskManagementContext()

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
      statusIds: [],
    })
  }

  const isFiltered =
    filters.searchText.length > 0 ||
    filters.assigneeIds.length > 0 ||
    filters.priorities.length > 0 ||
    filters.statusIds.length > 0

  return (
    <div className="flex w-full items-center gap-2 px-1 py-2">
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
            : () => <Avatar className="h-5 w-5"><AvatarFallback className="text-[10px]">{getAssigneeInitial(u.id)}</AvatarFallback></Avatar>
        }))}
        selectedValues={filters.assigneeIds}
        onSelectionChange={(values) => handleFilterChange("assigneeIds", values)}
      />
      
      {/* Priority Filter */}
      <MultiSelectFilter
        label="Priority"
        icon={<Flag className="h-3.5 w-3.5" />}
        options={priorityList}
        selectedValues={filters.priorities}
        onSelectionChange={(values) => handleFilterChange("priorities", values)}
      />

      {/* Status Filter */}
      <MultiSelectFilter
        label="Status"
        icon={<CheckCircle2 className="h-3.5 w-3.5" />}
        options={statusList}
        selectedValues={filters.statusIds}
        onSelectionChange={(values) => handleFilterChange("statusIds", values)}
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

      <Button variant="default" size="sm" className="h-9 px-3">Create Sprint</Button>
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
              <CommandSeparator className="h-4 mx-1" />
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