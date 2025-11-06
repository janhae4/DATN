"use client"

import * as React from "react"
import { useModal } from "@/hooks/useModal"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Target } from "lucide-react"


export function CreateEpicModal() {
  const { isOpen, open, close, onOpenChange } = useModal()

  const modalOpen = isOpen
  const handleOpenChange = onOpenChange
  const [epicName, setEpicName] = React.useState("")

  const handleSubmit = () => {
    console.log("Submitting new epic:", epicName)
    handleOpenChange(false)
  }

  return (
    <Dialog open={modalOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-purple-600" /> Create New Epic
          </DialogTitle>
          <DialogDescription>
            Enter the details for your new epic. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="epic-name" className="text-right">
              Name
            </Label>
            <Input
              id="epic-name"
              value={epicName}
              onChange={(e) => setEpicName(e.target.value)}
              className="col-span-3"
              placeholder="e.g., User Authentication Flow"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit}>Save Epic</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}