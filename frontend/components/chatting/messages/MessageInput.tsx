import React, { useRef, useState } from "react";
import { Icon } from "@iconify-icon/react";
import EmojiPicker, { EmojiClickData, Theme } from "emoji-picker-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { fileService } from "@/services/fileService";
import { AttachmentDto } from "@/types";
import { SlashCommandMenu, SlashCommand } from "./SlashCommandMenu";
import { taskService } from "@/services/taskService";
import { discussionService } from "@/services/discussionService";
import { toast } from "sonner";
import { AISummaryBanner } from "./AISummaryBanner";

const ReplyPreviewImage = ({ att, serverId }: { att: AttachmentDto; serverId?: string | null }) => {
    const [previewUrl, setPreviewUrl] = useState<string>("");

    React.useEffect(() => {
        const fetchPreview = async () => {
            if (att.url?.startsWith('http')) {
                setPreviewUrl(att.url);
            } else if (att.url) {
                try {
                    const { viewUrl } = await fileService.getPreviewUrl(att.url, undefined, serverId || undefined);
                    setPreviewUrl(viewUrl);
                } catch {
                }
            }
        };
        fetchPreview();
    }, [att, serverId]);

    if (!previewUrl) return <div className="h-8 w-8 rounded bg-zinc-700 animate-pulse border border-zinc-700 shrink-0" />;

    return (
        <div className="h-8 w-8 rounded overflow-hidden bg-zinc-200 dark:bg-zinc-800 shrink-0 border border-zinc-300 dark:border-zinc-700">
            <img
                src={previewUrl}
                alt="Reply attachment"
                className="h-full w-full object-cover"
                onError={(e) => {
                    e.currentTarget.style.display = 'none';
                }}
            />
        </div>
    );
};



interface MessageInputProps {
    inputMsg: string;
    onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSendMessage: (e: React.FormEvent) => void;
    selectedChannelName?: string;
    onAttachFiles?: (files: File[]) => void;
    replyingTo?: {
        sender: { name: string };
        content: string;
        attachments?: AttachmentDto[];
    } | null;
    onCancelReply?: () => void;
    selectedServerId?: string | null;
    selectedChannelId: string | null;
    selectedTeamId: string | null;
    onGenerateTask?: (messageId?: string) => void;
    // Summary — controlled from parent (ChatArea)
    summaryText?: string | null;
    isSummarizing?: boolean;
    onSummarize?: () => void;
    onCloseSummary?: () => void;
}

export const MessageInput: React.FC<MessageInputProps> = ({
    inputMsg,
    onInputChange,
    onSendMessage,
    selectedChannelName,
    onAttachFiles,
    replyingTo,
    onCancelReply,
    selectedServerId,
    selectedChannelId,
    selectedTeamId,
    onGenerateTask,
    summaryText,
    isSummarizing,
    onSummarize,
    onCloseSummary,
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textInputRef = useRef<HTMLInputElement>(null);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [showSlashMenu, setShowSlashMenu] = useState(false);
    const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

    React.useEffect(() => {
        if (replyingTo && textInputRef.current) {
            textInputRef.current.focus();
        }
    }, [replyingTo]);

    const slashCommands: SlashCommand[] = [
        {
            id: "task",
            label: "/task",
            description: "Create a task from this conversation",
            icon: "lucide:check-square",
            action: async () => {
                if (onGenerateTask) {
                    onGenerateTask();
                } else {
                    toast.error("Task generation not available");
                }
            }
        },
        {
            id: "summarize",
            label: "/summarize",
            description: "AI summarize recent messages",
            icon: "lucide:sparkles",
            action: () => {
                if (onSummarize) {
                    onSummarize();
                } else {
                    toast.error("Summarize not available");
                }
            }
        }
    ];

    const handleInputChangeWithSlash = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const cursorPosition = e.target.selectionStart || 0;
        onInputChange(e);

        const textBeforeCursor = value.substring(0, cursorPosition);
        const lastSlashIndex = textBeforeCursor.lastIndexOf('/');

        if (lastSlashIndex !== -1) {
            const textAfterSlash = value.substring(lastSlashIndex + 1, cursorPosition);
            const hasSpace = textAfterSlash.includes(' ');

            if (!hasSpace) {
                if (textInputRef.current) {
                    const rect = textInputRef.current.getBoundingClientRect();
                    setMenuPosition({
                        top: window.innerHeight - rect.top + 10,
                        left: rect.left,
                    });
                }
                setShowSlashMenu(true);
                return;
            }
        }

        setShowSlashMenu(false);
    };

    const handleCommandSelect = (command: SlashCommand) => {
        setShowSlashMenu(false);

        if (!textInputRef.current) return;

        const cursorPosition = textInputRef.current.selectionStart || 0;
        const value = inputMsg;

        // Find the last / before cursor
        const textBeforeCursor = value.substring(0, cursorPosition);
        const lastSlashIndex = textBeforeCursor.lastIndexOf('/');

        if (lastSlashIndex !== -1) {
            // Remove the / and any text after it up to cursor
            const beforeSlash = value.substring(0, lastSlashIndex);
            const afterCursor = value.substring(cursorPosition);

            // For commands that insert text (like /shrug, /code)
            if (command.id === 'shrug') {
                const newValue = beforeSlash + "¯\\_(ツ)_/¯" + afterCursor;
                const event = {
                    target: { value: newValue }
                } as React.ChangeEvent<HTMLInputElement>;
                onInputChange(event);
            } else if (command.id === 'code') {
                const newValue = beforeSlash + "```\n\n```" + afterCursor;
                const event = {
                    target: { value: newValue }
                } as React.ChangeEvent<HTMLInputElement>;
                onInputChange(event);
                setTimeout(() => {
                    if (textInputRef.current) {
                        const newCursorPos = lastSlashIndex + 4;
                        textInputRef.current.setSelectionRange(newCursorPos, newCursorPos);
                        textInputRef.current.focus();
                    }
                }, 0);
            } else {
                // For other commands (file, giphy), just remove the /
                const newValue = beforeSlash + afterCursor;
                const event = {
                    target: { value: newValue }
                } as React.ChangeEvent<HTMLInputElement>;
                onInputChange(event);

                // Execute command action
                command.action();
            }
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        setSelectedFiles(prev => [...prev, ...files]);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleRemoveFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setShowSlashMenu(false);
        if (selectedFiles.length > 0 && onAttachFiles) {
            onAttachFiles(selectedFiles);
            setSelectedFiles([]);
            return;
        }
        onSendMessage(e);
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    return (
        <div className="p-4 bg-white dark:bg-zinc-950 shrink-0">
            {/* AI Summary Banner */}
            <AISummaryBanner
                isLoading={!!isSummarizing}
                summary={summaryText}
                onClose={onCloseSummary}
            />
            {replyingTo && (

                <div className="mb-2 flex items-center justify-between bg-zinc-100 dark:bg-zinc-900/50 p-2 py-3 rounded-lg border-l-2 border-zinc-300 dark:border-zinc-800 border-y border-r border-zinc-200 dark:border-zinc-800/50">
                    <div className="flex items-center gap-2 overflow-hidden">
                        <Icon icon="lucide:reply" className="text-zinc-500 shrink-0" width="16" />
                        <div className="flex flex-col text-sm overflow-hidden gap-2">
                            <span className="font-semibold text-zinc-700 dark:text-zinc-300">Replying to {replyingTo.sender.name}</span>
                            <div className="flex items-center gap-2">
                                {(() => {
                                    if (replyingTo.attachments?.length) {
                                        const att = replyingTo.attachments[0];
                                        const extension = att.fileName?.toLowerCase().split('.').pop() || '';
                                        const isImage = att.type === 'image' || att.type?.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension);

                                        if (isImage) {
                                            return (
                                                <div className="flex items-center gap-2">
                                                    <ReplyPreviewImage att={att} serverId={selectedServerId} />
                                                    <span className="text-zinc-500 truncate max-w-[300px]">
                                                        {replyingTo.content}
                                                    </span>
                                                </div>
                                            );
                                        }
                                        return (
                                            <span className="text-zinc-500 truncate max-w-[300px]">
                                                {replyingTo.content || att.fileName}
                                            </span>
                                        );
                                    }
                                    return (
                                        <span className="text-zinc-500 truncate max-w-[300px]">
                                            {replyingTo.content}
                                        </span>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                        onClick={onCancelReply}
                    >
                        <Icon icon="lucide:x" width="14" />
                    </Button>
                </div>
            )}

            {selectedFiles.length > 0 && (
                <div className="mb-2 p-3 bg-zinc-100 dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-zinc-800/50">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Attachments ({selectedFiles.length})</span>
                        <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedFiles([])}
                            className="h-6 px-2 text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                        >
                            Clear all
                        </Button>
                    </div>
                    <div className="space-y-1.5">
                        {selectedFiles.map((file, index) => (
                            <div
                                key={index}
                                className="flex items-center gap-2 p-2 bg-zinc-200/50 dark:bg-zinc-800/50 rounded-md group hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                            >
                                {file.type.startsWith('image/') ? (
                                    <div className="flex-shrink-0 w-10 h-10 bg-zinc-700 rounded overflow-hidden">
                                        <img
                                            src={URL.createObjectURL(file)}
                                            alt={file.name}
                                            className="w-full h-full object-cover"
                                            onLoad={(e) => URL.revokeObjectURL((e.target as HTMLImageElement).src)}
                                        />
                                    </div>
                                ) : (
                                    <div className="flex-shrink-0 w-10 h-10 bg-zinc-700 rounded flex items-center justify-center">
                                        <Icon
                                            icon={
                                                file.type.startsWith('video/') ? 'lucide:video' :
                                                    file.type.startsWith('audio/') ? 'lucide:music' :
                                                        file.type.includes('pdf') ? 'lucide:file-text' :
                                                            'lucide:file'
                                            }
                                            width="18"
                                            className="text-zinc-400"
                                        />
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-zinc-700 dark:text-zinc-200 truncate">{file.name}</p>
                                    <p className="text-xs text-zinc-500">{formatFileSize(file.size)}</p>
                                </div>
                                <Button
                                    type="button"
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => handleRemoveFile(index)}
                                    className="h-7 w-7 opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 transition-all"
                                >
                                    <Icon icon="lucide:x" width="14" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {showSlashMenu && (
                <SlashCommandMenu
                    commands={slashCommands}
                    onSelect={handleCommandSelect}
                    position={menuPosition}
                />
            )}

            <div className="relative bg-zinc-100 dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-zinc-800/50 focus-within:border-zinc-400 dark:focus-within:border-zinc-700 transition-all shadow-sm">
                <form
                    onSubmit={handleSubmit}
                    className="flex items-center px-2 py-2 gap-2"
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.zip,.rar"
                    />
                    <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 h-9 w-9 shrink-0 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800"
                    >
                        <Icon icon="lucide:plus" width="20" />
                    </Button>

                    <div className="h-6 w-[1px] bg-zinc-300 dark:bg-zinc-800"></div>

                    <input
                        ref={textInputRef}
                        type="text"
                        value={inputMsg}
                        onChange={handleInputChangeWithSlash}
                        placeholder={`Message #${selectedChannelName || "channel"}`}
                        className="flex-1 bg-transparent border-none outline-none text-zinc-900 dark:text-zinc-200 placeholder-zinc-500 dark:placeholder-zinc-500 text-[15px] min-w-0"
                    />

                    <div className="flex items-center gap-1">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button type="button" size="icon" variant="ghost" className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 h-9 w-9 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800">
                                    <Icon icon="lucide:smile" width="20" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 border-none bg-transparent shadow-none" side="top" align="end">
                                <EmojiPicker
                                    onEmojiClick={(emojiData: EmojiClickData) => {
                                        const event = {
                                            target: { value: inputMsg + emojiData.emoji }
                                        } as React.ChangeEvent<HTMLInputElement>;
                                        onInputChange(event);
                                    }}
                                    theme={Theme.AUTO}
                                />
                            </PopoverContent>
                        </Popover>

                        {(inputMsg.trim() || selectedFiles.length > 0) && (
                            <Button type="submit" size="icon" className="h-9 w-9 rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-md ml-1 transition-all animate-in zoom-in-50 duration-200">
                                <Icon icon="lucide:send" width="16" />
                            </Button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};
