"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useTaskManagementContext } from "@/components/providers/TaskManagementContext"
import { X, Check } from "lucide-react"

interface KanbanAddNewCardProps {
  listId: string
  onCancel: () => void
}

export function KanbanAddNewCard({ listId, onCancel }: KanbanAddNewCardProps) {
  const {
    newRowTitle,
    setNewRowTitle,
    handleAddNewRow,
    setNewTaskListId,
    handleInputKeyDown
  } = useTaskManagementContext()

  // Set the list ID when this component mounts
  React.useEffect(() => {
    setNewTaskListId(listId)
    setNewRowTitle("") // Clear previous title
  }, [listId, setNewTaskListId, setNewRowTitle])

  const handleCreate = () => {
    if (newRowTitle.trim()) {
      handleAddNewRow(null) // parentId is null for top-level tasks
      setNewRowTitle("")
      // We might want to keep the input open for multiple additions, 
      // or close it. The user asked to "handle function", usually implies closing or resetting.
      // AddNewTaskRow usually closes via onCancel if passed.
      // Let's keep it open if the user wants to add multiple, or we can close it.
      // For now, let's clear and keep focus? Or close?
      // The prompt said "create new task", usually implies one.
      // But Kanban usually allows quick entry.
      // Let's follow AddNewTaskRow pattern which calls onCancel if provided.
      onCancel()
    }
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Escape') {
          onCancel();
          return;
      }
      handleInputKeyDown(e, null, { onCancel })
  }

  return (
    <Card className="mb-2 shadow-lg ring-2 ring-primary/20">
      <CardContent className=" space-y-3">
        <Input
          autoFocus
          placeholder="What needs to be done?"
          value={newRowTitle}
          onChange={(e) => setNewRowTitle(e.target.value)}
          onKeyDown={onKeyDown}
          className="border-none shadow-none p-0 h-auto focus-visible:ring-0 text-sm font-medium resize-none"
        />
        <div className="flex items-center justify-end gap-2 pt-2">
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-7 w-7 p-0"
            onClick={onCancel}
          >
            <X className="h-4 w-4" />
          </Button>
          <Button 
            size="sm" 
            className="h-7 px-3 text-xs"
            onClick={handleCreate}
          >
            Add
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
