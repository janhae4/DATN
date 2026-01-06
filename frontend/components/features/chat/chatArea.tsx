"use client";

import * as React from "react";
import {
  Send,
  Paperclip,
  Smile,
  MoreVertical,
  Phone,
  Video,
  Search,
  X,
  File,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

import { useMessages, useDiscussion, useSendMessage } from "@/hooks/useTeam";
import { useUserProfile } from "@/hooks/useAuth";

interface MessageProps {
  message: any;
  isMe: boolean;
}

function MessageItem({ message, isMe }: MessageProps) {
  return (
    <div
      className={cn(
        "flex w-full gap-2 mb-4",
        isMe ? "flex-row-reverse" : "flex-row"
      )}
    >
      <Avatar className="h-8 w-8 mt-1">
        <AvatarImage src={message.sender.avatar} />
        <AvatarFallback>{message.sender.name.substring(0, 2)}</AvatarFallback>
      </Avatar>
      <div
        className={cn(
          "flex flex-col max-w-[70%]",
          isMe ? "items-end" : "items-start"
        )}
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium text-muted-foreground">
            {message.sender.name}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <div
          className={cn(
            "px-4 py-2 rounded-lg text-sm",
            isMe
              ? "bg-primary text-primary-foreground rounded-tr-none"
              : "bg-muted text-foreground rounded-tl-none"
          )}
        >
          {message.content}
        </div>
      </div>
    </div>
  );
}

interface ChatAreaProps {
  onToggleInfo?: () => void;
  discussionId: string | null;
}

export default function ChatArea({ onToggleInfo, discussionId }: ChatAreaProps) {
  const [inputValue, setInputValue] = React.useState("");
  const [attachments, setAttachments] = React.useState<File[]>([]);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const { data: user } = useUserProfile();
  const { data: discussion } = useDiscussion(discussionId);
  const { data: messages } = useMessages(discussionId);
  const { mutate: sendMessage } = useSendMessage();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if ((!inputValue.trim() && attachments.length === 0) || !discussionId || !user) return;
    
    sendMessage({
      discussionId,
      content: inputValue
    });

    setInputValue("");
    setAttachments([]);
  };


  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const validFiles = newFiles.filter((file) => {
        const isUnder20MB = file.size <= 20 * 1024 * 1024;
        if (!isUnder20MB) {
          toast.error(`File ${file.name} exceeds 20MB limit.`);
        }
        return isUnder20MB;
      });

      if (validFiles.length > 0) {
        setAttachments((prev) => [...prev, ...validFiles]);
      }
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const addEmoji = (emoji: string) => {
    setInputValue((prev) => prev + emoji);
  };

  const COMMON_EMOJIS = [
    "👍",
    "❤️",
    "😂",
    "😮",
    "😢",
    "😡",
    "🎉",
    "🔥",
    "👀",
    "🚀",
    "💯",
    "✅",
    "👋",
    "🙏",
    "🤝",
    "✨",
    "💀",
    "🤡",
  ];

  return (
    <div className="flex flex-col h-full bg-background ">
      <div className="flex items-center justify-between px-6 py-3 border-b">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar>
              <AvatarImage src="/mock-data/avatar-group.jpg" />
              <AvatarFallback>{discussion?.name?.substring(0, 2).toUpperCase() || "#"}</AvatarFallback>
            </Avatar>
            {/* <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-background" /> */}
          </div>
          <div>
            <h3 className="font-semibold text-sm">{discussion?.name || "Select a channel"}</h3>
            <p className="text-xs text-muted-foreground">{discussion ? "Channel" : ""}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon">
            <Phone className="h-4 w-4 text-muted-foreground" />
          </Button>
          <Button variant="ghost" size="icon">
            <Video className="h-4 w-4 text-muted-foreground" />
          </Button>
          <Button variant="ghost" size="icon">
            <Search className="h-4 w-4 text-muted-foreground" />
          </Button>
          <Separator orientation="vertical" className="h-6 mx-1" />
          <Button variant="ghost" size="icon" onClick={onToggleInfo}>
            <MoreVertical className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      </div>

      <div
        className="flex-1 p-4 overflow-auto /* Tùy chỉnh độ rộng scrollbar */
"
      >
        <div className="flex flex-col px-2">
          {/* Date Separator Example */}
          <div className="flex items-center justify-center my-4">
            <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-full">
              Today
            </span>
          </div>

          {messages?.map((msg) => (
            <MessageItem
              key={msg.id}
              message={msg}
              isMe={msg.sender.id === user?.id}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className=" p-4 border-t bg-background">
        <div className="flex flex-col gap-2 bg-muted/30 p-2 rounded-xl border focus-within:ring-1 focus-within:ring-ring">
          {attachments.length > 0 && (
            <div className="flex gap-2 overflow-x-auto p-2">
              {attachments.map((file, index) => (
                <div
                  key={index}
                  className="relative group flex items-center justify-center bg-background border shadow-sm rounded  shrink-0 gap-2 hover:border-primary/40 transition-all"
                >
                  {file.type.startsWith("image/") ? (
                    <div className="relative w-12 h-12 rounded overflow-hidden">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex p-2 items-center ">
                      <div className="">
                        <File height={12} />
                      </div>
                      <span
                        className=" font-bold text-[12px] text-center truncate max-w-[80px] px-1"
                        title={file.name}
                      >
                        {file.name}
                      </span>
                    </div>
                  )}
                  <button
                    onClick={() => removeAttachment(index)}
                    className="absolute -top-2 -right-2 bg-background border shadow-sm text-muted-foreground hover:text-white cursor-pointer hover:bg-black rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all"
                    type="button"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
              onClick={handleFileClick}
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              multiple
              onChange={handleFileChange}
            />
            <div className="flex-1 min-h-[40px] flex items-center">
              <Input
                placeholder="Type a message..."
                className="border-none shadow-none focus-visible:ring-0 bg-transparent px-2 h-auto py-2 max-h-[120px] overflow-y-auto resize-none"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  >
                    <Smile className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-2" align="end" side="top">
                  <div className="grid grid-cols-6 gap-1">
                    {COMMON_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        className="text-xl hover:bg-muted p-1 rounded transition-colors"
                        onClick={() => addEmoji(emoji)}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              <Button
                size="icon"
                onClick={handleSend}
                disabled={!inputValue.trim() && attachments.length === 0}
              >
                <Send />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
