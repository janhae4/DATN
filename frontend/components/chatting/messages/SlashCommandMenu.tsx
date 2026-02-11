import React from "react";
import { Icon } from "@iconify-icon/react";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandItem,
    CommandList,
} from "@/components/ui/command";

export interface SlashCommand {
    id: string;
    label: string;
    description: string;
    icon: string;
    action: () => void;
}

interface SlashCommandMenuProps {
    commands: SlashCommand[];
    onSelect: (command: SlashCommand) => void;
    position: { top: number; left: number };
}

export const SlashCommandMenu: React.FC<SlashCommandMenuProps> = ({
    commands,
    onSelect,
    position,
}) => {
    return (
        <div
            className="absolute z-50 w-80 animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2"
            style={{
                bottom: position.top,
                left: position.left,
            }}
        >
            <Command className="rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-xl bg-white dark:bg-zinc-900">
                <CommandList className="max-h-64">
                    <CommandEmpty className="py-6 text-center text-sm text-zinc-500">
                        No commands found.
                    </CommandEmpty>
                    <CommandGroup heading="Commands">
                        {commands.map((command) => (
                            <CommandItem
                                key={command.id}
                                value={command.label}
                                onSelect={() => onSelect(command)}
                                className="flex items-center gap-3 px-3 py-2.5 cursor-pointer"
                            >
                                <div className="flex items-center justify-center w-8 h-8 rounded-md bg-zinc-100 dark:bg-zinc-800">
                                    <Icon
                                        icon={command.icon}
                                        width="18"
                                        className="text-zinc-600 dark:text-zinc-400"
                                    />
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <span className="font-medium text-sm text-zinc-900 dark:text-zinc-100">
                                        {command.label}
                                    </span>
                                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                        {command.description}
                                    </span>
                                </div>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                </CommandList>
            </Command>
        </div>
    );
};
