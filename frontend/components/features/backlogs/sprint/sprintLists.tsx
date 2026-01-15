// components/features/backlogs/SprintList.tsx
"use client";

import * as React from "react";
import { Sprint } from "@/types";
import { Task } from "@/types";
import { Accordion } from "@/components/ui/accordion";
import { useTaskManagementContext } from "@/components/providers/TaskManagementContext";
import { SprintItem } from "./SprintItem";
import { SprintStatus } from "@/types/common/enums";
import { useTasks } from "@/hooks/useTasks";
import { useParams } from "next/navigation";
import { useLists } from "@/hooks/useList";
import { useSprints } from "@/hooks/useSprints";

interface SprintListProps {
  tasks: Task[];
  sprints: Sprint[];
  allTasks: Task[];
  selectedIds: string[];
  onSelect: (taskId: string, checked: boolean) => void;
  onRowClick: (task: Task) => void;
  onUpdateTask: (taskId: string, updates: any) => void;
  onMultiSelectChange: (ids: string[]) => void;
}

export const SprintList = React.memo(SprintListComponent);

function SprintListComponent({
  sprints,
  tasks,
  allTasks,
  selectedIds,
  onSelect,
  onRowClick,
  onUpdateTask,
  onMultiSelectChange,
}: SprintListProps) {
  const params = useParams();
  const projectId = params.projectId as string;

  const { lists } = useLists(projectId);

  const activeSprints = React.useMemo(
    () =>
      sprints.filter(
        (s) =>
          s.status === SprintStatus.ACTIVE || s.status === SprintStatus.PLANNED
      ),
    [sprints]
  );

  return (
    <div className="flex flex-col gap-2 w-full">
      {activeSprints.map((sprint: Sprint) => (
        <SprintItem
          key={sprint.id}
          sprint={sprint}
          tasks={tasks}
          allTasks={allTasks}
          statusesList={lists}
          handleRowClick={onRowClick}
          selectedIds={selectedIds}
          onSelect={onSelect}
          onUpdateTask={onUpdateTask}
          onMultiSelectChange={onMultiSelectChange}
        />
      ))}
    </div>
  );
}
