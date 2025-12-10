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
import { useTeamMembers, useGetOrCreateDirectMessage } from "@/hooks/useTeam";
import { useUserProfile } from "@/hooks/useAuth";
import { toast } from "sonner";

interface AddMemberDialogProps {
  teamId: string | null;
  children?: React.ReactNode;
  onSelectDiscussion?: (id: string | null) => void;
}

export function AddMemberDialog({
  teamId,
  children,
  onSelectDiscussion,
}: AddMemberDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  const { data: members, isLoading } = useTeamMembers(teamId);
  const { data: userProfile } = useUserProfile();
  const getOrCreateDirectMessage = useGetOrCreateDirectMessage();

  // --- LỌC DỮ LIỆU AN TOÀN ---
  // 1. Lọc bỏ chính user hiện tại
  // 2. QUAN TRỌNG: Lọc bỏ các member không có thông tin user (tránh lỗi undefined)
  const availableMembers = React.useMemo(() => {
    if (!members) return [];
    
    return members.filter(
      (m) => 
        m.user && // Kiểm tra user tồn tại
        m.userId !== userProfile?.id // Không hiển thị chính mình
    );
  }, [members, userProfile?.id]);

  // Lọc theo từ khóa tìm kiếm
  const filteredMembers = React.useMemo(() => {
    if (!searchQuery) return availableMembers;
    const lowerQuery = searchQuery.toLowerCase();
    return availableMembers.filter(
      (m) =>
        m.user.name.toLowerCase().includes(lowerQuery) ||
        m.user.email.toLowerCase().includes(lowerQuery)
    );
  }, [availableMembers, searchQuery]);

  const handleSelectMember = async (targetUserId: string) => {
    if (!userProfile?.id) return;

    try {
      // Tạo hoặc lấy đoạn chat DM
      const discussion = await getOrCreateDirectMessage.mutateAsync({
        currentUserId: userProfile.id,
        targetUserId: targetUserId,
      });

      if (discussion && onSelectDiscussion) {
        onSelectDiscussion(discussion.id);
      }
      
      setOpen(false); // Đóng modal
    } catch (error) {
      console.error("Failed to start conversation:", error);
      toast.error("Failed to start conversation");
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
          <DialogTitle>New Message</DialogTitle>
          <DialogDescription>
            Select a team member to start a direct message.
          </DialogDescription>
        </DialogHeader>
        
        <div className="border-t">
          <Command shouldFilter={false} className="rounded-none border-none">
            <div className="px-3 py-2 border-b">
                <div className="flex items-center gap-2 px-2">
                    <Search className="h-4 w-4 text-muted-foreground opacity-50" />
                    <input 
                        className="flex h-9 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Search people..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>
            
            <CommandList className="max-h-[300px] p-2">
              {isLoading ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  Loading members...
                </div>
              ) : filteredMembers.length === 0 ? (
                <CommandEmpty>No members found.</CommandEmpty>
              ) : (
                <CommandGroup heading="Team Members">
                  {filteredMembers.map((member) => (
                    <CommandItem
                      key={member.id}
                      value={member.user.id}
                      onSelect={() => handleSelectMember(member.userId)}
                      className="cursor-pointer rounded-md p-2"
                    >
                      <div className="flex items-center gap-3 w-full">
                        <Avatar className="h-9 w-9 border border-border">
                          {/* Đã kiểm tra member.user ở trên nên an toàn */}
                          <AvatarImage src={member.user.avatar || undefined} />
                          <AvatarFallback>
                            {member.user.name?.substring(0, 2).toUpperCase() || "??"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col flex-1 overflow-hidden">
                          <span className="font-medium truncate">
                            {member.user.name}
                          </span>
                          <span className="text-xs text-muted-foreground truncate">
                            {member.user.email}
                          </span>
                        </div>
                        {member.isActive && (
                            <div className="h-2 w-2 rounded-full bg-green-500" title="Online" />
                        )}
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