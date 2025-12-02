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
import { Label } from "@/components/ui/label";
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
import { DateRangePicker } from "@/components/shared/DateRangePicker";
import { useTaskManagementContext } from "@/components/providers/TaskManagementContext";

interface StartSprintDialogProps {
  children: React.ReactNode;
  sprint: Sprint;
}

export function StartSprintDialog({
  children,
  sprint,
}: StartSprintDialogProps) {
  const [open, setOpen] = React.useState(false);
  const { projectId } = useTaskManagementContext();
  const { updateSprint, isUpdating } = useSprints(projectId);

  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(undefined);
  const [duration, setDuration] = React.useState("custom");

  React.useEffect(() => {
    if (open) {
      const startDate = sprint.startDate ? new Date(sprint.startDate) : new Date();
      const endDate = sprint.endDate ? new Date(sprint.endDate) : new Date();
      
      // Default to 2 weeks if dates are invalid
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
         const start = new Date();
         const end = new Date();
         end.setDate(start.getDate() + 14);
         setDateRange({ from: start, to: end });
         setDuration("2w");
      } else {
         setDateRange({ from: startDate, to: endDate });
         // Calculate duration logic...
      }
    }
  }, [open, sprint]);

  // ... (handleDurationChange giữ nguyên)
  const handleDurationChange = (value: string) => {
    setDuration(value);
    if (value === "custom") return;
    const weeks = parseInt(value);
    const days = weeks * 7;
    const startDate = dateRange?.from || new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + days);
    setDateRange({ from: startDate, to: endDate });
  };
    
  const handleDateRangeSelect = (range: DateRange | undefined) => {
      setDateRange(range);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dateRange?.from || !dateRange?.to) {
        toast.error("Please select a date range");
        return;
    }

    try {
      // Gọi API update status -> ACTIVE
      await updateSprint(sprint.id, {
          // Mapping camelCase -> snake_case cho Backend DTO
          start_date: dateRange.from.toISOString(),
          end_date: dateRange.to.toISOString(),
          status: SprintStatus.ACTIVE
      });
      
      toast.success(`Sprint "${sprint.title}" started!`);
      setOpen(false);
    } catch (error) {
      console.error("Error starting sprint:", error);
      toast.error("Failed to start sprint.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild onClick={(e) => e.stopPropagation()}>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Start Sprint: {sprint.title}</DialogTitle>
            <DialogDescription>
              {sprint.goal || "Let's get to work!"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
             <div className="grid gap-4">
              <div className="space-y-2">
                <Label>Duration</Label>
                <Select value={duration} onValueChange={handleDurationChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1w">1 week</SelectItem>
                    <SelectItem value="2w">2 weeks</SelectItem>
                    <SelectItem value="3w">3 weeks</SelectItem>
                    <SelectItem value="4w">4 weeks</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Start & End date</Label>
                <DateRangePicker
                  range={dateRange}
                  onRangeSelect={handleDateRangeSelect}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" type="button" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isUpdating}>
              {isUpdating ? "Starting..." : "Start Sprint"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}