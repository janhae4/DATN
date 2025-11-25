"use client";

import * as React from "react";
import {
  X,
  Search,
  Bell,
  LogOut,
  Trash2,
  MessageSquare,
  Ban,
  Flag,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDiscussion, useTeamMembers } from "@/hooks/useTeam";
import { useUserProfile } from "@/hooks/useAuth";
import { ChatMembersTab } from "./ChatMembersTab";
import { ChatMediaTab } from "./ChatMediaTab";
import { ChatFilesTab } from "./ChatFilesTab";

interface ChatInformationProps {
  discussionId: string | null;
  onClose?: () => void;
}

export function ChatInformation({
  discussionId,
  onClose,
}: ChatInformationProps) {
  const { data: discussion, isLoading } = useDiscussion(discussionId);
  const { data: members } = useTeamMembers(discussion?.teamId || null);
  const { data: user } = useUserProfile();

  if (!discussionId) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-6 text-muted-foreground space-y-4">
        <MessageSquare className="h-12 w-12 opacity-20" />
        <p>Select a chat to view details</p>
      </div>
    );
  }

  if (isLoading || !discussion) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="animate-pulse flex flex-col items-center gap-4 w-full">
          <div className="h-20 w-20 bg-muted rounded-full" />
          <div className="h-6 w-32 bg-muted rounded" />
          <div className="h-4 w-24 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background border-l shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4  bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <h3 className="font-semibold text-lg tracking-tight">Chat Details</h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8 rounded-full hover:bg-muted"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col">
          {/* Profile Section */}
          <div className="p-6 flex flex-col items-center text-center bg-gradient-to-b from-muted/30 to-background pb-8">
            <Avatar className="h-24 w-24 mb-4 ring-4 ring-background shadow-lg">
              <AvatarImage src={undefined} />
              <AvatarFallback className="text-3xl bg-primary/10 text-primary font-bold">
                {discussion.name?.substring(0, 2).toUpperCase() || "#"}
              </AvatarFallback>
            </Avatar>
            <h2 className="text-2xl font-bold mb-1 tracking-tight">
              {discussion.name}
            </h2>
            <p className="text-sm text-muted-foreground font-medium px-3 py-1 bg-muted rounded-full mt-2">
              {discussion.isGroup ? "Group Chat" : "Direct Message"}
            </p>

            {/* Quick Actions */}
            <div className="flex gap-4 mt-6 w-full justify-center">
              <div className="flex flex-col items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 rounded-full shadow-sm hover:bg-muted hover:text-foreground transition-all"
                >
                  <Bell className="h-4 w-4" />
                </Button>
                <span className="text-[10px] text-muted-foreground font-medium">
                  Mute
                </span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 rounded-full shadow-sm hover:bg-muted hover:text-foreground transition-all"
                >
                  <Search className="h-4 w-4" />
                </Button>
                <span className="text-[10px] text-muted-foreground font-medium">
                  Search
                </span>
              </div>
            </div>
          </div>
          {/* Content Tabs */}
          <Tabs
            defaultValue={discussion.isGroup ? "members" : "media"}
            className="w-full p-2"
          >
            <TabsList className="w-full">
              {discussion.isGroup && (
                <TabsTrigger
                  value="members"
                  className="w-full"
                >
                  Members
                </TabsTrigger>
              )}
              <TabsTrigger
                value="media"
                className=""
              >
                Media
              </TabsTrigger>
              <TabsTrigger
                value="files"
                className=""
              >
                Files
              </TabsTrigger>
            </TabsList>

            {discussion.isGroup && (
              <TabsContent value="members" className="p-0 m-0">
                <ChatMembersTab
                  isGroup={discussion.isGroup}
                  members={members}
                />
              </TabsContent>
            )}

            <TabsContent value="media" className="p-0 m-0">
              <ChatMediaTab discussionId={discussionId} />
            </TabsContent>

            <TabsContent value="files" className="p-0 m-0">
              <ChatFilesTab discussionId={discussionId} />
            </TabsContent>
          </Tabs>

          <Separator className="my-2" />

          {/* Danger Zone */}
          <div className="p-4 space-y-1">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-2">
              Privacy & Support
            </h4>
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-muted/50 h-10"
            >
              <Flag className="h-4 w-4 mr-3" />
              Report
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-muted/50 h-10"
            >
              <Ban className="h-4 w-4 mr-3" />
              Block
            </Button>
            <Separator className="my-2" />
            <Button
              variant="ghost"
              className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 h-10"
            >
              <LogOut className="h-4 w-4 mr-3" />
              Leave Chat
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 h-10"
            >
              <Trash2 className="h-4 w-4 mr-3" />
              Delete Chat
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
