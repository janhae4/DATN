"use client";

import * as React from "react";
import { Plus, Search, UserPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAddMember } from "@/hooks/useTeam";
import { useUserProfile } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useSearchUsers } from "@/hooks/useUsers";
import { AxiosError } from "axios";

interface AddMemberDialogProps {
  teamId: string | null;
  children?: React.ReactNode;
}

export function AddMemberDialog({
  teamId,
  children,
}: AddMemberDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  const { data: userProfile } = useUserProfile();
  const addMemberMutation = useAddMember();

  // Search users NOT in the team
  const { data: searchResults, isLoading } = useSearchUsers({
    query: searchQuery,
    teamId: teamId || undefined
  });


  const handleAddMember = async (targetUserId: string) => {
    if (!userProfile?.id || !teamId) return;

    try {
      await addMemberMutation.mutateAsync({
        teamId,
        requesterId: userProfile.id,
        memberIds: [targetUserId]
      });

      toast.success("Member added successfully");
      setOpen(false);
      setSearchQuery("");
    } catch (error: any) {
      console.error("Failed to add member:", error);
      const errorMsg = (error as AxiosError<{ message: string }>)?.response?.data?.message || "Failed to add member";
      toast.error(errorMsg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="ghost" size="icon" className="h-4 w-4 p-0 hover:bg-transparent">
            <Plus className="h-3 w-3" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle>Add Team Member</DialogTitle>
          <DialogDescription>
            Search for users to add to your team.
          </DialogDescription>
        </DialogHeader>

        <div className="border-t">
          <Command shouldFilter={false} className="rounded-none border-none">
            <div className="px-3 py-2 border-b">
              <div className="flex items-center gap-2 px-2">
                <Search className="h-4 w-4 text-muted-foreground opacity-50" />
                <input
                  className="flex h-9 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <CommandList className="max-h-[300px] p-2">
              {isLoading && searchQuery ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  Searching users...
                </div>
              ) : !searchQuery ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  Type to search users...
                </div>
              ) : searchResults?.length === 0 ? (
                <CommandEmpty>No users found.</CommandEmpty>
              ) : (
                <CommandGroup heading="Suggestions">
                  {searchResults?.map((user) => (
                    <CommandItem
                      key={user.id}
                      value={user.id}
                      onSelect={() => handleAddMember(user.id)}
                      className="cursor-pointer rounded-md p-2"
                    >
                      <div className="flex items-center gap-3 w-full">
                        <Avatar className="h-9 w-9 border border-border">
                          <AvatarImage src={user.avatar || undefined} />
                          <AvatarFallback>
                            {user.name?.substring(0, 2).toUpperCase() || "??"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col flex-1 overflow-hidden">
                          <span className="font-medium truncate">
                            {user.name}
                          </span>
                          <span className="text-xs text-muted-foreground truncate">
                            {user.email}
                          </span>
                        </div>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-primary">
                          <UserPlus className="h-4 w-4" />
                        </Button>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </div>
      </DialogContent>
    </Dialog>
  );
}