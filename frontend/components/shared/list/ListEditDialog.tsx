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

import { List } from "@/types";
import { ListCategoryEnum } from "@/types/common/enums";
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

interface ListEditDialogProps {
  children: React.ReactNode;
  projectId: string;
  lists: List[]; // Nhận list từ cha để hiển thị dropdown chọn
  initialListId?: string; // Nếu muốn mở dialog edit luôn list cụ thể
}

export function ListEditDialog({
  children,
  projectId,
  lists,
  initialListId,
}: ListEditDialogProps) {
  const [open, setOpen] = React.useState(false);

  // Hook update
  const { updateList, isUpdating } = useLists(projectId);

  const [selectedId, setSelectedId] = React.useState<string | undefined>(
    initialListId || lists[0]?.id
  );
  const [name, setName] = React.useState("");
  const [category, setCategory] = React.useState<ListCategoryEnum>(
    ListCategoryEnum.TODO
  );

  // Sync data khi mở dialog hoặc đổi list chọn
  React.useEffect(() => {
    if (open) {
      const targetId = initialListId || selectedId || lists[0]?.id;
      if (targetId) {
        setSelectedId(targetId);
      }
    }
  }, [open, initialListId, lists]);

  React.useEffect(() => {
    if (!selectedId) return;
    const listToEdit = lists.find((s) => s.id === selectedId);
    if (listToEdit) {
      setName(listToEdit.name);
      setCategory(listToEdit.category);
    }
  }, [selectedId, lists]);

  const handleSubmit = async () => {
    if (!selectedId || !name.trim()) return;

    try {
      await updateList(selectedId, {
        name: name.trim(),
        category: category,
      });

      toast.success(`List updated!`);
      setOpen(false);
    } catch (error) {
      toast.error("Failed to update list");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <div className="space-y-4">
          <DialogHeader>
            <DialogTitle>Edit list</DialogTitle>
            <DialogDescription>Update an existing list</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Dropdown chọn List để sửa */}
            <div className="space-y-2">
              <Label htmlFor="status-select">List *</Label>
              <Select
                value={selectedId}
                onValueChange={setSelectedId}
                disabled={isUpdating}
              >
                <SelectTrigger id="status-select" className="w-full">
                  <SelectValue placeholder="Select a list to edit" />
                </SelectTrigger>
                <SelectContent>
                  {lists.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center gap-2 px-2 py-1.5"
                    >
                      <span
                        className="h-2 w-2 rounded-full flex-shrink-0"
                        // style={{ backgroundColor: s.color }}
                      />
                      <SelectItem value={s.id} className="flex-1">
                        {s.name}
                      </SelectItem>
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Input Tên */}
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!selectedId || isUpdating}
                className="w-full"
              />
            </div>

            {/* Dropdown Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={category}
                onValueChange={(value: ListCategoryEnum) => setCategory(value)}
                disabled={!selectedId || isUpdating}
              >
                <SelectTrigger id="category" className="w-full">
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
                  {Object.values(ListCategoryEnum).map((enumValue) => {
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
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              size="sm"
              disabled={!selectedId || isUpdating}
            >
              {isUpdating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Save changes
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
