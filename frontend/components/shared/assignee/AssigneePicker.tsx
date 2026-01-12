"use client";

import * as React from "react";
import { toast } from "sonner";
import { Check, User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Member, User } from "@/types";

interface AssigneePickerProps {
  value: string[];
  onChange: (value: string[]) => void;
  users: Member[];
  className?: string;
}

export function AssigneePicker({
  value = [],
  onChange,
  users = [],
  className,
}: AssigneePickerProps) {
  const [open, setOpen] = React.useState(false);

  const selectedUsers = users.filter((user) => value.includes(user.id));

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const toggleUser = async (userId: string) => {
    if (value.includes(userId)) {
      onChange(value.filter((id) => id !== userId));
    } else {
      onChange([...value, userId]);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <div
                role="button"
                className={cn(
                  "cursor-pointer outline-none flex items-center justify-center",
                  className
                )}
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                {selectedUsers.length > 0 ? (
                  <div className="flex -space-x-2 hover:space-x-1 transition-all duration-200">
                    {selectedUsers.slice(0, 3).map((user) => (
                      <Avatar key={user.id} className="h-6 w-6 border-2 border-background ring-1 ring-border/10 transition-transform hover:scale-110 hover:z-10" title={user.name}>
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback className="text-[10px] bg-primary/5 text-primary font-medium">
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {selectedUsers.length > 3 && (
                      <div className="h-6 w-6 rounded-full border-2 border-background bg-muted flex items-center justify-center text-[10px] font-medium text-muted-foreground ring-1 ring-border/10" title={selectedUsers.slice(3).map((u) => u.name).join(", ")}>
                        +{selectedUsers.length - 3}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-6 w-6 rounded-full border border-dashed border-muted-foreground/30 flex items-center justify-center hover:border-primary/50 transition-colors bg-background">
                    <UserIcon className="h-3 w-3 text-muted-foreground/50" />
                  </div>
                )}
              </div>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent className="text-xs">Assignees</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <PopoverContent className="p-0 w-[200px]" align="end" side="bottom">
        <Command>
          <CommandInput placeholder="Search user..." />
          <CommandList>
            <CommandEmpty>No user found.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                onSelect={() => {
                  onChange([]); // Clear all
                  // setOpen(false); // Optional: close on clear
                }}
                className="cursor-pointer"
              >
                <div className="mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary opacity-0"></div>
                <span className="text-muted-foreground">Clear all</span>
              </CommandItem>
              {users.map((user) => (
                <CommandItem
                  key={user.id}
                  value={user.name}
                  onSelect={() => toggleUser(user.id)}
                  className="cursor-pointer"
                >
                  <div
                    className={cn(
                      "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                      value.includes(user.id)
                        ? "bg-primary text-primary-foreground"
                        : "opacity-50 [&_svg]:invisible"
                    )}
                  >
                    <Check className={cn("h-4 w-4")} />
                  </div>
                  <Avatar className="h-6 w-6 mr-2">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback className="text-[10px]">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate">{user.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
