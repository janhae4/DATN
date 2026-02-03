import React from "react";
import { Icon } from "@iconify-icon/react";
import EmojiPicker, { EmojiClickData, Theme } from "emoji-picker-react";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

interface MessageInputProps {
    inputMsg: string;
    onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSendMessage: (e: React.FormEvent) => void;
    selectedChannelName?: string;
}

export const MessageInput: React.FC<MessageInputProps> = ({
    inputMsg,
    onInputChange,
    onSendMessage,
    selectedChannelName
}) => {
    return (
        <div className="p-4 bg-zinc-950 shrink-0">
            <div className="relative bg-zinc-900 rounded-xl border border-zinc-800 focus-within:border-zinc-700 transition-all shadow-sm">
                <form
                    onSubmit={onSendMessage}
                    className="flex items-center px-2 py-2 gap-2"
                >
                    <Button type="button" size="icon" variant="ghost" className="text-zinc-400 hover:text-zinc-100 h-9 w-9 shrink-0 rounded-full hover:bg-zinc-800">
                        <Icon icon="lucide:plus" width="20" />
                    </Button>

                    <div className="h-6 w-[1px] bg-zinc-800"></div>

                    <input
                        type="text"
                        value={inputMsg}
                        onChange={onInputChange}
                        placeholder={`Message #${selectedChannelName || "channel"}`}
                        className="flex-1 bg-transparent border-none outline-none text-zinc-200 placeholder-zinc-500 text-[15px] min-w-0"
                    />

                    <div className="flex items-center gap-1">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button type="button" size="icon" variant="ghost" className="text-zinc-400 hover:text-zinc-100 h-9 w-9 rounded-full hover:bg-zinc-800">
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
                                    theme={Theme.DARK}
                                />
                            </PopoverContent>
                        </Popover>

                        {inputMsg.trim() && (
                            <Button type="submit" size="icon" className="h-9 w-9 rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-md ml-1 transition-all animate-in zoom-in-50 duration-200">
                                <Icon icon="lucide:send" width="16" />
                            </Button>
                        )}
                    </div>
                </form>
            </div>
            <div className="text-[10px] text-zinc-600 text-center mt-2 font-medium">
                <span className="hidden sm:inline">Return to send, Shift + Return to add a new line</span>
            </div>
        </div>
    );
};
