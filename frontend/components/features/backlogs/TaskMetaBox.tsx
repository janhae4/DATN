"use client";

import * as React from "react";
import { Clock, User as UserIcon, CalendarIcon, FlagIcon, Network, Tag } from "lucide-react";
import { Task, Label, User, List } from "@/types";
import { DatePicker } from "@/components/shared/DatePicker";
import { PriorityPicker } from "@/components/shared/PriorityPicker";
import { ListPicker } from "@/components/shared/list/ListPicker";
import { DetailRow } from "@/components/shared/DetailRow";
import { LabelPopover } from "@/components/shared/label/LabelPopover";
import { AssigneePicker } from "@/components/shared/assignee/AssigneePicker";
import LabelTag from "@/components/shared/label/LabelTag";

// --- Hooks ---
import { useTasks, useTask } from "@/hooks/useTasks"; // 1. IMPORT useTask
import { useProject } from "@/hooks/useProjects";
import { useTeamMembers } from "@/hooks/useTeam";
import { useTaskLabels } from "@/hooks/useTaskLabel";
import { EpicPicker } from "@/components/shared/epic/EpicPicker";

interface TaskMetaBoxProps {
  task: Task;
  lists: List[];
  onDateChange?: (date: Date | undefined) => void;
  onPriorityChange?: (priority: Task["priority"]) => void;
  onLabelsChange?: (labelIds: string[]) => void;
}

export function TaskMetaBox({
  task: initialTask, // Rename prop to initialTask
  lists,
  onDateChange,
  onPriorityChange,
  onLabelsChange,
}: TaskMetaBoxProps) {

  // 2. USE LIVE DATA FROM CACHE
  // This hook ensures that whenever "task" cache updates, this component re-renders
  const { task: liveTask } = useTask(initialTask.id);

  // 3. MERGE DATA
  // Use live data if available, otherwise fallback to the prop (initial)
  const task = liveTask || initialTask;

  // Setup Hooks for Data & Actions
  const { updateTask } = useTasks(task.projectId);
  const { taskLabels_data } = useTaskLabels(task.id);

  // Fetch Real Users
  const { project } = useProject(task.projectId);
  const { data: members = [] } = useTeamMembers(project?.teamId || null);

  const handleLabelsChange = (newLabels: Label[]) => {
    if (onLabelsChange) {
      onLabelsChange(newLabels.map(l => l.id));
    } else {
      const labelIds = newLabels.map(l => l.id);
      updateTask(task.id, { labelIds });
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">Details</h3>
      <div className="space-y-4 rounded-md border p-4">

        {/* --- STATUS --- */}
        <DetailRow icon={<Clock className="h-4 w-4" />} label="Status">
          <ListPicker
            lists={lists}
            value={task.listId || null} // Now uses "live" task.listId
            onChange={(listId) => updateTask(task.id, { listId })}
          />
        </DetailRow>

        {/* --- ASSIGNEES --- */}
        <DetailRow icon={<UserIcon className="h-4 w-4" />} label="Assignees">
          <div className="flex -space-x-2">
            <AssigneePicker
              users={members}
              value={task.assigneeIds || []} // Now uses "live" task.assigneeIds
              onChange={(assigneeIds) => updateTask(task.id, { assigneeIds })}
            />
          </div>
        </DetailRow>

        {/* --- DUE DATE --- */}
        <DetailRow icon={<CalendarIcon className="h-4 w-4" />} label="Due date">
          <DatePicker
            date={task.dueDate ? new Date(task.dueDate) : undefined}
            onDateSelect={(date) => {
              if (onDateChange) onDateChange(date);
              else updateTask(task.id, { dueDate: date?.toISOString() });
            }}
          />
        </DetailRow>

        {/* --- PRIORITY --- */}
        <DetailRow icon={<FlagIcon className="h-4 w-4" />} label="Priority">
          <PriorityPicker
            priority={task.priority}
            onPriorityChange={(priority) => {
              if (onPriorityChange) onPriorityChange(priority);
              else updateTask(task.id, { priority });
            }}
          />
        </DetailRow>

        {/* --- LABELS --- */}
        <DetailRow icon={<Tag className="h-4 w-4" />} label="Labels">
          <div className="flex flex-wrap gap-1 items-center">
            {taskLabels_data?.map((label) => (
              <LabelTag
                key={label.id}
                label={label}
                className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium"
                onRemove={() => {
                  const newLabelIds = task.labelIds?.filter(id => id !== label.id) || [];
                  handleLabelsChange([]); // Pass empty or proper object if strictly typed
                  updateTask(task.id, { labelIds: newLabelIds });
                }}
              />
            ))}

            <div className="inline-flex items-center">
              <LabelPopover
                taskId={task.id}
                initialSelectedLabels={taskLabels_data || []}
                onSelectionChange={handleLabelsChange}
              />
            </div>
          </div>
        </DetailRow>

        {/* --- EPIC --- */}
        {task.epicId && (
          <DetailRow icon={<Network className="h-4 w-4" />} label="Epic">
            <EpicPicker
              value={task.epicId || null}
              onChange={(epicId) => updateTask(task.id, { epicId })}
            />
          </DetailRow>
        )}
      </div>
    </div>
  );
}