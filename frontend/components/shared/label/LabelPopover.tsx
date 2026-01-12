"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { Tags } from "lucide-react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import { LabelInput } from "./LabelInput";
import { LabelEdit } from "./LabelEdit";
import { useLabels } from "@/hooks/useLabels";
import { useDeleteTaskLabel } from "@/hooks/useTaskLabel";
import { Label, TaskLabel } from "@/types";

export interface LabelPopoverProps {
  initialSelectedLabels: (TaskLabel | Label)[];
  taskId: string;
  onSelectionChange: (newLabels: Label[]) => void;
}

export function LabelPopover({
  initialSelectedLabels = [],
  taskId,
  onSelectionChange,
}: LabelPopoverProps) {
  const params = useParams();
  const projectId = params.projectId as string;

  const { labels: allLabels = [] } = useLabels(projectId);
  const { mutate: deleteTaskLabel } = useDeleteTaskLabel();

  const [selectedLabels, setSelectedLabels] = React.useState<Label[]>([]);
  const [inputValue, setInputValue] = React.useState("");
  const [isOpen, setIsOpen] = React.useState(false);

  const formattedSelectedLabels = React.useMemo<Label[]>(() => {
    return initialSelectedLabels.map((tl) => ({
      id: (tl as any).labelId || tl.id,
      name: tl.name,
      color: tl.color,
      projectId: tl.projectId,
      createdAt: "",
      updatedAt: "",
    }));
  }, [initialSelectedLabels]);

  React.useEffect(() => {
    setSelectedLabels(formattedSelectedLabels);
  }, [formattedSelectedLabels]);

  const updateSelection = (newFullList: Label[]) => {
    const newItemsOnly = newFullList.filter(
      (newItem) => !selectedLabels.some((oldItem) => oldItem.id === newItem.id)
    );
    const removedItems = selectedLabels.filter(
      (oldItem) => !newFullList.some((newItem) => newItem.id === oldItem.id)
    );

    setSelectedLabels(newFullList);

    if (newItemsOnly.length > 0) {
      onSelectionChange(newItemsOnly);
    }

    if (removedItems.length > 0) {
      removedItems.forEach((label) => {
        deleteTaskLabel({ taskId, labelId: label.id });
      });
    }
  };

  const handleSelectFromList = (labelToAdd: Label) => {
    const isAlreadySelected = selectedLabels.some(
      (l) => l.id === labelToAdd.id
    );

    if (!isAlreadySelected) {
      const fullListForUI = [...selectedLabels, labelToAdd];
      setSelectedLabels(fullListForUI);
      onSelectionChange([labelToAdd]);
    }

    setInputValue("");
  };

  const availableLabels = React.useMemo(() => {
    const selectedIds = new Set(selectedLabels.map((l) => l.id));
    return allLabels.filter((l) => !selectedIds.has(l.id));
  }, [allLabels, selectedLabels]);

  const filteredAvailableLabels = React.useMemo(() => {
    if (!inputValue) return availableLabels;
    return availableLabels.filter((label) =>
      label.name.toLowerCase().includes(inputValue.toLowerCase())
    );
  }, [availableLabels, inputValue]);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-6 w-6 rounded-md text-muted-foreground"
                onClick={(e) => e.stopPropagation()}
              >
                <Tags className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent className="text-xs">Labels</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <PopoverContent
        className="w-80 p-0"
        align="start"
        side="bottom"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-3">
          <LabelInput
            initialTags={selectedLabels}
            onChange={updateSelection}
            placeholder="Search or create tag..."
            inputValue={inputValue}
            onInputChange={setInputValue}
          />
        </div>

        <Separator />

        <div className="p-2">
          <p className="text-xs font-medium text-muted-foreground px-2 mb-2">
            Available labels
          </p>

          <div className="flex flex-col gap-1 max-h-[200px] overflow-y-auto">
            {filteredAvailableLabels.length > 0 ? (
              filteredAvailableLabels.map((label) => (
                <div
                  key={label.id}
                  className="flex items-center justify-between rounded-sm px-2 py-1.5 hover:bg-accent cursor-pointer group transition-colors"
                  onClick={() => handleSelectFromList(label)}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: label.color }}
                    />
                    <span className="text-sm truncate font-medium">
                      {label.name}
                    </span>
                  </div>

                  <div
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <LabelEdit data={label} />
                  </div>
                </div>
              ))
            ) : (
              <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                {inputValue
                  ? `Press Enter to create "${inputValue}"`
                  : "No more labels available."}
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
