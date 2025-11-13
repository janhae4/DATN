"use client"

import * as React from "react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { db } from "@/public/mock-data/mock-data"
import { toast } from "sonner"
import { Status, statusEnum } from "@/types/status.interface"
import { Circle, CircleEllipsis, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

const categoryMap = {
  [statusEnum.todo]: {
    label: "To do",
    icon: Circle,
    color: "text-neutral-500",
  },
  [statusEnum.in_progress]: {
    label: "In progress",
    icon: CircleEllipsis,
    color: "text-blue-500",
  },
  [statusEnum.done]: {
    label: "Done",
    icon: CheckCircle2,
    color: "text-green-500",
  },
}

interface StatusCreateDialogProps {
  children: React.ReactNode
  onSave: () => void
}

export function StatusCreateDialog({
  children,
  onSave,
}: StatusCreateDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [name, setName] = React.useState("")
  const [category, setCategory] = React.useState<statusEnum>(statusEnum.todo)

  React.useEffect(() => {
    if (open) {
      setName("")
      setCategory(statusEnum.todo)
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name) {
      toast.error("Name is required")
      return
    }
    
    try {
      const newStatus: Status = {
        id: `status-${Date.now()}`,
        name: name.trim(),
        status: category,
        color: `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`,
        projectId: "project-1",
        order: db.statuses.length,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      
      db.statuses.push(newStatus)
      
      toast.success(`Status "${name}" created!`)
      
      onSave()
      
      setOpen(false)
      
      setName("")
      setCategory(statusEnum.todo)
      
    } catch (error) {
      console.error("Error creating status:", error)
      toast.error("Failed to create status. Please try again.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Create status</DialogTitle>
            <DialogDescription>
              Add a new status to your workflow
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Input Name giữ nguyên */}
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter status name"
                className="w-full"
              />
            </div>

            {/* Select Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={category}
                onValueChange={(value: statusEnum) => setCategory(value)}
              >
                <SelectTrigger className="w-full">
                  {/* 4. UPDATE SELECT TRIGGER (THÊM MÀU) */}
                  <SelectValue placeholder="Select a category">
                    <div className="flex items-center gap-2">
                      {React.createElement(categoryMap[category].icon, {
                        className: cn("h-4 w-4", categoryMap[category].color),
                      })}
                      <span>{categoryMap[category].label}</span>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {/* 5. UPDATE SELECT CONTENT (THÊM MÀU) */}
                  {Object.values(statusEnum).map((enumValue) => {
                    const categoryInfo = categoryMap[enumValue]
                    return (
                      <SelectItem key={enumValue} value={enumValue}>
                        <div className="flex items-center gap-2">
                          <categoryInfo.icon
                            className={cn("h-4 w-4", categoryInfo.color)}
                          />
                          <span>{categoryInfo.label}</span>
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
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