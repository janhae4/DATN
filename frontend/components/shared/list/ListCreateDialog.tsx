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
import { List } from "@/types/project/list.interface";
import { Circle, CircleEllipsis, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { ListCategoryEnum } from "@/types"

const categoryMap = {
  [ListCategoryEnum.TODO]: {
    label: "To do",
    icon: Circle,
    color: "text-neutral-500",
  },
  [ListCategoryEnum.IN_PROGRESS]: {
    label: "In progress",
    icon: CircleEllipsis,
    color: "text-blue-500",
  },
  [ListCategoryEnum.DONE]: {
    label: "Done",
    icon: CheckCircle2,
    color: "text-green-500",
  },
}

interface ListCreateDialogProps {
  children: React.ReactNode
  onSave: () => void
}

export function ListCreateDialog({
  children,
  onSave,
}: ListCreateDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [name, setName] = React.useState("")
  const [category, setCategory] = React.useState<ListCategoryEnum>(ListCategoryEnum.TODO)

  React.useEffect(() => {
    if (open) {
      setName("")
      setCategory(ListCategoryEnum.TODO)
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name) {
      toast.error("Name is required")
      return
    }
    
    try {
      const newList: List = {
        id: `list-${Date.now()}`,
        name: name.trim(),
        category: category,
        color: `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`,
        projectId: "project-1",
        position: db.lists.length,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isArchived: false
      }
      
      db.lists.push(newList)
      
      toast.success(`List "${name}" created!`)
      
      onSave()
      
      setOpen(false)
      
      setName("")
      setCategory(ListCategoryEnum.TODO)
      
    } catch (error) {
      console.error("Error creating list:", error)
      toast.error("Failed to create list. Please try again.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Create list</DialogTitle>
            <DialogDescription>
              Add a new list to your workflow
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
                placeholder="Enter list name"
                className="w-full"
              />
            </div>

            {/* Select Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={category}
                onValueChange={(value: ListCategoryEnum) => setCategory(value)}
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
                  {Object.values(ListCategoryEnum).map((enumValue) => {
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