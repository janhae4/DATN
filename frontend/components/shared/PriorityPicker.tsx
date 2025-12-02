"use client";

import * as React from "react";
import { FlagIcon, Ban } from "lucide-react"; // Use 'Ban' icon for 'No Priority'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Priority } from "@/types/common/enums"; // Import Priority Enum

// Helper to get priority color
const getPriorityColor = (priority?: Priority | null) => {
  switch (priority) {
    case Priority.URGENT:
      return "text-red-600";
    case Priority.HIGH:
      return "text-red-500";
    case Priority.MEDIUM:
      return "text-yellow-500";
    case Priority.LOW:
      return "text-blue-500";
    case null:
    case undefined:
      return "text-muted-foreground/50 hover:text-muted-foreground";
    default:
      return "text-muted-foreground/50 hover:text-muted-foreground";
  }
};

// Define options based on Enum
const priorities: { value: Priority; label: string }[] = [
  //   { value: Priority.URGENT, label: "Urgent" },
  { value: Priority.HIGH, label: "High" },
  { value: Priority.MEDIUM, label: "Medium" },
  { value: Priority.LOW, label: "Low" },
];

// Helper to get priority label
const getPriorityLabel = (priority?: Priority | null) => {
  switch (priority) {
    // case Priority.URGENT:
    //   return "Urgent"
    case Priority.HIGH:
      return "High";
    case Priority.MEDIUM:
      return "Medium";
    case Priority.LOW:
      return "Low";
    case null:
    case undefined:
      return "No Priority";
    default:
      return "No Priority";
  }
};
interface PriorityPickerProps {
  priority?: Priority | null
  onPriorityChange: (priority: Priority | null) => void
  disabled?: boolean
}

export function PriorityPicker({
  priority,
  onPriorityChange,
  disabled = false,
}: PriorityPickerProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-7 px-2 flex items-center gap-2",
            getPriorityColor(priority),
            disabled && "opacity-50 cursor-not-allowed hover:bg-transparent"
          )}
          onClick={(e) => e.stopPropagation()}
          disabled={disabled}
        >
          <FlagIcon className="h-4 w-4" />
          <span className="text-xs font-medium hidden group-hover:inline-block sm:inline-block">
             {getPriorityLabel(priority)}
          </span>
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-40 p-1" align="start" onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-col gap-1">
          {priorities.map((p) => (
            <Button
              key={p.value}
              variant="ghost"
              size="sm"
              className="justify-start gap-2 h-8"
              onClick={(e) => {
                e.stopPropagation()
                onPriorityChange(p.value)
                setOpen(false)
              }}
            >
              <FlagIcon className={cn("h-4 w-4", getPriorityColor(p.value))} />
              <span className="text-sm">{p.label}</span>
            </Button>
          ))}
          
          <div className="h-px bg-muted my-1" />

          <Button
            variant="ghost"
            size="sm"
            className="justify-start gap-2 h-8 text-muted-foreground"
            onClick={(e) => {
              e.stopPropagation()
              onPriorityChange(null)
              setOpen(false)
            }}
          >
            <Ban className="h-4 w-4" />
            <span className="text-sm">No Priority</span>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}