"use client"

import * as React from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Tags } from "lucide-react"
import { Label } from "@/types"
import { db } from "@/public/mock-data/mock-data"
import { LabelInput } from "./LabelInput"
// Bỏ LabelTag vì không dùng ở list nữa
// import { LabelTag } from "./LabelTag" 
import { Separator } from "@/components/ui/separator"
// --- IMPORT THÊM ---
import { LabelEdit } from "./LabelEdit" // Import cái nút "..." (MoreHorizontalIcon)

// Prop interface (không đổi)
export interface LabelPopoverProps {
    initialSelectedLabelIds?: string[];
    onSelectionChange: (newLabels: Label[]) => void;
}

export function LabelPopover({
    initialSelectedLabelIds = [],
    onSelectionChange
}: LabelPopoverProps) {
    
    // Mấy cái state và logic (không đổi)
    const [allLabels, setAllLabels] = React.useState(() => db.labels || []);
    const [selectedLabels, setSelectedLabels] = React.useState<Label[]>(() => {
        const selectedIdsSet = new Set(initialSelectedLabelIds);
        const initialSelected = allLabels.filter(l => selectedIdsSet.has(l.id));
        const uniqueSelectedMap = new Map<string, Label>();
        initialSelected.forEach(label => {
            const nameLower = label.name.toLowerCase();
            if (!uniqueSelectedMap.has(nameLower)) {
                uniqueSelectedMap.set(nameLower, label);
            }
        });
        return Array.from(uniqueSelectedMap.values());
    });
    const [inputValue, setInputValue] = React.useState('');

    // Hàm update (không đổi)
    const handleSelectionChange = (newSelectedLabels: Label[]) => {
        const newlyCreatedLabels = newSelectedLabels.filter(
            selected => !allLabels.find(all => all.id === selected.id)
        );
        if (newlyCreatedLabels.length > 0) {
            setAllLabels(prevAllLabels => [
                ...prevAllLabels,
                ...newlyCreatedLabels
            ]);
            newlyCreatedLabels.forEach(label => {
                console.log(`[FAKE API]: Đang tạo label mới "${label.name}"...`);
                if (!db.labels.find(l => l.id === label.id)) {
                    db.labels.push(label);
                }
            });
        }
        setSelectedLabels(newSelectedLabels);
        onSelectionChange(newSelectedLabels);
    }

    // List available (không đổi)
    const availableLabels = React.useMemo(() => {
        const selectedNamesLower = new Set(selectedLabels.map(l => l.name.toLowerCase()));
        const unselected = allLabels.filter(label =>
            !selectedNamesLower.has(label.name.toLowerCase())
        );
        const uniqueUnselectedMap = new Map<string, Label>();
        unselected.forEach(label => {
            const nameLower = label.name.toLowerCase();
            if (!uniqueUnselectedMap.has(nameLower)) {
                uniqueUnselectedMap.set(nameLower, label);
            }
        });
        return Array.from(uniqueUnselectedMap.values());
    }, [allLabels, selectedLabels]);

    // List filtered (không đổi)
    const filteredAvailableLabels = React.useMemo(() => {
        if (!inputValue) {
            return availableLabels; // Bỏ slice(0, 10) để test, nếu lag thì thêm lại
        }
        return availableLabels.filter(label =>
            label.name.toLowerCase().includes(inputValue.toLowerCase())
        );
    }, [availableLabels, inputValue]);

    // Hàm add (không đổi)
    const addLabel = (labelToAdd: Label) => {
        if (!selectedLabels.find(l => l.name.toLowerCase() === labelToAdd.name.toLowerCase())) {
            const newLabels = [...selectedLabels, labelToAdd];
            handleSelectionChange(newLabels);
            setInputValue('');
        }
    }

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    size="icon"
                    className="h-6 w-6 rounded-md cursor-pointer text-muted-foreground flex-shrink-0"
                    onClick={(e) => e.stopPropagation()}
                >
                    <Tags className="h-3.5 w-3.5" />
                </Button>
            </PopoverTrigger>

            <PopoverContent
                className="w-80 p-0"
                align="start"
                onClick={e => e.stopPropagation()}
            >
                {/* 1. Khu vực Input (Không đổi) */}
                <div className="p-3">
                    <LabelInput
                        onChange={handleSelectionChange}
                        initialTags={selectedLabels}
                        placeholder="Search or add tags..."
                        inputValue={inputValue}
                        onInputChange={setInputValue}
                    />
                </div>

                <Separator />

                {/* --- KHU VỰC LIST ĐÃ SỬA (THEO Ý MÀY) --- */}
                {/* 2. List các Label Available (Đã lọc) */}
                <div className="p-3">
                    <p className="text-xs font-medium text-muted-foreground mb-2 px-1">
                        Available labels
                    </p>
                    
                    {/* Thay "flex-wrap" bằng "flex-col" */}
                    <div className="flex flex-col gap-0.5 max-h-40 overflow-y-auto">
                        {filteredAvailableLabels.length > 0 ? (
                            filteredAvailableLabels.map(label => (
                                <div 
                                    key={label.id} 
                                    className="flex items-center justify-between rounded-md group hover:bg-muted/50"
                                >
                                    <div    
                                        className="flex-1 cursor-pointer px-2 py-1.5 rounded-l-md "
                                        onClick={() => addLabel(label)}
                                    >
                                        <span 
                                            style={{
                                                backgroundColor: `${label.color}20`,
                                                color: label.color,
                                                border: `1px solid ${label.color}40`,
                                            }} 
                                            className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium"
                                        >
                                            {label.name}
                                        </span>
                                    </div>

                                    <div 
                                        className="px-1 opacity-0 group-hover:opacity-100 transition-opacity rounded-r-md "
                                        onClick={(e) => e.stopPropagation()} 
                                    >
                                        <LabelEdit data={label} />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-muted-foreground px-1">
                                {inputValue ? 'No labels found.' : (availableLabels.length === 0 ? 'All labels selected.' : 'No labels found.')}
                            </p>
                        )}
                    </div>
                </div>

            </PopoverContent>
        </Popover>
    )
}