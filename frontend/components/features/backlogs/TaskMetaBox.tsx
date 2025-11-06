import { Clock, User as UserIcon, CalendarIcon, FlagIcon, Network } from "lucide-react";
import { Status } from "@/types/status.interaface";
import { DatePicker } from "@/components/shared/DatePicker";
import { PriorityPicker } from "@/components/shared/PriorityPicker";
import { StatusPicker } from "@/components/shared/StatusPicker";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DetailRow } from "@/components/shared/DetailRow";
import { Task } from "@/types/task.type";

interface TaskMetaBoxProps {
  task: Task;
  statuses: Status[];
  onStatusChange: (statusId: string) => void;
  onDateChange: (date: Date | undefined) => void;
  onPriorityChange: (priority: Task["priority"]) => void;
  getAssigneeInitial: (id: string) => string;
}

export function TaskMetaBox({
  task,
  statuses,
  onStatusChange,
  onDateChange,
  onPriorityChange,
  getAssigneeInitial,
}: TaskMetaBoxProps) {
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
