"use client"

import * as React from "react"
// --- 1. IMPORT THÊM DateRange ---
import { DateRange } from "react-day-picker"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { db } from "@/public/mock-data/mock-data"
import { toast } from "sonner"
import { Epic } from "@/types/epic.type"
// --- 2. BỎ IMPORT PriorityPicker ---
// import { PriorityPicker } from "../PriorityPicker"
import { DateRangePicker } from "../DateRangePicker"
import { cn } from "@/lib/utils" // Thêm cn

// --- 3. THÊM IMPORT ICON ---
import {
  Circle,
  CircleEllipsis,
  CheckCircle2,
  XCircle,
  Flag,
  CircleSlashIcon,
} from "lucide-react"

// --- 4. ĐỊNH NGHĨA MAP CHO STATUS (GIỐNG FILE EDIT) ---
const statusMap: Record<Epic["status"], { label: string; icon: React.ElementType; color: string }> = {
  "todo": { label: "To do", icon: Circle, color: "text-neutral-500" },
  "in_progress": { label: "In Progress", icon: CircleEllipsis, color: "text-blue-500" },
  "done": { label: "Done", icon: CheckCircle2, color: "text-green-500" },
  "canceled": { label: "Canceled", icon: XCircle, color: "text-red-500" },
}
const statusOptions = Object.keys(statusMap) as Epic["status"][]

// --- 5. ĐỊNH NGHĨA MAP CHO PRIORITY (GIỐNG FILE EDIT) ---
const priorityMap: Record<NonNullable<Epic["priority"]>, { label: string; icon: React.ElementType; color: string }> = {
  "high": { label: "High", icon: Flag, color: "text-red-500" },
  "medium": { label: "Medium", icon: Flag, color: "text-yellow-500" },
  "low": { label: "Low", icon: Flag, color: "text-blue-500" },
}
const priorityOptions = Object.keys(priorityMap) as NonNullable<Epic["priority"]>[]

const nullPriority = {
  label: "No priority",
  icon: CircleSlashIcon,
  color: "text-muted-foreground"
}

interface EpicCreateDialogProps {
  children: React.ReactNode
  onSave: () => void
}

export function EpicCreateDialog({
  children,
  onSave,
}: EpicCreateDialogProps) {
  const [open, setOpen] = React.useState(false)

  // --- 6. SỬA STATE CHO DATE ---
  const [title, setTitle] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [status, setStatus] = React.useState<Epic["status"]>("todo")
  const [priority, setPriority] = React.useState<Epic["priority"]>(null) // Mặc định là null
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(
    undefined
  )
  // -----------------------------

  // Reset form khi mở
  React.useEffect(() => {
    if (open) {
      setTitle("")
      setDescription("")
      setStatus("todo")
      setPriority(null) // Reset về null
      setDateRange(undefined) // Reset date
    }
  }, [open])

  // handleSubmit (Sửa lại date)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title) {
      toast.error("Title is required")
      return
    }

    try {
      // --- 7. SỬA LOGIC SAVE DATE ---
      const newEpic: Epic = {
        id: `epic-${Date.now()}`,
        title: title.trim(),
        description: description.trim() || undefined,
        status: status,
        priority: priority, // State đã chuẩn
        start_date: dateRange?.from ? dateRange.from.toISOString() : null,
        due_date: dateRange?.to ? dateRange.to.toISOString() : null,
        ownerId: "user-1",
        memberIds: [],
        projectId: "project-1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      // -----------------------------

      db.epics.push(newEpic)
      toast.success(`Epic "${title}" created!`)
      onSave()
      setOpen(false)
    } catch (error) {
      console.error("Error creating epic:", error)
      toast.error("Failed to create epic. Please try again.")
    }
  }

  // --- 8. THÊM HELPER (GIỐNG FILE EDIT) ---
  const renderOption = (
    Icon: React.ElementType,
    label: string,
    color: string
  ) => (
    <div className="flex items-center gap-2">
      <Icon className={cn("h-4 w-4", color)} />
      <span className="capitalize">{label}</span>
    </div>
  )
  
  const getPriorityInfo = (p: Epic["priority"]) => {
    if (!p) return nullPriority;
    return priorityMap[p];
  }
  
  const currentPriorityInfo = getPriorityInfo(priority);
  const currentStatusInfo = statusMap[status];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit} className="space-t-4">
          <DialogHeader>
            <DialogTitle>Create epic</DialogTitle>
            <DialogDescription>
              Add a new epic to your project
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
            {/* Title, Description (giữ nguyên) */}
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter epic title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter epic description (optional)"
                rows={4}
              />
            </div>

            {/* --- 9. "ĐỘ" LẠI GRID (GIỐNG FILE EDIT) --- */}
            <div className="flex gap-4 w-full">
              {/* STATUS (ĐÃ "TÂN TRANG") */}
              <div className="space-y-2 w-full">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={(v: Epic["status"]) => setStatus(v)}>
                  <SelectTrigger id="status" className="w-full">
                    <SelectValue asChild>
                       {renderOption(currentStatusInfo.icon, currentStatusInfo.label, currentStatusInfo.color)}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((s) => (
                      <SelectItem key={s} value={s}>
                        {renderOption(statusMap[s].icon, statusMap[s].label, statusMap[s].color)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* PRIORITY (ĐÃ "TÂN TRANG") */}
              <div className="space-y-2 w-full">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={priority || "null"}
                  onValueChange={(v) => setPriority(v === "null" ? null : (v as Epic["priority"]))}
                >
                  <SelectTrigger id="priority" className="w-full">
                    <SelectValue asChild>
                      {renderOption(currentPriorityInfo.icon, currentPriorityInfo.label, currentPriorityInfo.color)}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="null">
                       {renderOption(nullPriority.icon, nullPriority.label, nullPriority.color)}
                    </SelectItem>
                    {priorityOptions.map((p) => (
                      <SelectItem key={p} value={p}>
                        {renderOption(priorityMap[p].icon, priorityMap[p].label, priorityMap[p].color)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {/* --- KẾT THÚC "ĐỘ" --- */}

            {/* DateRangePicker (đã sửa) */}
            <div className="space-y-2">
              <Label>Start & End date</Label>
              <DateRangePicker
                range={dateRange}
                onRangeSelect={setDateRange}
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
  )
}