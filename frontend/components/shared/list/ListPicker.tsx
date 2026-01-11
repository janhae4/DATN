"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Check, Plus, Edit } from "lucide-react"
import { Separator } from "@/components/ui/separator"

import { ListCreateDialog } from "./ListCreateDialog"
import { ListEditDialog } from "./ListEditDialog"
import { List } from "@/types"
import { ListCategoryEnum } from "@/types/common/enums"

// 1. Định nghĩa bảng màu dựa trên Category
const categoryColorMap: Record<ListCategoryEnum, string> = {
  [ListCategoryEnum.TODO]: "bg-neutral-500",      // Màu xám
  [ListCategoryEnum.IN_PROGRESS]: "bg-blue-500",  // Màu xanh dương
  [ListCategoryEnum.DONE]: "bg-green-500",        // Màu xanh lá
}

type ListPickerProps = {
  lists: List[]
  value?: string | null
  onChange: (listId: string) => void
  disabled?: boolean
}

export function ListPicker({
  lists,
  value,
  onChange,
  disabled,
}: ListPickerProps) {
  const params = useParams();
  const projectId = params.projectId as string;

  const [open, setOpen] = React.useState(false)

  // Group lists
  const grouped = React.useMemo(() => {
    return {
      todo: lists.filter((s) => s.category === ListCategoryEnum.TODO),
      in_progress: lists.filter((s) => s.category === ListCategoryEnum.IN_PROGRESS),
      done: lists.filter((s) => s.category === ListCategoryEnum.DONE),
    }
  }, [lists])

  const renderSection = (title: string, items: List[]) => {
    if (!items || items.length === 0) return null
    return (
      <div className="py-1">
        <div className="px-3 py-1 text-xs font-semibold text-muted-foreground">
          {title}
        </div>
        <div className="space-y-1">
          {items.map((s) => (
            <button
              key={s.id}
              type="button"
              className={cn(
                "w-full flex items-center justify-between gap-2 px-3 py-2 text-sm hover:bg-muted ",
                value === s.id ? "bg-primary/5" : ""
              )}
              onClick={() => {
                onChange(s.id)
                setOpen(false)
              }}
            >
              <div className="flex items-center gap-2">
                {/* 2. Sử dụng class màu từ map thay vì style inline */}
                <span
                  className={cn(
                    "h-2 w-2 rounded-full",
                    categoryColorMap[s.category] || "bg-neutral-500"
                  )}
                />
                <span>{s.name}</span>
              </div>
              {value === s.id && <Check className="h-4 w-4 text-primary" />}
            </button>
          ))}
        </div>
      </div>
    )
  }

  const selectedList = lists.find((s) => s.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                disabled={disabled}
                className="h-7 px-2 flex items-center gap-2"
              >
                {selectedList ? (
                  <>
                    {/* 3. Cập nhật màu cho phần hiển thị Selected */}
                    <span
                      className={cn(
                        "inline-block h-2 w-2 rounded-full",
                        categoryColorMap[selectedList.category] || "bg-neutral-500"
                      )}
                    ></span>
                    <span className="truncate">{selectedList.name}</span>
                  </>
                ) : (
                  <span>List</span>
                )}
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent className="text-xs">Status List</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <PopoverContent className="w-64 p-0" align="start">
        <div className="flex flex-col">
          {renderSection("Not started", grouped.todo)}
          {renderSection("Active", grouped.in_progress)}
          {renderSection("Done", grouped.done)}

          <Separator />

          <div className="p-2">
            <ListCreateDialog projectId={projectId}>
              <Button
                type="button"
                variant="ghost"
                className="w-full justify-start h-8 px-2"
                onClick={(e) => e.stopPropagation()}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create list
              </Button>
            </ListCreateDialog>

            <ListEditDialog projectId={projectId} lists={lists}>
              <Button
                type="button"
                variant="ghost"
                className="w-full justify-start h-8 px-2"
                onClick={(e) => e.stopPropagation()}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit list
              </Button>
            </ListEditDialog>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}