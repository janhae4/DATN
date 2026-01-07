import React from "react";
import { ViewMode } from "gantt-task-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { HelpTooltip } from "../HelpTooltip";

type ViewSwitcherProps = {
  isChecked: boolean;
  onViewListChange: (isChecked: boolean) => void;
  onViewModeChange: (viewMode: ViewMode) => void;
  currentViewMode: ViewMode;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
};

export const ViewSwitcher: React.FC<ViewSwitcherProps> = ({
  onViewModeChange,
  onViewListChange,
  isChecked,
  currentViewMode,
  searchQuery,
  onSearchQueryChange,
}) => {
  return (
    <div id="gantt-view-switcher" className="flex items-center justify-start gap-6 py-4 flex-wrap">
      <div className="flex items-center gap-2 mr-2">
        <h2 className="text-lg font-semibold tracking-tight">Timeline</h2>
        <HelpTooltip text="A Gantt chart is a visual project management tool that helps in planning and scheduling projects of all sizes. It shows the project schedule and the dependency relationships between activities." />
      </div>

      {/* 1. Phần chọn View Mode */}
      <div className="flex items-center gap-2">
        <Label className="text-sm font-medium text-muted-foreground hidden sm:block">
          View Mode:
        </Label>
        <Select
          value={currentViewMode}
          onValueChange={(value) => onViewModeChange(value as ViewMode)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select view mode" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ViewMode.Hour}>Hour</SelectItem>
            <SelectItem value={ViewMode.QuarterDay}>Quarter of Day</SelectItem>
            <SelectItem value={ViewMode.HalfDay}>Half of Day</SelectItem>
            <SelectItem value={ViewMode.Day}>Day</SelectItem>
            <SelectItem value={ViewMode.Week}>Week</SelectItem>
            <SelectItem value={ViewMode.Month}>Month</SelectItem>
            <SelectItem value={ViewMode.Year}>Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Input
          type="text"
          placeholder="Filter tasks..."
          className="w-[200px]"
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
        />
      </div>


      <div className="flex items-center space-x-2 ml-auto">
        <Switch
          id="show-task-list"
          checked={isChecked}
          onCheckedChange={onViewListChange}
        />
        <Label htmlFor="show-task-list" className="cursor-pointer">
          Show Task List
        </Label>
      </div>
    </div>
  );
};