import * as React from "react";
import { Clock, User as UserIcon, CalendarIcon, FlagIcon, Network, Tag, Plus } from "lucide-react";
import { List } from "@/types";
import { DatePicker } from "@/components/shared/DatePicker";
import { PriorityPicker } from "@/components/shared/PriorityPicker";
import { ListPicker } from "@/components/shared/list/ListPicker";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DetailRow } from "@/components/shared/DetailRow";
import { Task } from "@/types";
import { LabelPopover } from "@/components/shared/label/LabelPopover";
import { Label } from "@/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { db } from "@/public/mock-data/mock-data";
import { AssigneePicker } from "@/components/shared/assignee/AssigneePicker";
import LabelTag from "@/components/shared/label/LabelTag";

interface TaskMetaBoxProps {
  task: Task;
  lists: List[];
  onListChange: (listId: string) => void;
  onDateChange: (date: Date | undefined) => void;
  onPriorityChange: (priority: Task["priority"]) => void;
  onAssigneeChange: (assigneeIds: string[]) => void;
  getAssigneeInitial: (id: string) => string;
  onLabelsChange?: (labelIds: string[]) => void;
}

export function TaskMetaBox({
  task,
  lists,
  onListChange,
  onDateChange,
  onPriorityChange,
  onAssigneeChange,
  getAssigneeInitial,
  onLabelsChange,
}: TaskMetaBoxProps) {
  const [isLabelPopoverOpen, setIsLabelPopoverOpen] = React.useState(false);

  const handleLabelsChange = (newLabels: Label[]) => {
    if (onLabelsChange) {
      onLabelsChange(newLabels.map(label => label.id));
    }
  };
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">Details</h3>
      <div className="space-y-4 rounded-md border p-4">
        <DetailRow icon={<Clock className="h-4 w-4" />} label="Status">
          <ListPicker
            lists={lists}
            value={task.listId || undefined}
            onChange={onListChange}
          />
        </DetailRow>

        <DetailRow icon={<UserIcon className="h-4 w-4" />} label="Assignees">
          <div className="flex -space-x-2">
            <AssigneePicker
              value={task.assigneeIds || []}
              onChange={onAssigneeChange}
            />
          </div>
        </DetailRow>

        <DetailRow icon={<CalendarIcon className="h-4 w-4" />} label="Due date">
          <DatePicker
            date={task.dueDate ? new Date(task.dueDate) : undefined}
            onDateSelect={onDateChange}
          />
        </DetailRow>

        <DetailRow icon={<FlagIcon className="h-4 w-4" />} label="Priority">
          <PriorityPicker
            priority={task.priority}
            onPriorityChange={onPriorityChange}
          />
        </DetailRow>

        <DetailRow icon={<Tag className="h-4 w-4" />} label="Labels">
          <div className="flex flex-wrap gap-1 items-center">
            {task.labelIds?.map((labelId) => {
              const label = db.labels.find((l: Label) => l.id === labelId);
              return label ? (
                <LabelTag 
                  key={label.id} 
                  label={label}
                  className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium"
                  onRemove={() => {
                    // Create a new array without the removed label
                    const newLabelIds = task.labelIds?.filter(id => id !== labelId) || [];
                    if (onLabelsChange) {
                      // Pass the array of label IDs
                      onLabelsChange(newLabelIds);
                    }
                  }}
                />
              ) : null;
            })}
            <div className="inline-flex items-center">
              <LabelPopover
                initialSelectedLabelIds={task.labelIds || []}
                onSelectionChange={handleLabelsChange}
              />
            </div>
          </div>
        </DetailRow>

        {task.epicId && (
          <DetailRow icon={<Network className="h-4 w-4" />} label="Epic">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-blue-500" />
              <span className="text-sm">Epic Name</span>
            </div>
          </DetailRow>
        )}
      </div>
    </div>
  );
}
