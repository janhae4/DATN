import * as React from "react";
import { Clock, User as UserIcon, CalendarIcon, FlagIcon, Network, Tag, Plus } from "lucide-react";
import { Status } from "@/types/status.interface";
import { LabelTag } from "@/components/shared/label/LabelTag";
import { DatePicker } from "@/components/shared/DatePicker";
import { PriorityPicker } from "@/components/shared/PriorityPicker";
import { StatusPicker } from "@/components/shared/status/StatusPicker";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DetailRow } from "@/components/shared/DetailRow";
import { Task } from "@/types/task.type";
import { LabelPopover } from "@/components/shared/label/LabelPopover";
import { Label } from "@/types/label.interface";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { db } from "@/public/mock-data/mock-data";

interface TaskMetaBoxProps {
  task: Task;
  statuses: Status[];
  onStatusChange: (statusId: string) => void;
  onDateChange: (date: Date | undefined) => void;
  onPriorityChange: (priority: Task["priority"]) => void;
  getAssigneeInitial: (id: string) => string;
  onLabelsChange?: (labelIds: string[]) => void;
}

export function TaskMetaBox({
  task,
  statuses,
  onStatusChange,
  onDateChange,
  onPriorityChange,
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
          <StatusPicker
            statuses={statuses}
            value={task.statusId || undefined}
            onChange={onStatusChange}
          />
        </DetailRow>

        <DetailRow icon={<UserIcon className="h-4 w-4" />} label="Assignees">
          <div className="flex -space-x-2">
            {task.assigneeIds.map((id) => (
              <Avatar key={id} className="h-8 w-8 border-2 border-background">
                <AvatarFallback>{getAssigneeInitial(id)}</AvatarFallback>
              </Avatar>
            ))}
          </div>
        </DetailRow>

        <DetailRow icon={<CalendarIcon className="h-4 w-4" />} label="Due date">
          <DatePicker
            date={task.due_date || undefined}
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
