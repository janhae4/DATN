"use client"

import * as React from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { MoreHorizontal as MoreHorizontalIcon, Trash2, PencilLine } from "lucide-react"
import { ColorPicker } from "../color-picker/ColorPicker"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { Label } from "@/types"
import { useParams } from "next/navigation"
import { useLabels } from "@/hooks/useLabels"


const PRESET_COLORS = [
    "#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#00FFFF", "#FF00FF",
    "#FFA500", "#800080", "#008000", "#000080", "#800000", "#808000"
]

export function LabelEdit({ data }: { data: Label }) {
    // State local (không đổi)
    const [name, setName] = React.useState(data.name)
    const [color, setColor] = React.useState(data.color || "#000000")
    const [tempColor, setTempColor] = React.useState(color) // Temporary color state
    const [isParentOpen, setIsParentOpen] = React.useState(false)
    const [isPickerOpen, setIsPickerOpen] = React.useState(false)

    // Hook
    const params = useParams()
    const projectId = params.projectId as string
    const { updateLabel, deleteLabel } = useLabels(projectId)

    // Sync state (không đổi)
    React.useEffect(() => {
        setName(data.name)
        const newColor = data.color || "#000000"
        setColor(newColor)
        setTempColor(newColor)
    }, [data])

    const stopPropagation = (e: React.MouseEvent | React.FocusEvent) => {
        e.stopPropagation()
    }

    const handleDelete = async () => {
        try {
            await deleteLabel(data.id)
            toast.success(`Đã xóa label "${data.name}"`)
            setIsPickerOpen(false)
            setIsParentOpen(false)
        } catch (error) {
            console.error(error);
            toast.error("Không thể xóa label")
        }
    }

    const handleUpdateName = async () => {
        if (name !== data.name) {
            try {
                await updateLabel(data.id, { name })
                toast.success(`Đổi tên label thành "${name}"`)
            } catch (error) {
                console.error(error);
                toast.error("Không thể đổi tên label")
                setName(data.name)
            }
        }
    }

    const handleUpdateColor = async (newColor: string) => {
        setColor(newColor) // Update state local
        try {
            await updateLabel(data.id, { color: newColor })
        } catch (error) {
            console.error(error);
            toast.error("Không thể đổi màu label")
            setColor(data.color || "#000000") // Revert
        }
    }

    // --- CÁC HÀM XỬ LÝ POPOVER (KHÔNG ĐỔI) ---
    const handleParentOpenChange = (open: boolean) => {
        if (!open) {
            handleUpdateName()
            setIsPickerOpen(false)
        }
        setIsParentOpen(open)
    }

    const handlePickerOpenChange = (open: boolean) => {
        if (open) {
            setTempColor(color);
        }
        setIsPickerOpen(open)
    }

    // --- JSX (KHÔNG ĐỔI) ---
    return (
        // Popover cha
        <Popover open={isParentOpen} onOpenChange={handleParentOpenChange}>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    aria-label="Edit label"
                    onClick={(e) => {
                        stopPropagation(e)
                        setIsParentOpen(true)
                    }}
                    className="flex items-center"
                >
                    <MoreHorizontalIcon width={15} height={15} />
                </button>
            </PopoverTrigger>
            <PopoverContent
                className="w-64 m-2"
                onClick={stopPropagation}
                onFocus={stopPropagation}
                onPointerDownOutside={(e) => {
                    if (isPickerOpen) {
                        e.preventDefault()
                    }
                }}
            >
                <div className="grid gap-4">
                    <div className="space-y-1.5 sr-only">
                        <h4 className="leading-none font-medium">Edit Label</h4>
                    </div>

                    {/* 1. INPUT CHỈNH TÊN */}
                    <div className="grid gap-2">
                        <Input
                            id={`label-name-${data.id}`}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onBlur={handleUpdateName} // Sẽ save khi blur
                            className="h-8"
                        />
                    </div>

                    {/* 2. BUBBLE MÀU SẮC */}
                    <div className="grid gap-2">
                        <div className="flex flex-wrap gap-2 justify-start max-w-full">
                            {PRESET_COLORS.map((presetColor) => {
                                const isSelected = color.toUpperCase() === presetColor.toUpperCase();
                                const bubbleStyle: React.CSSProperties = {
                                    backgroundColor: presetColor
                                };
                                if (isSelected) {
                                    bubbleStyle.borderColor = presetColor;
                                    (bubbleStyle as any)['--tw-ring-color'] = presetColor;
                                }
                                return (
                                    <button
                                        type="button"
                                        key={presetColor}
                                        className={cn(
                                            "w-6 h-6 rounded-full border-2",
                                            "hover:opacity-80 transition-opacity",
                                            isSelected ? "ring-1" : "border-transparent"
                                        )}
                                        style={bubbleStyle}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setTempColor(presetColor);
                                            // Chỗ này gọi hàm đã sửa
                                            handleUpdateColor(presetColor);
                                        }}
                                        aria-label={`Set color to ${presetColor}`}
                                    />
                                );
                            })}

                            {/* 4. BUBBLE COLOR PICKER */}
                            <Popover open={isPickerOpen} onOpenChange={handlePickerOpenChange}>
                                <PopoverTrigger asChild>
                                    <button
                                        type="button"
                                        className={cn(
                                            "w-6 h-6 rounded-full border-2 border-dashed",
                                            "cursor-pointer",
                                            "flex items-center justify-center",
                                            "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        <PencilLine className="w-2.5 h-2.5" />
                                    </button>
                                </PopoverTrigger>

                                <PopoverContent
                                    className="w-auto p-4"
                                    onClick={stopPropagation}
                                    onFocus={stopPropagation}
                                    align="start"
                                >
                                    <ColorPicker
                                        color={tempColor}
                                        onChange={setTempColor}
                                    />
                                    {/* 5. NÚT SAVE */}
                                    <Button
                                        size="sm"
                                        className="w-full mt-3"
                                        onClick={() => {
                                            // Chỗ này cũng gọi hàm đã sửa
                                            handleUpdateColor(tempColor);
                                            setIsPickerOpen(false);
                                            setIsParentOpen(false);
                                        }}>Save</Button>
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    <Separator />

                    {/* NÚT DELETE */}
                    <div className="">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="flex  w-full justify-start hover:bg/10"
                            onClick={handleDelete} // Sẽ xóa khi click
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </Button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}