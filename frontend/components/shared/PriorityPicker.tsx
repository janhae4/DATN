"use client"

import * as React from "react"
import { FlagIcon, CircleSlashIcon } from "lucide-react"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Task } from "@/types/task.type"

// Helper để lấy màu cờ
const getPriorityColor = (priority: Task["priority"]) => {
    switch (priority) {
        case "high":
            return "text-red-500"
        case "medium":
            return "text-yellow-500"
        case "low":
            return "text-blue-500"
        case null:
        case undefined:
            return "text-muted-foreground/50 hover:text-muted-foreground"
        default:
            return "text-muted-foreground/50 hover:text-muted-foreground"
    }
}

// Định nghĩa các lựa chọn
const priorities: { value: Task["priority"]; label: string }[] = [
    { value: "high", label: "High" },
    { value: "medium", label: "Medium" },
    { value: "low", label: "Low" },
]

interface PriorityPickerProps {
    priority: Task["priority"]
    onPriorityChange: (priority: Task["priority"]) => void
    disabled?: boolean
}

// Helper để lấy label của priority
const getPriorityLabel = (priority: Task["priority"]) => {
    switch (priority) {
        case "high":
            return "High"
        case "medium":
            return "Medium"
        case "low":
            return "Low"
        case null:
        case undefined:
            return "No Priority"
        default:
            return "No Priority"
    }
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
                {/* Use Button with asChild so the actual DOM element can be a non-button (div)
                    - This prevents rendering a <button> inside another <button> (AccordionTrigger)
                    - We also add explicit disabled styling since the child is not a native button */}
                <Button
                    asChild
                    variant="ghost"
                    size="icon"
                    className={cn(
                        "h-auto w-auto p-1 gap-1",
                        getPriorityColor(priority),
                        disabled && "opacity-50 cursor-not-allowed hover:bg-transparent"
                    )}
                    onMouseDown={(e) => e.stopPropagation()}
                    disabled={disabled}
                >
                    <div className="flex items-center gap-1">
                        <FlagIcon className="h-4 w-4" />
                        <span className="text-xs font-medium">{getPriorityLabel(priority)}</span>
                    </div>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-1" align="start">
                <div className="flex flex-col gap-1">
                    {priorities.map((p) => (
                        <Button
                            key={p.value}
                            variant="ghost"
                            size="sm"
                            className="justify-start gap-2"
                            onClick={() => {
                                onPriorityChange(p.value)
                                setOpen(false)
                            }}
                        >
                            <FlagIcon className={cn("h-4 w-4", getPriorityColor(p.value))} />
                            {p.label}
                        </Button>
                    ))}
                    <Button
                        variant="ghost"
                        size="sm"
                        className="justify-start gap-2 text-muted-foreground"
                        onClick={() => {
                            onPriorityChange(null) // Set về null
                            setOpen(false)
                        }}
                    >
                        <CircleSlashIcon className="h-4 w-4" />
                        {getPriorityLabel(null)}
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    )
}
