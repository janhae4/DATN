import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, User } from "lucide-react";

interface ChatMembersTabProps {
  isGroup: boolean;
  members: any[] | null | undefined;
}

export function ChatMembersTab({ isGroup, members }: ChatMembersTabProps) {
  return (
    <div className="p-2">
      {isGroup && members ? (
        <div className="space-y-1">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
            >
              <div className="relative">
                <Avatar className="h-10 w-10 border border-border">
                  <AvatarImage src={member.user.avatar || undefined} />
                  <AvatarFallback className="bg-muted text-muted-foreground">
                    {member.user.name.substring(0, 2)}
                  </AvatarFallback>
                </Avatar>
                {member.isActive && (
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 ring-2 ring-background" />
                )}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                  {member.user.name}
                </p>
                <p className="text-xs text-muted-foreground truncate capitalize">
                  {member.role.toLowerCase()}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
          <User className="h-12 w-12 mb-3 opacity-20" />
          <p className="text-sm">Direct Message</p>
          <p className="text-xs opacity-70">2 participants</p>
        </div>
      )}
    </div>
  );
}
