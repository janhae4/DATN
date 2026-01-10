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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSprints } from "@/hooks/useSprints";
import { toast } from "sonner";
import { SprintStatus } from "@/types/common/enums";
import { useTaskManagementContext } from "@/components/providers/TaskManagementContext";
import { useParams } from "next/navigation";
import { HelpTooltip } from "@/components/shared/HelpTooltip";

interface SprintCreateDialogProps {
  children: React.ReactNode;
  onSave?: () => void;
}

export function SprintCreateDialog({
  children,
  onSave,
}: SprintCreateDialogProps) {
  const [open, setOpen] = React.useState(false);
  const { projectId } = useTaskManagementContext();
  const param = useParams();
  const teamId = param?.teamId as string;
  const { createSprint, isCreating } = useSprints(projectId, teamId);

  const [title, setTitle] = React.useState("");
  const [goal, setGoal] = React.useState("");

  // Reset form khi mở dialog
  React.useEffect(() => {
    if (open) {
      setTitle("");
      setGoal("");
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) {
      toast.error("Title is required");
      return;
    }

    try {
      // Gọi API tạo Sprint mới KHÔNG CÓ start_date/end_date
      await createSprint({
        title: title.trim(),
        goal: goal.trim() || undefined,
        projectId: projectId,
        status: SprintStatus.PLANNED,
        start_date: new Date().toISOString(),
        end_date: new Date().toISOString(),
        teamId: teamId,
      });

      toast.success(`Sprint "${title}" created!`);
      onSave?.();
      setOpen(false);
    } catch (error) {
      console.error("Error creating sprint:", error);
      toast.error("Failed to create sprint. Please try again.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">Create Sprint <HelpTooltip text="A sprint is a short, time-boxed period when a scrum team works to complete a set amount of work." /></DialogTitle>
            <DialogDescription>
              Add a new sprint to your project (Plan dates later).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 px-1">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Sprint name (e.g. Sprint 10)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="goal">Goal</Label>
              <Textarea
                id="goal"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="What should we achieve this sprint?"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
