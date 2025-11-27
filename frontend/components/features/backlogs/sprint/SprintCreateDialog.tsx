"use client";

import * as React from "react";
import { DateRange } from "react-day-picker";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSprints } from "@/hooks/useSprints";
import { toast } from "sonner";
import { Sprint } from "@/types";
import { SprintStatus } from "@/types/common/enums";
import { useTaskManagementContext } from "@/components/providers/TaskManagementContext";
import { cn } from "@/lib/utils";

import { Circle, CircleEllipsis, CheckCircle2, Archive } from "lucide-react";

const statusMap: Record<
  SprintStatus,
  { label: string; icon: React.ElementType; color: string }
> = {
  [SprintStatus.PLANNED]: {
    label: "Planned",
    icon: Circle,
    color: "text-neutral-500",
  },
  [SprintStatus.ACTIVE]: {
    label: "Active",
    icon: CircleEllipsis,
    color: "text-blue-500",
  },
  [SprintStatus.COMPLETED]: {
    label: "Completed",
    icon: CheckCircle2,
    color: "text-green-500",
  },
  [SprintStatus.ARCHIVED]: {
    label: "Archived",
    icon: Archive,
    color: "text-gray-500",
  },
};
const statusOptions = Object.values(SprintStatus);

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
  const { createSprint } = useSprints(projectId);

  const [title, setTitle] = React.useState("");
  const [goal, setGoal] = React.useState("");
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(
    undefined
  );
  const [duration, setDuration] = React.useState("3w");

  React.useEffect(() => {
    if (open) {
      setTitle("");
      setGoal("");
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + 21);
      setDateRange({ from: startDate, to: endDate });
      setDuration("3w");
    }
  }, [open]);

  const handleDurationChange = (value: string) => {
    setDuration(value);
    if (value === "custom") return;

    const weeks = parseInt(value); // 1w -> 1
    const days = weeks * 7;

    const startDate = dateRange?.from || new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + days);

    setDateRange({ from: startDate, to: endDate });
  };

  const handleDateRangeSelect = (range: DateRange | undefined) => {
    setDateRange(range);
    if (range?.from && range?.to) {
      const diffTime = Math.abs(range.to.getTime() - range.from.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 7) setDuration("1w");
      else if (diffDays === 14) setDuration("2w");
      else if (diffDays === 21) setDuration("3w");
      else if (diffDays === 28) setDuration("4w");
      else setDuration("custom");
    } else {
      setDuration("custom");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) {
      toast.error("Title is required");
      return;
    }

    try {
      const newSprint: Sprint = {
        id: `sprint-${Date.now()}`,
        title: title.trim(),
        goal: goal.trim() || undefined,
        status: SprintStatus.PLANNED,
        projectId: projectId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await createSprint(newSprint);
      toast.success(`Sprint "${title}" created!`);
      onSave?.();
      setOpen(false);
    } catch (error) {
      console.error("Error creating sprint:", error);
      toast.error("Failed to create sprint. Please try again.");
    }
  };

  const renderOption = (
    Icon: React.ElementType,
    label: string,
    color: string
  ) => (
    <div className="flex items-center gap-2">
      <Icon className={cn("h-4 w-4", color)} />
      <span className="capitalize">{label}</span>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit} className="space-t-4">
          <DialogHeader>
            <DialogTitle>Create Sprint</DialogTitle>
            <DialogDescription>
              Add a new sprint to your project
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter sprint title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="goal">Goal</Label>
              <Textarea
                id="goal"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="Enter sprint goal (optional)"
                rows={4}
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
            <Button type="submit">Create</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
