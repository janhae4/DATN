"use client";

import * as React from "react";
import {
  Search,
  Hash,
  ChevronDown,
  ChevronRight,
  Plus,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useTeamContext } from "@/contexts/TeamContext";
import { useDiscussions, useTeamMembers, useGetOrCreateDirectMessage } from "@/hooks/useTeam";
import { useUserProfile } from "@/hooks/useAuth";
import { AddMemberDialog } from "@/components/features/team/AddMemberDialog";
import { CreateChannelDialog } from "@/components/features/chat/CreateChannelDialog";

interface SidebarSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  action?: React.ReactNode;
}

function SidebarSection({
  title,
  children,
  defaultOpen = true,
  action,
}: SidebarSectionProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mb-2">
      <div className="flex items-center justify-between px-4 py-1 group">
        <CollapsibleTrigger asChild>
          <div className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer uppercase tracking-wider flex-1">
            {isOpen ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
            {title}
          </div>
        </CollapsibleTrigger>
        {action && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            {action}
          </div>
        )}
      </div>
      <CollapsibleContent>
        <div className="space-y-[2px] px-2 mt-1">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
}

interface ChannelItemProps {
  name: string;
  isActive?: boolean;
  hasNotification?: boolean;
}

function ChannelItem({ name, isActive, hasNotification }: ChannelItemProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between px-3 py-1.5 rounded-md cursor-pointer text-sm transition-all group",
        isActive
          ? "bg-accent text-accent-foreground font-medium"
          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
      )}
    >
      <div className="flex items-center gap-2 truncate">
        <Hash className="h-4 w-4 opacity-50 shrink-0" />
        <span className="truncate">{name}</span>
      </div>
      {hasNotification && (
        <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
      )}
    </div>
  );
}

interface DMItemProps {
  name: string;
  avatar?: string;
  isActive?: boolean;
  unreadCount?: number;
  isOnline?: boolean;
  status?: string;
}

function DMItem({
  name,
  avatar,
  isActive,
  unreadCount,
  isOnline,
  status,
}: DMItemProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between px-3 py-1.5 rounded-md cursor-pointer text-sm transition-all group",
        isActive
          ? "bg-accent text-accent-foreground font-medium"
          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
      )}
    >
      <div className="flex items-center gap-3 truncate">
        <div className="relative shrink-0">
          <Avatar className="h-6 w-6 border border-background">
            <AvatarImage src={avatar} />
            <AvatarFallback className="text-[10px]">
              {name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {isOnline && (
            <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-green-500 ring-2 ring-background" />
          )}
        </div>
        <div className="flex flex-col truncate">
          <span className="truncate leading-none">{name}</span>
          {status && (
            <span className="text-[10px] text-muted-foreground truncate mt-0.5">
              {status}
            </span>
          )}
        </div>
      </div>
      {unreadCount && unreadCount > 0 && (
        <span className="flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-bold shrink-0">
          {unreadCount}
        </span>
      )}
    </div>
  );
}

interface ChatSidebarProps {
  selectedDiscussionId: string | null;
  onSelectDiscussion: (id: string | null) => void;
}

export default function ChatSidebar({ 
  selectedDiscussionId,
  onSelectDiscussion
}: ChatSidebarProps) {
  const { activeTeam } = useTeamContext();
  const { data: discussions } = useDiscussions(activeTeam?.id || null);
  const { data: members } = useTeamMembers(activeTeam?.id || null);
  const { data: userProfile } = useUserProfile();
  const getOrCreateDirectMessage = useGetOrCreateDirectMessage();

  const handleDMClick = async (targetUserId: string) => {
    if (!userProfile?.id) return;
    
    try {
      const discussion = await getOrCreateDirectMessage.mutateAsync({
        currentUserId: userProfile.id,
        targetUserId: targetUserId
      });
      
      if (discussion) {
        onSelectDiscussion(discussion.id);
      }
    } catch (error) {
      console.error("Failed to open DM", error);
    }
  };

  // Auto-select first discussion if none selected
  React.useEffect(() => {
    if (!selectedDiscussionId && discussions && discussions.length > 0) {
      onSelectDiscussion(discussions[0].id);
    }
  }, [discussions, selectedDiscussionId, onSelectDiscussion]);
  
  return (
    <div className="flex flex-col h-full bg-[#FAFAFA]! backdrop-blur supports-[backdrop-filter]:bg-background/60 border-r">
      {/* Header */}
      <div className="p-4 pb-2">
        <div className="flex justify-between items-center mb-4 px-1">
          <h2 className="text-lg font-bold tracking-tight">Messages</h2>
      
        </div>
        
        <div className="relative mb-4">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search messages..."
            className="pl-9 bg-muted/50 border-transparent focus-visible:bg-background focus-visible:ring-1"
          />
        </div>
      </div>

      <Separator className="my-2 opacity-50" />
      
      <div className="flex-1 px-2 overflow-y-auto scroll-auto">
        <div className="pb-4 space-y-4">
          <SidebarSection
            title="Channels"
            action={
              <CreateChannelDialog teamId={activeTeam?.id || null}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </CreateChannelDialog>
            }
          >
            {discussions?.map((discussion) => (
              <div key={discussion.id} onClick={() => onSelectDiscussion(discussion.id)}>
                <ChannelItem 
                  name={discussion.name || "General"} 
                  isActive={selectedDiscussionId === discussion.id} 
                />
              </div>
            ))}
          </SidebarSection>

          <SidebarSection
            title="Direct Messages"
            action={
              <AddMemberDialog 
                teamId={activeTeam?.id || null}
                onSelectDiscussion={onSelectDiscussion}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </AddMemberDialog>
            }
          >
            {/* FIX: Thêm kiểm tra member.user tồn tại trước khi render */}
            {members?.map((member) => {
              if (!member.user) return null; // Bỏ qua nếu không có thông tin user
              
              return (
                <div key={member.id} onClick={() => handleDMClick(member.userId)}>
                  <DMItem
                    name={member.user.name}
                    avatar={member.user.avatar || undefined}
                    isOnline={member.isActive}
                    status={member.role}
                  />
                </div>
              );
            })}
          </SidebarSection>
        </div>
      </div>
    </div>
  );
}