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
import { useLists } from "@/hooks/useList";
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
  const {
    projectId,
    data: allTasks,
    sprints,
    handleSprintChange,
  } = useTaskManagementContext();
  const { updateSprint, isUpdating } = useSprints(projectId, sprint.teamId);
  const { lists } = useLists(projectId);

  const [moveToSprintId, setMoveToSprintId] = React.useState<string>("backlog");

  const sprintTasks = React.useMemo(
    () => allTasks.filter((t) => t.sprintId === sprint.id),
    [allTasks, sprint.id]
  );

  const uncompletedTasks = React.useMemo(() => {
    const doneListIds = lists
      .filter((l) => l.category === ListCategoryEnum.DONE)
      .map((l) => l.id);
    return sprintTasks.filter((t) => !doneListIds.includes(t.listId));
  }, [sprintTasks, lists]);

  const completedTasksCount = sprintTasks.length - uncompletedTasks.length;

  const availableSprints = React.useMemo(
    () =>
      sprints.filter(
        (s) =>
          s.id !== sprint.id &&
          s.status !== SprintStatus.COMPLETED &&
          s.status !== SprintStatus.ARCHIVED
      ),
    [sprints, sprint.id]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (uncompletedTasks.length > 0) {
        const targetSprintId =
          moveToSprintId === "backlog" ? null : moveToSprintId;
        await Promise.all(
          uncompletedTasks.map((task) =>
            handleSprintChange(task.id, targetSprintId)
          )
        );
      }

      await updateSprint(sprint.id, {
        status: SprintStatus.COMPLETED,
      });

      toast.success(`Sprint "${sprint.title}" completed!`);
      setOpen(false);
    } catch (error) {
      console.error("Error completing sprint:", error);
      toast.error("Failed to complete sprint.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild onClick={(e) => e.stopPropagation()}>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          {/* Header & Body (Giữ nguyên) */}
          <DialogHeader>
            <DialogTitle>Complete Sprint: {sprint.title}</DialogTitle>
            <DialogDescription>
              {completedTasksCount} completed tasks. {uncompletedTasks.length}{" "}
              open tasks.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            {uncompletedTasks.length > 0 && (
              <div className="space-y-2">
                <Label>Move open tasks to:</Label>
                <Select
                  value={moveToSprintId}
                  onValueChange={setMoveToSprintId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select destination" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="backlog">Backlog</SelectItem>
                    {availableSprints.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              type="button"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isUpdating}>
              {isUpdating ? "Completing..." : "Complete Sprint"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
