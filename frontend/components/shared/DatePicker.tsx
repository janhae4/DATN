"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface DatePickerProps {
  date: Date | string | undefined | null
  onDateSelect: (date: Date | undefined) => void
  disabled?: boolean
}

export function DatePicker({ date, onDateSelect, disabled = false }: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  // Xử lý date đầu vào - chuyển string thành Date object nếu cần
  const displayDate = React.useMemo(() => {
    if (!date) return undefined
    if (date instanceof Date) return date
    if (typeof date === 'string') {
      const parsed = new Date(date)
      return isNaN(parsed.getTime()) ? undefined : parsed
    }
    return undefined
  }, [date])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size={date ? "default" : "icon"}
          className={cn(
            "w-auto  text-left font-normal ",
            !date && "text-muted-foreground/50 ml-3 hover:text-muted-foreground",
            disabled && "opacity-50 cursor-not-allowed hover:bg-transparent"
          )}
          // Prevent the click/pointer from bubbling to parent row which opens the modal
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          disabled={disabled}
        >
          <CalendarIcon className="h-5 w-5" />
          {date && (
            <span className="ml-1.5 text-sm">
              {displayDate?.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto overflow-hidden p-0" align="start">
        <Calendar
          mode="single"
          selected={displayDate}
          onSelect={(selectedDate) => {
            onDateSelect(selectedDate)
            setOpen(false)
          }}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  )
}