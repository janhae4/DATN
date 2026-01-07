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
import { getAssigneeInitial, priorityMap } from "@/lib/backlog-utils";
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

import { SprintCreateDialog } from "./sprint/SprintCreateDialog";
import { CompleteSprintDialog } from "./sprint/CompleteSprintDialog";
import { SuggestTaskByAi } from "./task/SuggestTaskByAi";
import { CreateTaskDto } from "@/services/taskService";
import { HelpTooltip } from "@/components/shared/HelpTooltip";

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
}

export function BacklogFilterBar({
  showCreateSprint = true,
  showStatusFilter = true,
  showSprintDone = false,
  filters,
  onFilterChange,
  createTasks,
  suggestTaskByAi,
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
    <div id="backlog-filter-bar" className="flex flex-col w-full gap-3 py-2">
      <div className="flex flex-col lg:flex-row w-full items-center gap-3">
        <div className="relative w-full lg:flex-1">
          <Input
            placeholder="Search by title..."
            className="h-10 w-full lg:w-8/12 pl-10 focus-visible:ring-primary shadow-sm"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            <Search className="h-4 w-4" />
          </div>
        </div>

        <div className="flex items-center gap-4 w-full lg:w-auto justify-end">
          <div className="flex items-center gap-2 flex-1 lg:flex-none">
            <SuggestTaskByAi
              onSave={(tasks, epic, sprintId) =>
                createTasks({ tasks, epic, sprintId })
              }
              suggestTaskByAi={suggestTaskByAi}
            >
              <Button
                variant="outline"
                size="sm"
                className="h-10 px-3 border-primary/20 text-primary whitespace-nowrap w-full"
              >
                <SparkleIcon className="mr-1.5 h-4 w-4" />
                <span className="hidden xl:inline">Suggest Tasks</span>
                <span className="xl:hidden">AI</span>
              </Button>
            </SuggestTaskByAi>
            <HelpTooltip text="Use AI to automatically suggest and generate tasks based on your project context." />
          </div>

          {activeSprint && !showCreateSprint && (
            <CompleteSprintDialog sprint={activeSprint}>
              <Button
                variant="outline"
                size="sm"
                className="h-10 px-3 whitespace-nowrap flex-1 lg:flex-none"
              >
                Complete
              </Button>
            </CompleteSprintDialog>
          )}

          {showCreateSprint && (
            <div className="flex items-center gap-2 flex-1 lg:flex-none">
              <SprintCreateDialog onSave={() => { }}>
                <Button
                  variant="default"
                  size="sm"
                  className="h-10 px-3 whitespace-nowrap w-full"
                >
                  New Sprint
                </Button>
              </SprintCreateDialog>
              <HelpTooltip text="Create a new sprint to plan and track work for a specific time period." />
            </div>
          )}
        </div>
      </div>
      {/* Assignee Filter */}
      <div className="flex flex-wrap items-center gap-4 overflow-x-auto pb-1 lg:pb-0 no-scrollbar">
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
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={u.avatar} />
                    <AvatarFallback className="text-[10px]">
                      {getAssigneeInitial(u.name)}
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

        {/* Label Filter */}
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
            className="h-9 px-2 text-muted-foreground hover:text-destructive transition-colors"
            onClick={resetFilters}
          >
            <X className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Clear</span>
          </Button>
        )}
      </div>

      <div className="hidden lg:block flex-1" />
    </div>
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
