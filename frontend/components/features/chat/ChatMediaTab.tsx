import * as React from "react";
import { Button } from "@/components/ui/button";
import { Image as ImageIcon } from "lucide-react";
import { useMessages } from "@/hooks/useTeam";
import { Message } from "@/types/communication/discussion.interface";

interface ChatMediaTabProps {
  discussionId: string | null;
}

export function ChatMediaTab({ discussionId }: ChatMediaTabProps) {
  const { data: messages, isLoading } = useMessages(discussionId);

  const media = React.useMemo(() => {
    if (!messages) return [];
    const allMedia: any[] = [];
    messages.forEach((msg: Message) => {
      if (msg.attachments && Array.isArray(msg.attachments)) {
        msg.attachments.forEach((att: any) => {
          if (att.fileType?.startsWith("image/")) {
            allMedia.push({
              ...att,
              createdAt: msg.createdAt,
              messageId: msg.id,
            });
          }
        });
      }
    });
    return allMedia;
  }, [messages]);

  if (isLoading) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Loading media...
      </div>
    );
  }

  if (media.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
        <ImageIcon className="h-10 w-10 mb-2 opacity-20" />
        <p className="text-sm">No media shared yet</p>
      </div>
    );
  }

  return (
    <div className="p-4 m-0">
      <div className="grid grid-cols-3 gap-2">
        {media.map((item, i) => (
          <div
            key={`${item.messageId}-${i}`}
            className="aspect-square bg-muted/50 rounded-lg flex items-center justify-center hover:bg-muted transition-colors cursor-pointer overflow-hidden relative group"
            onClick={() => window.open(item.fileUrl, "_blank")}
          >
            {item.fileUrl ? (
              <img
                src={item.fileUrl}
                alt={item.fileName}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
              />
            ) : (
              <ImageIcon className="h-6 w-6 text-muted-foreground/50 group-hover:scale-110 transition-transform" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

