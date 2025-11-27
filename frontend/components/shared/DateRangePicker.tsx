"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface DateRangePickerProps {
  range: DateRange | undefined
  onRangeSelect: (range: DateRange | undefined) => void
  disabled?: boolean
  className?: string
}

export function DateRangePicker({
  range,
  onRangeSelect,
  disabled = false,
  className,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false)

  // Logic display (giữ nguyên)
  const displayRange = React.useMemo(() => {
    if (!range) return undefined

    const from = range.from
      ? range.from instanceof Date
        ? range.from
        : new Date(range.from)
      : undefined

    const to = range.to
      ? range.to instanceof Date
        ? range.to
        : new Date(range.to)
      : undefined

    return {
      from: from && !isNaN(from.getTime()) ? from : undefined,
      to: to && !isNaN(to.getTime()) ? to : undefined,
    }
  }, [range])

  // --- 1. TẠO HÀM XỬ LÝ (INTERCEPTOR) ---
  const handleSelect = (selectedRange: DateRange | undefined) => {
    let rangeToSet = selectedRange

    // Check khi nó CÓ CẢ 2 NGÀY
    if (selectedRange?.from && selectedRange?.to) {
      // BẮT LỖI: Nếu TO < FROM
      if (selectedRange.to < selectedRange.from) {
        // "Quay xe": Swap tụi nó lại
        rangeToSet = { from: selectedRange.to, to: selectedRange.from }
      }
      
      // Đã chọn xong 2 ngày -> Đóng popover
      setOpen(false)

    } else {
      // Mới chọn 1 ngày (from), cứ để nó update
      rangeToSet = selectedRange
    }

    // Gửi data (đã fix) ra ngoài
    onRangeSelect(rangeToSet)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {/* Nút trigger (giữ nguyên) */}
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-between text-left font-normal",
            !range?.from && "text-muted-foreground",
            disabled && "opacity-50 cursor-not-allowed",
            className
          )}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          disabled={disabled}
        >
          <span>
            {displayRange?.from ? (
              displayRange.to ? (
                <>
                  {displayRange.from.toLocaleDateString("en-US")} -{" "}
                  {displayRange.to.toLocaleDateString("en-US")}
                </>
              ) : (
                <>
                  {displayRange.from.toLocaleDateString("en-US")} - ...
                </>
              )
            ) : (
              "Pick a date range"
            )}
          </span>

          <CalendarIcon className="ml-2 h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto overflow-hidden p-0" align="start">
        {/* --- 2. SỬA onSelect VÀ BỎ onDayClick --- */}
        <Calendar
          mode="range"
          selected={displayRange}
          onSelect={handleSelect} // Dùng hàm "bắt" của mình
          // Bỏ onDayClick (vì handleSelect đã lo vụ đóng)
          autoFocus
          numberOfMonths={2}
        />
      </PopoverContent>
    </Popover>
  )
}