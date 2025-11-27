"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useSprints } from "@/hooks/useSprints";
import { toast } from "sonner";
import { Sprint } from "@/types";
import { SprintStatus, ListCategoryEnum } from "@/types/common/enums";
import { useTaskManagementContext } from "@/components/providers/TaskManagementContext";
import { useList } from "@/hooks/useList";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface CompleteSprintDialogProps {
  children: React.ReactNode;
  sprint: Sprint;
}

export function CompleteSprintDialog({
  children,
  sprint,
}: CompleteSprintDialogProps) {
  const [open, setOpen] = React.useState(false);
  const { projectId, data: allTasks, sprints, handleSprintChange } = useTaskManagementContext();
  const { updateSprint } = useSprints(projectId);
  const { lists } = useList(projectId);

  const [moveToSprintId, setMoveToSprintId] = React.useState<string>("backlog");

  // Filter tasks in this sprint
  const sprintTasks = React.useMemo(() => 
    allTasks.filter(t => t.sprintId === sprint.id), 
  [allTasks, sprint.id]);

  // Identify uncompleted tasks
  const uncompletedTasks = React.useMemo(() => {
    // Find lists that are NOT "Done"
    const doneListIds = lists
      .filter(l => l.category === ListCategoryEnum.DONE)
      .map(l => l.id);
    
    return sprintTasks.filter(t => !doneListIds.includes(t.listId));
  }, [sprintTasks, lists]);

  const completedTasksCount = sprintTasks.length - uncompletedTasks.length;

  // Available destinations: Backlog + Planned/Active sprints (excluding current)
  const availableSprints = React.useMemo(() => 
    sprints.filter(s => s.id !== sprint.id && s.status !== SprintStatus.COMPLETED && s.status !== SprintStatus.ARCHIVED),
  [sprints, sprint.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // 1. Move uncompleted tasks
      if (uncompletedTasks.length > 0) {
        const targetSprintId = moveToSprintId === "backlog" ? null : moveToSprintId;
        
        // We need to update each task. 
        // Ideally we'd have a bulk update API, but for now we loop.
        // Using Promise.all for parallel execution.
        await Promise.all(uncompletedTasks.map(task => 
          handleSprintChange(task.id, targetSprintId)
        ));
      }

      // 2. Complete the sprint
      await updateSprint(sprint.id, {
          status: SprintStatus.COMPLETED
      });
      
      toast.success(`Sprint "${sprint.title}" completed!`);
      setOpen(false);
    } catch (error) {
      console.error("Error completing sprint:", error);
      toast.error("Failed to complete sprint. Please try again.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild onClick={(e) => e.stopPropagation()}>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Complete Sprint: {sprint.title}</DialogTitle>
            <DialogDescription>
              Review the sprint summary and decide where to move remaining tasks.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 space-y-4">
             <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Completed Tasks:</span>
                <span className="font-medium">{completedTasksCount}</span>
             </div>
             <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Open Tasks:</span>
                <span className="font-medium">{uncompletedTasks.length}</span>
             </div>

             {uncompletedTasks.length > 0 && (
               <div className="space-y-2 pt-2 border-t">
                 <Label>Move open tasks to:</Label>
                 <Select value={moveToSprintId} onValueChange={setMoveToSprintId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select destination" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="backlog">Backlog</SelectItem>
                      {availableSprints.map(s => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.title} ({s.status})
                        </SelectItem>
                      ))}
                    </SelectContent>
                 </Select>
                 <p className="text-xs text-muted-foreground">
                   {uncompletedTasks.length} incomplete tasks will be moved to the selected destination.
                 </p>
               </div>
             )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Complete Sprint</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
