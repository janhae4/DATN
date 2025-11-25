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
  const { updateSprint } = useSprints(projectId);

  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(
    undefined
  );
  const [duration, setDuration] = React.useState("custom");

  React.useEffect(() => {
    if (open) {
      const startDate = sprint.startDate ? new Date(sprint.startDate) : new Date();
      const endDate = sprint.endDate ? new Date(sprint.endDate) : new Date();
      
      // If dates are invalid or not set, default to 3 weeks from now
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
         const start = new Date();
         const end = new Date();
         end.setDate(start.getDate() + 21);
         setDateRange({ from: start, to: end });
         setDuration("3w");
      } else {
         setDateRange({ from: startDate, to: endDate });
         // Calculate duration to set the select box if it matches standard durations
         const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
         const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
         if (diffDays === 7) setDuration("1w");
         else if (diffDays === 14) setDuration("2w");
         else if (diffDays === 21) setDuration("3w");
         else if (diffDays === 28) setDuration("4w");
         else setDuration("custom");
      }
    }
  }, [open, sprint]);

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
    
    if (!dateRange?.from || !dateRange?.to) {
        toast.error("Please select a date range");
        return;
    }

    try {
      await updateSprint(sprint.id, {
          startDate: dateRange.from.toISOString(),
          endDate: dateRange.to.toISOString(),
          status: SprintStatus.ACTIVE
      });
      
      toast.success(`Sprint "${sprint.title}" started!`);
      setOpen(false);
    } catch (error) {
      console.error("Error starting sprint:", error);
      toast.error("Failed to start sprint. Please try again.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild onClick={(e) => e.stopPropagation()}>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit} className="space-t-4">
          <DialogHeader>
            <DialogTitle>Start Sprint: {sprint.title}</DialogTitle>
            <DialogDescription>
              {sprint.goal ? `Goal: ${sprint.goal}` : "No goal set for this sprint."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
             <div className="flex gap-3">
              <div className="space-y-2">
                <Label>Duration</Label>
                <Select value={duration} onValueChange={handleDurationChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent defaultValue="1w">
                    <SelectItem value="custom">Custom</SelectItem>
                    <SelectItem value="1w">1 week</SelectItem>
                    <SelectItem value="2w">2 weeks</SelectItem>
                    <SelectItem value="3w">3 weeks</SelectItem>
                    <SelectItem value="4w">4 weeks</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className=" space-y-2 w-full">
                <Label>Start & End date</Label>
                <DateRangePicker
                  range={dateRange}
                  onRangeSelect={handleDateRangeSelect}
                />
              </div>
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
            <Button type="submit">Start Sprint</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
