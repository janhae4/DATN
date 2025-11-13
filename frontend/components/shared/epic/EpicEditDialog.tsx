"use client"

import * as React from "react"
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
import { Target } from "lucide-react"
// --- 1. BỎ IMPORT PriorityPicker ---
// import { PriorityPicker } from "../PriorityPicker"
import { DateRangePicker } from "../DateRangePicker"
import { cn } from "@/lib/utils" // Thêm cn

// --- 2. THÊM IMPORT ICON ---
import {
  Circle,
  CircleEllipsis,
  CheckCircle2,
  XCircle,
  Flag,
  CircleSlashIcon,
} from "lucide-react"

// --- 3. ĐỊNH NGHĨA MAP CHO STATUS ---
const statusMap: Record<Epic["status"], { label: string; icon: React.ElementType; color: string }> = {
  "todo": { label: "To do", icon: Circle, color: "text-neutral-500" },
  "in_progress": { label: "In Progress", icon: CircleEllipsis, color: "text-blue-500" },
  "done": { label: "Done", icon: CheckCircle2, color: "text-green-500" },
  "canceled": { label: "Canceled", icon: XCircle, color: "text-red-500" },
}
const statusOptions = Object.keys(statusMap) as Epic["status"][]

// --- 4. ĐỊNH NGHĨA MAP CHO PRIORITY ---
const priorityMap: Record<NonNullable<Epic["priority"]>, { label: string; icon: React.ElementType; color: string }> = {
  "high": { label: "High", icon: Flag, color: "text-red-500" },
  "medium": { label: "Medium", icon: Flag, color: "text-yellow-500" },
  "low": { label: "Low", icon: Flag, color: "text-blue-500" },
}
const priorityOptions = Object.keys(priorityMap) as NonNullable<Epic["priority"]>[]

// Helper cho priority "null"
const nullPriority = {
  label: "No priority",
  icon: CircleSlashIcon,
  color: "text-muted-foreground"
}

interface EpicEditDialogProps {
  children: React.ReactNode
  onSave: () => void
  allEpics: Epic[]
  key?: any
}

export function EpicEditDialog({
  children,
  onSave,
  allEpics,
}: EpicEditDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [selectedId, setSelectedId] = React.useState<string | undefined>(
    allEpics[0]?.id
  )

  const [title, setTitle] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [status, setStatus] = React.useState<Epic["status"]>("todo")
  const [priority, setPriority] = React.useState<Epic["priority"]>(null)
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(
    undefined
  )

  // Load data (giữ nguyên)
  React.useEffect(() => {
    if (!selectedId) return
    const epicToEdit = allEpics.find((e) => e.id === selectedId)
    if (epicToEdit) {
      setTitle(epicToEdit.title)
      setDescription(epicToEdit.description || "")
      setStatus(epicToEdit.status)
      setPriority(epicToEdit.priority)
      setDateRange({
        from: epicToEdit.start_date ? new Date(epicToEdit.start_date) : undefined,
        to: epicToEdit.due_date ? new Date(epicToEdit.due_date) : undefined,
      })
    }
  }, [selectedId, allEpics])

  // Reset khi mở (giữ nguyên)
  React.useEffect(() => {
    if (open && allEpics.length > 0) {
      if (!selectedId) {
        setSelectedId(allEpics[0].id)
      }
    }
  }, [open, allEpics, selectedId])

  // handleSubmit (giữ nguyên)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedId) return

    const epicIndex = db.epics.findIndex((e) => e.id === selectedId)
    if (epicIndex !== -1) {
      db.epics[epicIndex] = {
        ...db.epics[epicIndex],
        title: title,
        description: description || undefined,
        status: status,
        priority: priority,
        start_date: dateRange?.from ? dateRange.from.toISOString() : null,
        due_date: dateRange?.to ? dateRange.to.toISOString() : null,
        updatedAt: new Date().toISOString(),
      }
      toast.success(`Epic "${title}" updated!`)
      onSave()
      setOpen(false)
    } else {
      toast.error("Epic not found")
    }
  }
  
  // --- 5. TẠO HELPER RENDER ---
  // (Component để render cái icon + text)
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
  
  // (Helper để lấy info cho priority, kể cả 'null')
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
            <DialogTitle>Edit epics</DialogTitle>
            <DialogDescription>
              Update an existing epic
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
            {/* Select Epic, Title, Desc (giữ nguyên) */}
            <div className="space-y-2">
              <Label htmlFor="epic-select">Epic *</Label>
              <Select value={selectedId} onValueChange={setSelectedId}>
                <SelectTrigger id="epic-select" className="w-full">
                  <SelectValue placeholder="Select an epic to edit" />
                </SelectTrigger>
                <SelectContent>
                  {allEpics.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-[#E06B80]" />
                        <span>{e.title}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={!selectedId}
                placeholder="Enter epic title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={!selectedId}
                placeholder="Enter epic description (optional)"
                rows={4}
              />
            </div>

            {/* --- 6. "ĐỘ" LẠI CÁI GRID NÀY --- */}
            <div className="flex gap-4 w-full">
              {/* STATUS (ĐÃ "TÂN TRANG") */}
              <div className="space-y-2 w-full">
                <Label htmlFor="status-edit">Status</Label>
                <Select
                  value={status}
                  onValueChange={(v: Epic["status"]) => setStatus(v)}
                  disabled={!selectedId}
                >
                  <SelectTrigger id="status-edit" className="w-full">
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

              {/* PRIORITY (ĐÃ "ĐỘ" VÀ THAY LẠI SELECT) */}
              <div className="space-y-2 w-full">
                <Label htmlFor="priority-edit">Priority</Label>
                <Select
                  value={priority || "null"} // Giá trị 'null'
                  onValueChange={(v) => setPriority(v === "null" ? null : (v as Epic["priority"]))}
                  disabled={!selectedId}
                >
                  <SelectTrigger id="priority-edit" className="w-full">
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

            {/* DateRangePicker (giữ nguyên) */}
            <div className="space-y-2">
              <Label>Start & End date</Label>
              <DateRangePicker
                range={dateRange}
                onRangeSelect={setDateRange}
                disabled={!selectedId}
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
            <Button type="submit" size="sm" disabled={!selectedId}>
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}