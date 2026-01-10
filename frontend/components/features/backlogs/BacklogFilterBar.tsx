"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { priorityMap } from "@/lib/backlog-utils";
import {
  Check,
  ChevronDown,
  User,
  Flag,
  CheckCircle2,
  X,
  Layers,
  Tag,
  Calendar,
  MinusCircle,
  SparkleIcon,
  Search,
  LayoutList,
  Columns as Columns2,
  Plus as PlusIcon,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SprintStatus } from "@/types/common/enums";
import { Task } from "@/types";

import { useEpics } from "@/hooks/useEpics";
import { useLabels } from "@/hooks/useLabels";
import { useLists } from "@/hooks/useList";
import { useSprints } from "@/hooks/useSprints";
import { useTeamMembers } from "@/hooks/useTeam";
// Removed useBacklogTour import
import { HelpTooltip } from "@/components/shared/HelpTooltip"; // Import HelpTooltip here

import { SprintCreateDialog } from "./sprint/SprintCreateDialog";
import { CompleteSprintDialog } from "./sprint/CompleteSprintDialog";
import { SuggestTaskByAi } from "./task/SuggestTaskByAi";
import { CreateTaskDto } from "@/services/taskService";

export interface TaskFilters {
  searchText: string;
  assigneeIds: string[];
  priorities: Task["priority"][];
  listIds: string[];
  epicIds: string[];
  labelIds: string[];
  sprintIds: string[];
}

const priorityList = Object.entries(priorityMap).map(([key, value]) => ({
  value: key as Task["priority"],
  label: value.label,
  icon: value.icon,
  color: value.color,
}));

interface BacklogFilterBarProps {
  showCreateSprint?: boolean;
  showStatusFilter?: boolean;
  showSprintDone?: boolean;
  filters: TaskFilters;
  onFilterChange: (newFilters: TaskFilters) => void;
  createTasks: ({
    tasks,
    epic,
    sprintId,
  }: {
    tasks: CreateTaskDto[];
    epic: string;
    sprintId?: string;
  }) => void;
  suggestTaskByAi: ({
    data,
    onChunk,
  }: {
    data: {
      query: string;
      projectId: string;
      teamId: string;
      sprintId: string;
    };
    onChunk: (chunk: string) => void;
  }) => Promise<void>;
  viewLayout?: "list" | "split";
  onViewLayoutChange?: (layout: "list" | "split") => void;
  onStartTour?: () => void;
}

export function BacklogFilterBar({
  showCreateSprint = true,
  showStatusFilter = true,
  showSprintDone = false,
  filters,
  onFilterChange,
  createTasks,
  suggestTaskByAi,
  viewLayout = "list",
  onViewLayoutChange,
  onStartTour,
}: BacklogFilterBarProps) {
  const params = useParams();
  const projectId = params.projectId as string;
  const teamId = params.teamId as string;

  const { lists } = useLists(projectId);
  const { epics } = useEpics(projectId);
  const { labels } = useLabels(projectId);
  const sprintStatus = [
    SprintStatus.PLANNED,
    SprintStatus.ACTIVE,
    SprintStatus.ARCHIVED,
  ];
  showSprintDone && sprintStatus.push(SprintStatus.COMPLETED);
  const { sprints } = useSprints(projectId, teamId, sprintStatus);
  const { data: members } = useTeamMembers(teamId);
  // Removed useBacklogTour hook usage

  const nonArchivedSprints = React.useMemo(() => {
    return sprints.filter(
      (s: any) =>
        s.category !== SprintStatus.ARCHIVED ||
        s.category !== SprintStatus.COMPLETED
    );
  }, [sprints]);

  const activeSprint = React.useMemo(
    () => sprints.find((s) => s.status === SprintStatus.ACTIVE),
    [sprints]
  );

  const sprintOptions = nonArchivedSprints.map((s) => ({
    value: s.id,
    label: s.title,
    icon: () => <Calendar className="h-3 w-3 text-muted-foreground/70" />,
  }));

  const listOptions = lists.map((l) => ({
    value: l.id,
    label: l.name,
    icon: () => (
      <span className="h-2 w-2 rounded-full bg-muted-foreground/50" />
    ),
  }));

  const epicOptions = epics.map((e) => ({
    value: e.id,
    label: e.title,
    icon: () => (
      <div
        className="h-3 w-3 rounded-sm border border-border"
        style={{ backgroundColor: e.color || "#a1a1aa" }}
      />
    ),
  }));

  const labelOptions = labels.map((l) => ({
    value: l.id,
    label: l.name,
    icon: () => (
      <div
        className="h-3 w-3 rounded-full border border-border"
        style={{ backgroundColor: l.color || "#a1a1aa" }}
      />
    ),
  }));

  const [searchText, setSearchText] = React.useState(filters.searchText);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      if (searchText !== filters.searchText) {
        onFilterChange({ ...filters, searchText });
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [searchText, filters, onFilterChange]);

  const handleFilterUpdate = <K extends keyof TaskFilters>(
    key: K,
    value: TaskFilters[K]
  ) => {
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
    <div className="flex flex-col w-full gap-5 py-4 px-1">
      {/* Top Row: Search & Actions */}
      <div className="flex flex-col lg:flex-row w-full items-center gap-4">
        <div id="backlog-search" className="relative w-full lg:flex-1 group">
          <Input
            placeholder="Search tasks, descriptions..."
            className="h-11 w-full lg:w-9/12 pl-11 pr-4 bg-muted/30 border-muted-foreground/10 focus-visible:ring-primary/20 focus-visible:border-primary transition-all duration-200 rounded-lg shadow-sm"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
            <Search className="h-4.5 w-4.5" />
          </div>
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto shrink-0">
          <SuggestTaskByAi
            onSave={(tasks, epic, sprintId) =>
              createTasks({ tasks, epic, sprintId })
            }
            suggestTaskByAi={suggestTaskByAi}
          >
            <Button
              id="ai-suggest-btn"
              variant="outline"
              size="sm"
              className="h-11 px-4 hover:text-white transition-all duration-300 rounded-lg gap-2 font-medium shadow-sm hover:shadow-violet-500/20"
            >
              <SparkleIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Suggest with AI</span>
              <span className="sm:hidden">AI</span>
            </Button>
          </SuggestTaskByAi>

          {activeSprint && !showCreateSprint && (
            <CompleteSprintDialog sprint={activeSprint}>
              <Button
                variant="outline"
                size="sm"
                className="h-11 px-4 whitespace-nowrap rounded-lg font-medium border-muted-foreground/20 hover:bg-muted transition-all"
              >
                Complete Sprint
              </Button>
            </CompleteSprintDialog>
          )}



          {showCreateSprint && (
            <div className="flex items-center gap-2">
              <SprintCreateDialog onSave={() => { }}>
                <Button
                  variant="default"
                  size="sm"
                  className="h-11 px-5 whitespace-nowrap rounded-lg font-semibold shadow-md active:scale-95 transition-all gap-2"
                >
                  <PlusIcon className="h-4 w-4" />
                  New Sprint
                </Button>
              </SprintCreateDialog>
            </div>
          )}

          {onStartTour && (
            <Button
              variant="outline"
              size="icon"
              className="h-11 w-11 rounded-lg border-muted-foreground/20 text-muted-foreground hover:text-foreground"
              onClick={onStartTour}
              title="Take a tour"
            >
              <HelpCircle className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>

      <Separator className="bg-muted-foreground/10" />

      {/* Bottom Row: Filters & View Switcher */}
      <div className="flex items-center justify-between w-full gap-4">
        <div id="backlog-filters" className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar flex-1">
          {/* Assignee */}
          <MultiSelectFilter
            label="Assignee"
            icon={<User className="h-3.5 w-3.5" />}
            options={(members || []).map((u) => ({
              value: u.id,
              label: u.name,
              icon:
                u.id === "unassigned"
                  ? () => (
                    <MinusCircle className="h-4 w-4 text-muted-foreground" />
                  )
                  : () => (
                    <Avatar className="h-5 w-5 border border-background shadow-xs">
                      <AvatarImage src={u.avatar} />
                      <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                        {u.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  ),
            }))}
            selectedValues={filters.assigneeIds}
            onSelectionChange={(values) =>
              handleFilterUpdate("assigneeIds", values)
            }
          />

          {/* Priority */}
          <MultiSelectFilter
            label="Priority"
            icon={<Flag className="h-3.5 w-3.5" />}
            options={
              priorityList.map((p) => ({
                ...p,
                icon: () => {
                  const Icon = p.icon;
                  return <Icon className={cn("h-4 w-4", p.color)} />;
                },
              })) as any
            }
            selectedValues={filters.priorities as any}
            onSelectionChange={(values) =>
              handleFilterUpdate("priorities", values as any)
            }
          />

          {/* Status */}
          {showStatusFilter && (
            <MultiSelectFilter
              label="Status"
              icon={<CheckCircle2 className="h-3.5 w-3.5" />}
              options={listOptions}
              selectedValues={filters.listIds}
              onSelectionChange={(values) =>
                handleFilterUpdate("listIds", values)
              }
            />
          )}

          <MultiSelectFilter
            label="Epic"
            icon={<Layers className="h-3.5 w-3.5" />}
            options={epicOptions}
            selectedValues={filters.epicIds}
            onSelectionChange={(values) => handleFilterUpdate("epicIds", values)}
          />

          <MultiSelectFilter
            label="Label"
            icon={<Tag className="h-3.5 w-3.5" />}
            options={labelOptions}
            selectedValues={filters.labelIds}
            onSelectionChange={(values) => handleFilterUpdate("labelIds", values)}
          />

          <MultiSelectFilter
            label="Sprint"
            icon={<Calendar className="h-3.5 w-3.5" />}
            options={sprintOptions.filter((s) =>
              showSprintDone ? true : s.value !== SprintStatus.COMPLETED
            )}
            selectedValues={filters.sprintIds}
            onSelectionChange={(values) =>
              handleFilterUpdate("sprintIds", values)
            }
          />

          {isFiltered && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all text-xs"
              onClick={resetFilters}
            >
              <X className="h-3 w-3 mr-1" />
              Reset
            </Button>
          )}
        </div>

        {/* View Switcher Segmented Control */}
        {onViewLayoutChange && (
          <div id="view-switcher" className="flex items-center bg-muted/40 p-1 rounded-lg border border-muted-foreground/10 shrink-0 shadow-xs">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewLayoutChange("list")}
              className={cn(
                "h-8 text-[11px] font-semibold px-4 gap-2 transition-all duration-300 rounded-lg",
                viewLayout === "list"
                  ? "bg-background text-primary shadow-sm hover:bg-background"
                  : "text-muted-foreground hover:text-foreground hover:bg-transparent"
              )}
            >
              <LayoutList className="h-3.5 w-3.5" />
              List
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewLayoutChange("split")}
              className={cn(
                "h-8 text-[11px] font-semibold px-4 gap-2 transition-all duration-300 rounded-lg",
                viewLayout === "split"
                  ? "bg-background text-primary shadow-sm hover:bg-background"
                  : "text-muted-foreground hover:text-foreground hover:bg-transparent"
              )}
            >
              <Columns2 className="h-3.5 w-3.5" />
              Split
            </Button>
          </div>
        )}
      </div>
    </div >
  );
}

interface MultiSelectFilterProps<T> {
  label: string;
  icon: React.ReactNode;
  options: {
    value: T;
    label: string;
    icon: React.ComponentType<any> | (() => React.ReactNode);
  }[];
  selectedValues: T[];
  onSelectionChange: (selected: T[]) => void;
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
      onSelectionChange(selectedValues.filter((v) => v !== value));
    } else {
      onSelectionChange([...selectedValues, value]);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-10 gap-2 px-3.5 border-muted-foreground/10 hover:bg-muted/50 hover:border-muted-foreground/30 transition-all rounded-lg",
            selectedValues.length > 0 && "bg-primary/5 border-primary/20 hover:bg-primary/10"
          )}
        >
          <div className="text-muted-foreground">{icon}</div>
          <span className="text-sm font-medium">{label}</span>
          {selectedValues.length > 0 && (
            <div className="flex items-center">
              <Separator orientation="vertical" className="h-4 mx-2 bg-primary/20" />
              <Badge
                variant="secondary"
                className="h-5 min-w-[20px] rounded-full px-1 justify-center bg-primary text-primary-foreground text-[10px] font-bold border-none"
              >
                {selectedValues.length}
              </Badge>
            </div>
          )}
          <ChevronDown className="h-3.5 w-3.5 opacity-40 ml-0.5 group-data-[state=open]:rotate-180 transition-transform duration-200" />
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
                  <div className="mr-2 flex h-5 w-5 items-center justify-center">
                    <option.icon />
                  </div>

                  <span className="flex-1 truncate">{option.label}</span>

                  <div
                    className={cn(
                      "ml-auto flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                      selectedValues.includes(option.value)
                        ? "bg-primary text-primary-foreground"
                        : "opacity-50"
                    )}
                  >
                    <Check
                      className={cn(
                        "h-4 w-4 transition-opacity duration-100",
                        !selectedValues.includes(option.value) && "opacity-0"
                      )}
                    />
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
