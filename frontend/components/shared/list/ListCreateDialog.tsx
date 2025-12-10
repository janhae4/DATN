"use client";

import * as React from "react";
import { Loader2, Circle, CircleEllipsis, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import { ListCategoryEnum } from "@/types/common/enums";
import { CreateListDto } from "@/services/listService";
import { useLists } from "@/hooks/useList";

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
};

interface ListCreateDialogProps {
  children: React.ReactNode;
  projectId: string;
}

export function ListCreateDialog({
  children,
  projectId,
}: ListCreateDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [category, setCategory] = React.useState<ListCategoryEnum>(
    ListCategoryEnum.TODO
  );

  // Gọi hook
  const { createList, isCreating, lists } = useLists(projectId);

  const hasDoneList = React.useMemo(
    () => lists.some((l) => l.category === ListCategoryEnum.DONE),
    [lists]
  );

  React.useEffect(() => {
    if (open) {
      setName("");
      setCategory(ListCategoryEnum.TODO);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (category === ListCategoryEnum.DONE && hasDoneList) {
      toast.error("This project already has a Done list.");
      return;
    }

    try {
      const newListData: CreateListDto = {
        name: name.trim(),
        category: category,
        projectId: projectId,
        position: lists.length + 1, 
        isArchived: false,
      };

      console.log("Creating list with payload:", newListData);

      await createList(newListData);

      toast.success(`List "${name}" created!`);
      setOpen(false);
    } catch (error) {
      console.error("Error creating list:", error);
      toast.error("Failed to create list.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <div className="space-y-4">
          <DialogHeader>
            <DialogTitle>Create list</DialogTitle>
            <DialogDescription>
              Add a new list to your workflow
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter list name"
                className="w-full"
                disabled={isCreating}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={category}
                onValueChange={(value: ListCategoryEnum) => setCategory(value)}
                disabled={isCreating}
              >
                <SelectTrigger className="w-full">
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
                  {Object.values(ListCategoryEnum)
                    .filter((enumValue) =>
                      enumValue === ListCategoryEnum.DONE ? !hasDoneList : true
                    )
                    .map((enumValue) => {
                      const categoryInfo = categoryMap[enumValue];
                      return (
                        <SelectItem key={enumValue} value={enumValue}>
                          <div className="flex items-center gap-2">
                            <categoryInfo.icon
                              className={cn("h-4 w-4", categoryInfo.color)}
                            />
                            <span>{categoryInfo.label}</span>
                          </div>
                        </SelectItem>
                      );
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
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              type="button" 
              onClick={handleSubmit}
              disabled={isCreating || !name.trim()}
            >
              {isCreating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Create
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
