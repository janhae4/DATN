"use client"

import * as React from "react"
import { useParams } from "next/navigation"
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
import { Check, ChevronDown, User, Flag, CheckCircle2, X, Layers, Tag, Calendar, MinusCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { SprintStatus } from "@/types/common/enums"
import { Task } from "@/types"

// --- Hooks Data ---
import { useEpics } from "@/hooks/useEpics"
import { useLabels } from "@/hooks/useLabels"
import { useLists } from "@/hooks/useList"
import { useSprints } from "@/hooks/useSprints"
import { useTeamMembers } from "@/hooks/useTeam"

// --- Components ---
import { SprintCreateDialog } from "./sprint/SprintCreateDialog"
import { CompleteSprintDialog } from "./sprint/CompleteSprintDialog"

// Định nghĩa Interface Filter (nếu chưa có trong types chung)
export interface TaskFilters {
  searchText: string
  assigneeIds: string[]
  priorities: (Task["priority"])[]
  listIds: string[]
  epicIds: string[]
  labelIds: string[]
  sprintIds: string[]
}

// Lấy list priority từ map
const priorityList = Object.entries(priorityMap).map(([key, value]) => ({
  value: key as Task["priority"],
  label: value.label,
  icon: value.icon, // Icon component
  color: value.color // Màu sắc cho Icon
}))

interface BacklogFilterBarProps {
  showCreateSprint?: boolean
  showStatusFilter?: boolean
  // Props để nhận State từ cha
  filters: TaskFilters
  onFilterChange: (newFilters: TaskFilters) => void
}

export function BacklogFilterBar({ 
  showCreateSprint = true, 
  showStatusFilter = true,
  filters,
  onFilterChange
}: BacklogFilterBarProps) {
  
  // 1. Lấy IDs từ URL
  const params = useParams();
  const projectId = params.projectId as string;
  const teamId = params.teamId as string;

  // 2. Fetch Data bằng các Hook riêng biệt
  const { lists } = useLists(projectId);
  const { epics } = useEpics(projectId);
  const { labels } = useLabels(projectId);
  const { sprints } = useSprints(projectId);
  const { data: members } = useTeamMembers(teamId);

  // 3. Xử lý dữ liệu User (Map từ TeamMember sang User Option)
  const userOptions = React.useMemo(() => {
    const users = ((members ?? []) as any[])
      .filter((m) => !!m.cachedUser)
      .map((m) => ({
        value: m.userId,
        label: m.cachedUser.name,
        avatar: m.cachedUser.avatar,
      }));
    
    return [
      ...users,
      { value: "unassigned", label: "Unassigned", avatar: null }
    ];
  }, [members]);

  // 4. Xử lý dữ liệu Options khác
  
  // --- START SỬA ĐỔI ---

  // LỌC: Chỉ giữ lại các Sprint chưa bị Archive
  const nonArchivedSprints = React.useMemo(() => {
    // Giả định Sprint object có property `isArchived: boolean`. 
    // Nếu bạn dùng trường khác (ví dụ: status đặc biệt), hãy thay đổi logic lọc tại đây.
    return sprints.filter((s: any) => s.category !== SprintStatus.ARCHIVED || s.category !== SprintStatus.COMPLETED); 
  }, [sprints]);
  
  // Tìm active sprint cho nút Complete
  const activeSprint = React.useMemo(() => 
    sprints.find(s => s.status === SprintStatus.ACTIVE), 
  [sprints]);
  
  // SPRINT OPTIONS: Sử dụng danh sách đã lọc
  const sprintOptions = nonArchivedSprints.map(s => ({
    value: s.id,
    label: s.title,
    icon: () => <Calendar className="h-3 w-3 text-muted-foreground/70" />
  }));

  // --- END SỬA ĐỔI ---
  
  const listOptions = lists.map(l => ({
    value: l.id,
    label: l.name,
    // SỬA: Icon Status có thể dùng dấu chấm màu
    icon: () => <span className="h-2 w-2 rounded-full bg-muted-foreground/50" /> 
  }));

  const epicOptions = epics.map(e => ({
    value: e.id,
    label: e.title,
    // SỬA: Icon Epic là hình vuông màu sắc
    icon: () => <div className="h-3 w-3 rounded-sm border border-border" style={{ backgroundColor: e.color || "#a1a1aa" }} />
  }));

  const labelOptions = labels.map(l => ({
    value: l.id,
    label: l.name,
    // SỬA: Icon Label là hình tròn màu sắc
    icon: () => <div className="h-3 w-3 rounded-full border border-border" style={{ backgroundColor: l.color || "#a1a1aa" }} />
  }));


  // 5. Logic Debounce Search
  const [searchText, setSearchText] = React.useState(filters.searchText);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      if (searchText !== filters.searchText) {
        onFilterChange({ ...filters, searchText });
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [searchText, filters, onFilterChange]);

  // 6. Handlers
  const handleFilterUpdate = <K extends keyof TaskFilters>(key: K, value: TaskFilters[K]) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const resetFilters = () => {
    setSearchText("");
    onFilterChange({
      searchText: "",
      assigneeIds: [],
      priorities: [],
      listIds: [],
      epicIds: [],
      labelIds: [],
      sprintIds: [],
    });
  };

  const isFiltered =
    filters.searchText.length > 0 ||
    filters.assigneeIds.length > 0 ||
    filters.priorities.length > 0 ||
    filters.listIds.length > 0 ||
    filters.epicIds.length > 0 ||
    filters.labelIds.length > 0 ||
    filters.sprintIds.length > 0;

  return (
    <div className="flex w-full items-center gap-2 py-2">
      {/* Search Input */}
      <div className="flex-1">
        <Input
          placeholder="Search by title..."
          className="h-9 min-w-60 w-full"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>

      {/* Assignee Filter */}
      <MultiSelectFilter
        label="Assignee"
        icon={<User className="h-3.5 w-3.5" />}
        options={userOptions.map(u => {
          // SỬA LẠI CÁCH RENDER ASSIGNEE ICON TRỰC TIẾP TRONG OPTIONS
          const IconComponent = u.value === "unassigned"
            ? () => <MinusCircle className="h-4 w-4 text-muted-foreground" /> // Dùng MinusCircle cho Unassigned
            : () => (
                <Avatar className="h-5 w-5">
                  <AvatarImage src={u.avatar} alt={u.label} />
                  <AvatarFallback className="text-[10px] bg-primary text-primary-foreground font-medium">{getAssigneeInitial(u.label)}</AvatarFallback>
                </Avatar>
              );
          
          return {
            value: u.value,
            label: u.label,
            icon: IconComponent, // Truyền vào component
          };
        })}
        selectedValues={filters.assigneeIds}
        onSelectionChange={(values) => handleFilterUpdate("assigneeIds", values)}
      />
      
      {/* Priority Filter */}
      <MultiSelectFilter
        label="Priority"
        icon={<Flag className="h-3.5 w-3.5" />}
        options={priorityList.map(p => ({
          ...p,
          // SỬA: Icon Priority có màu sắc
          icon: () => {
            const Icon = p.icon;
            return <Icon className={cn("h-4 w-4", p.color)} />;
          }
        })) as any}
        selectedValues={filters.priorities as any}
        onSelectionChange={(values) => handleFilterUpdate("priorities", values as any)}
      />

      {/* Status Filter */}
      {showStatusFilter && (
        <MultiSelectFilter
          label="Status"
          icon={<CheckCircle2 className="h-3.5 w-3.5" />}
          options={listOptions}
          selectedValues={filters.listIds}
          onSelectionChange={(values) => handleFilterUpdate("listIds", values)}
        />
      )}

      {/* Epic Filter */}
      <MultiSelectFilter
        label="Epic"
        icon={<Layers className="h-3.5 w-3.5" />}
        options={epicOptions}
        selectedValues={filters.epicIds}
        onSelectionChange={(values) => handleFilterUpdate("epicIds", values)}
      />

      {/* Label Filter */}
      <MultiSelectFilter
        label="Label"
        icon={<Tag className="h-3.5 w-3.5" />}
        options={labelOptions}
        selectedValues={filters.labelIds}
        onSelectionChange={(values) => handleFilterUpdate("labelIds", values)}
      />

      {/* Sprint Filter */}
      <MultiSelectFilter
        label="Sprint"
        icon={<Calendar className="h-3.5 w-3.5" />}
        options={sprintOptions}
        selectedValues={filters.sprintIds}
        onSelectionChange={(values) => handleFilterUpdate("sprintIds", values)}
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

      <div className="flex-1" />

      {/* Nút Complete Sprint */}
      {activeSprint && !showCreateSprint && (
          <CompleteSprintDialog sprint={activeSprint}>
             <Button variant="outline" size="sm" className="h-9 px-3 border-primary/20 hover:border-primary/50 text-primary hover:text-primary hover:bg-primary/5">
                Complete Sprint
             </Button>
          </CompleteSprintDialog>
      )}

      {/* Nút Create Sprint */}
      {showCreateSprint && (
        <SprintCreateDialog onSave={() => { /* Không cần reload, React Query tự lo */ }}>
          <Button variant="default" size="sm" className="h-9 px-3">Create Sprint</Button>
        </SprintCreateDialog>
      )}
    </div>
  )
}

// --- Component con cho Filter Popover (Không thay đổi) ---
interface MultiSelectFilterProps<T> {
  label: string
  icon: React.ReactNode
  options: {
    value: T
    label: string
    // CHỈNH SỬA: icon có thể là component hoặc ReactNode
    icon: React.ComponentType<any> | (() => React.ReactNode)
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
                  
                  {/* SỬA: ICON/AVATAR HIỂN THỊ NGAY BÊN CẠNH CHECKBOX */}
                  <div className="mr-2 flex h-5 w-5 items-center justify-center">
                    <option.icon /> 
                  </div>
                  
                  <span className="flex-1 truncate">{option.label}</span> 
                  
                  {/* CHECKBOX/CHECK ICON HIỂN THỊ Ở PHÍA BÊN PHẢI */}
                  <div className={cn(
                    "ml-auto flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                    selectedValues.includes(option.value)
                      ? "bg-primary text-primary-foreground"
                      : "opacity-50"
                  )}>
                    <Check className={cn(
                      "h-4 w-4 transition-opacity duration-100", 
                      !selectedValues.includes(option.value) && "opacity-0" // Ẩn Check nếu không chọn
                    )} />
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}