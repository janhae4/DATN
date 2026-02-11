import React from "react";
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DiscussionDto, ServerMemberDto } from "@/types";

interface SearchPaletteProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    directDiscussions: DiscussionDto[];
    teamMembers: ServerMemberDto[];
    currentUserId?: string;
    onSelectDirectMessage?: (userId: string) => void;
}

export const SearchPalette: React.FC<SearchPaletteProps> = ({
    open,
    onOpenChange,
    directDiscussions,
    teamMembers,
    currentUserId,
    onSelectDirectMessage,
}) => {
    return (
        <CommandDialog open={open} onOpenChange={onOpenChange} className="max-w-[500px] mx-2">
            <CommandInput placeholder="Search for users or direct messages..." />
            <CommandList className="no-scrollbar">
                <CommandEmpty>No results found.</CommandEmpty>
                {directDiscussions.length > 0 && (
                    <CommandGroup heading="Direct Messages">
                        {directDiscussions.map((dm) => {
                            const partnerId = dm.partnerId || dm.name.split("_").find((id: string) => id !== currentUserId);
                            const partner = teamMembers.find(m => m.userId === partnerId);

                            let name = partner?.name;
                            let avatar = partner?.avatar;

                            if (!name && dm.otherUser) {
                                name = dm.otherUser.name;
                                avatar = dm.otherUser.avatar;
                            }

                            if (!name) name = "Unknown User";

                            return (
                                <CommandItem
                                    key={dm.id}
                                    onSelect={() => {
                                        if (partnerId && onSelectDirectMessage) {
                                            onSelectDirectMessage(partnerId);
                                            onOpenChange(false);
                                        }
                                    }}
                                    className="flex items-center gap-3 p-2 cursor-pointer"
                                    value={name} // Search by name
                                >
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={avatar} />
                                        <AvatarFallback className="bg-zinc-200 dark:bg-zinc-800 text-xs text-zinc-500 font-semibold">
                                            {name?.substring(0, 2).toUpperCase() || "DM"}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                        <span className="font-medium text-sm text-zinc-700 dark:text-zinc-200">{name}</span>
                                        <span className="text-xs text-zinc-500">Jump to conversation</span>
                                    </div>
                                </CommandItem>
                            );
                        })}
                    </CommandGroup>
                )}
                <CommandGroup heading="People">
                    {teamMembers
                        .filter(member => member.userId !== currentUserId)
                        .map((member) => (
                            <CommandItem
                                key={member.userId}
                                onSelect={() => {
                                    if (onSelectDirectMessage) {
                                        onSelectDirectMessage(member.userId);
                                        onOpenChange(false);
                                    }
                                }}
                                className="flex items-center gap-3 p-2 cursor-pointer"
                                value={member.name} // Search by name
                            >
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={member.avatar} />
                                    <AvatarFallback className="bg-zinc-200 dark:bg-zinc-800 text-xs">
                                        {member.name?.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                    <span className="font-medium text-sm">{member.name}</span>
                                    <span className="text-xs text-zinc-500">@{member.userId.substring(0, 6)}</span>
                                </div>
                            </CommandItem>
                        ))}
                </CommandGroup>
            </CommandList>
        </CommandDialog>
    );
};
