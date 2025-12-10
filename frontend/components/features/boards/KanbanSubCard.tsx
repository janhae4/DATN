import { useTaskManagementContext } from '@/components/providers/TaskManagementContext';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Task } from '@/types';
import { Check, GitCommit } from 'lucide-react';
import React from 'react'
import { toast } from 'sonner';

export default function SubtaskCard({ task, doneListId }: { task: Task; doneListId: string | null }) {
  const { setSelectedTask, handleListChange } = useTaskManagementContext()
  const isCompleted = doneListId && task.listId === doneListId;
  return (
    <div
      className="group/subtask flex items-center gap-2 p-2 rounded-md border bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
      onClick={(e) => {
        e.stopPropagation();
        setSelectedTask(task);
      }}
    >
      <GitCommit className="h-3 w-3 text-muted-foreground shrink-0" />
      <span
        className={`text-xs font-medium truncate flex-1 ${
          isCompleted ? 'line-through text-muted-foreground' : ''
        }`}
      >
        {task.title}
      </span>
      {!isCompleted && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="opacity-0 group-hover/subtask:opacity-100 transition-opacity cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                if (doneListId) {
                  handleListChange(task.id, doneListId);
                  toast.success(`"${task.title}" has been completed!`)
                }
              }}
            >
              <Check className="h-3 w-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            Mark complete
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  )
}
