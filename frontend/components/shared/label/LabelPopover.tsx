"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import { Tags } from "lucide-react"

// UI Components
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

// Internal Components & Hooks
import { LabelInput } from "./LabelInput"
import { LabelEdit } from "./LabelEdit"
import { useLabels } from "@/hooks/useLabels"
import { useDeleteTaskLabel } from "@/hooks/useTaskLabel"
import { Label, TaskLabel } from "@/types"

export interface LabelPopoverProps {
    initialSelectedLabels: TaskLabel[];
    taskId: string;
    onSelectionChange: (newLabels: Label[]) => void;
}

export function LabelPopover({
    initialSelectedLabels = [],
    taskId,
    onSelectionChange
}: LabelPopoverProps) {

    const params = useParams();
    const projectId = params.projectId as string;

    // 1. DATA FETCHING
    const { labels: allLabels = [] } = useLabels(projectId);
    const { mutate: deleteTaskLabel } = useDeleteTaskLabel();

    // 2. STATE MANAGEMENT
    const [selectedLabels, setSelectedLabels] = React.useState<Label[]>([]);
    const [inputValue, setInputValue] = React.useState('');
    const [isOpen, setIsOpen] = React.useState(false);

    // 3. SYNC STATE (Props -> Client State)
    // Map data từ props sang state để hiển thị
    const formattedSelectedLabels = React.useMemo<Label[]>(() => {
        return initialSelectedLabels.map((tl) => ({
            id: (tl as any).labelId || tl.id,
            name: tl.name,
            color: tl.color,
            projectId: tl.projectId,
            createdAt: "",
            updatedAt: "",
        }));
    }, [initialSelectedLabels]);

    React.useEffect(() => {
        // Chỉ sync khi props thực sự thay đổi và khác với state hiện tại
        // (Để tránh việc props cũ đè lên state mới vừa update)
        setSelectedLabels(formattedSelectedLabels);
    }, [formattedSelectedLabels]);

    // 4. HANDLERS

    const updateSelection = (newFullList: Label[]) => {
        const newItemsOnly = newFullList.filter(newItem =>
            !selectedLabels.some(oldItem => oldItem.id === newItem.id)
        );
        const removedItems = selectedLabels.filter(oldItem => 
            !newFullList.some(newItem => newItem.id === oldItem.id)
        );

        setSelectedLabels(newFullList);

        if (newItemsOnly.length > 0) {
            onSelectionChange(newItemsOnly);
        }

        if (removedItems.length > 0) {
             removedItems.forEach(label => {
                 deleteTaskLabel({ taskId, labelId: label.id });
             });
        }
    };

    const handleSelectFromList = (labelToAdd: Label) => {
        const isAlreadySelected = selectedLabels.some(l => l.id === labelToAdd.id);

        if (!isAlreadySelected) {
            // 1. UI cần danh sách đầy đủ để hiển thị (Cũ + Mới)
            const fullListForUI = [...selectedLabels, labelToAdd];
            setSelectedLabels(fullListForUI);

            // 2. Callback chỉ gửi ĐÚNG 1 cái label vừa được chọn (Cái mới)
            onSelectionChange([labelToAdd]);
        }

        setInputValue('');
    };

    // 5. FILTERING LOGIC
    const availableLabels = React.useMemo(() => {
        const selectedIds = new Set(selectedLabels.map(l => l.id));
        return allLabels.filter(l => !selectedIds.has(l.id));
    }, [allLabels, selectedLabels]);

    const filteredAvailableLabels = React.useMemo(() => {
        if (!inputValue) return availableLabels;
        return availableLabels.filter(label =>
            label.name.toLowerCase().includes(inputValue.toLowerCase())
        );
    }, [availableLabels, inputValue]);

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    size="icon"
                    className="h-6 w-6 rounded-md text-muted-foreground"
                    onClick={(e) => e.stopPropagation()}
                >
                    <Tags className="h-4 w-4" />
                </Button>
            </PopoverTrigger>

            <PopoverContent
                className="w-80 p-0"
                align="start"
                side="bottom"
                onClick={e => e.stopPropagation()}
            >
                {/* INPUT AREA */}
                <div className="p-3">
                    <LabelInput
                        initialTags={selectedLabels}
                        onChange={updateSelection}
                        placeholder="Search or create tag..."
                        inputValue={inputValue}
                        onInputChange={setInputValue}
                    />
                </div>

                <Separator />

                {/* AVAILABLE LIST AREA */}
                <div className="p-2">
                    <p className="text-xs font-medium text-muted-foreground px-2 mb-2">
                        Available labels
                    </p>

                    <div className="flex flex-col gap-1 max-h-[200px] overflow-y-auto">
                        {filteredAvailableLabels.length > 0 ? (
                            filteredAvailableLabels.map(label => (
                                <div
                                    key={label.id}
                                    className="flex items-center justify-between rounded-sm px-2 py-1.5 hover:bg-accent cursor-pointer group transition-colors"
                                    onClick={() => handleSelectFromList(label)}
                                >
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <div
                                            className="w-3 h-3 rounded-full flex-shrink-0"
                                            style={{ backgroundColor: label.color }}
                                        />
                                        <span className="text-sm truncate font-medium">
                                            {label.name}
                                        </span>
                                    </div>

                                    <div
                                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <LabelEdit data={label} />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                                {inputValue
                                    ? `Press Enter to create "${inputValue}"`
                                    : "No more labels available."}
                            </div>
                        )}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}