"use client";

import { useEffect, useState } from "react";
import { Check, Search, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Member } from "@/types";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";

interface AssigneeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string[];
  onChange: (value: string[]) => void;
  users: Member[];
  title?: string;
  description?: string;
}

export function AssigneeDialog({
  open,
  onOpenChange,
  value = [],
  onChange,
  users = [],
  title = "Manage Access",
  description = "Select members to assign to this project.",
}: AssigneeDialogProps) {
  const { user } = useAuth();
  const [internalSelected, setInternalSelected] = useState<string[]>(value);

  useEffect(() => {
    if (open) {
      setInternalSelected(value);
    }
  }, [open]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };
  useEffect(() => {
    console.log(internalSelected);
  }, [internalSelected]);

  const toggleUser = (userId: string) => {
    setInternalSelected((current) => {
      const currentIds = current ? [...current] : [];

      if (currentIds.includes(userId)) {
        return currentIds.filter((id) => id !== userId);
      } else {
        return [...currentIds, userId];
      }
    });
  };

  const handleSave = () => {
    onChange(internalSelected);
    onOpenChange(false);
  };

  const handleCancel = () => {
    setInternalSelected(value);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 gap-0 overflow-hidden max-w-[450px] sm:rounded-xl">
        <DialogHeader className="px-6 py-4 border-b bg-muted/10">
          <DialogTitle className="text-lg font-semibold tracking-tight">
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className="text-sm text-muted-foreground">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        <Command className="overflow-hidden bg-transparent">
          <div className="px-3 py-2 border-b">
            <CommandInput
              placeholder="Search members by name or email..."
              className="border-none focus:ring-0 h-9"
            />
          </div>

          <CommandList className="max-h-[350px] overflow-y-auto p-2 scrollbar-thin">
            <CommandEmpty className="py-8 text-center text-sm text-muted-foreground">
              No members found.
            </CommandEmpty>

            <CommandGroup heading="Team Members">
              {users
                .filter((u) => u.id !== user?.id)
                .map((user) => {
                  const isSelected = internalSelected.includes(user.id);
                  return (
                    <CommandItem
                      key={user.id}
                      value={user.id}
                      onSelect={() => toggleUser(user.id)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 my-1 rounded-lg cursor-pointer transition-colors pointer-events-auto",
                        "data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground",
                        isSelected &&
                          "text-primary font-medium bg-primary/5 data-[selected=true]:bg-primary/10",
                      )}
                    >
                      <Avatar className="h-9 w-9 border border-border/50">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback
                          className={cn(
                            "text-xs font-medium bg-background",
                            isSelected && "text-primary bg-primary/10",
                          )}
                        >
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex flex-col flex-1 min-w-0">
                        <span
                          className={cn(
                            "text-sm font-medium truncate",
                            isSelected && "text-primary",
                          )}
                        >
                          {user.name}
                        </span>
                        <span className="text-xs text-muted-foreground truncate">
                          {user.email}
                        </span>
                      </div>

                      {isSelected && (
                        <Check className="h-4 w-4 text-primary ml-auto opacity-100 transition-opacity" />
                      )}
                    </CommandItem>
                  );
                })}
            </CommandGroup>
          </CommandList>
        </Command>

        <div className="flex flex-col border-t bg-muted/20">
          <div className="flex items-center justify-between px-6 py-2 bg-background border-b">
            <span className="text-xs text-muted-foreground">Selected</span>
            <Badge variant="secondary" className="text-xs font-normal">
              {internalSelected.length}{" "}
              {internalSelected.length === 1 ? "member" : "members"}
            </Badge>
          </div>

          <DialogFooter className="px-6 py-4 gap-2 sm:justify-between items-center w-full">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setInternalSelected([])}
              className="text-muted-foreground hover:text-red-600 px-2 h-8 text-xs sm:mr-auto"
              disabled={internalSelected.length === 0}
            >
              Clear all
            </Button>

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={
                  JSON.stringify(internalSelected) === JSON.stringify(value)
                }
              >
                Save Changes
              </Button>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
