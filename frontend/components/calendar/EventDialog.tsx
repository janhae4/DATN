"use client"

import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import {
    Loader2, Clock, Calendar as CalendarIcon,
    AlignLeft, X, Type, CalendarDays, Trash2, Save
} from "lucide-react";

// Shadcn UI Components
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface EventDialogProps {
    isOpen: boolean;
    onClose: () => void;
    // Dữ liệu đầu vào: Có thể là Slot (Tạo mới) hoặc Event (Sửa)
    initialData: {
        id?: string;
        title?: string;
        desc?: string;
        start: Date;
        end: Date;
        calendarId?: string;
    } | null;
    calendars: any[];
    onCreate: (data: any) => void;
    onUpdate: (id: string, data: any) => void;
    onDelete: (id: string) => void;
    isLoading: boolean;
}

export default function EventDialog({
    isOpen,
    onClose,
    initialData,
    calendars,
    onCreate,
    onUpdate,
    onDelete,
    isLoading
}: EventDialogProps) {
    const isEditing = !!initialData?.id; // Nếu có ID -> Đang sửa

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [selectedCalendarId, setSelectedCalendarId] = useState<string>("");

    // Date & Time State
    const [startDate, setStartDate] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endDate, setEndDate] = useState("");
    const [endTime, setEndTime] = useState("");

    // Sync data when modal opens
    useEffect(() => {
        if (isOpen && initialData) {
            setTitle(initialData.title || "");
            setDescription(initialData.desc || "");

            // Split date and time for inputs
            setStartDate(format(initialData.start, "yyyy-MM-dd"));
            setStartTime(format(initialData.start, "HH:mm"));
            setEndDate(format(initialData.end, "yyyy-MM-dd"));
            setEndTime(format(initialData.end, "HH:mm"));

            // Set calendar
            if (initialData.calendarId) {
                setSelectedCalendarId(initialData.calendarId);
            } else if (calendars && calendars.length > 0) {
                const primary = calendars.find(c => c.primary);
                setSelectedCalendarId(primary ? primary.id : calendars[0].id);
            }
        }
    }, [isOpen, initialData, calendars]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        const startISO = new Date(`${startDate}T${startTime}`).toISOString();
        const endISO = new Date(`${endDate}T${endTime}`).toISOString();

        const payload = {
            summary: title,
            description: description,
            startTime: startISO,
            endTime: endISO,
            calendarId: selectedCalendarId,
        };

        if (isEditing && initialData?.id) {
            onUpdate(initialData.id, payload);
        } else {
            onCreate(payload);
        }
    };

    const handleDelete = () => {
        if (initialData?.id && confirm("Are you sure you want to delete this event?")) {
            onDelete(initialData.id);
        }
    };

    if (!initialData) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 border-zinc-200 dark:border-zinc-800 shadow-2xl p-0 gap-0 overflow-hidden">

                {/* Header */}
                <div className="px-6 py-5 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 flex justify-between items-start">
                    <div>
                        <DialogTitle className="text-xl font-semibold tracking-tight">
                            {isEditing ? "Edit Event" : "Create Event"}
                        </DialogTitle>
                        <DialogDescription className="text-zinc-500 dark:text-zinc-400 mt-1.5">
                            {isEditing ? "Update event details or delete it." : "Schedule a new event or meeting."}
                        </DialogDescription>
                    </div>

                </div>

                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-6">
                        {/* Title */}
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase text-zinc-400 dark:text-zinc-500 tracking-widest flex items-center gap-1.5 select-none">
                                <Type className="h-3 w-3" /> Event Title
                            </Label>
                            <Input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Add title..."
                                autoFocus={!isEditing}
                                required
                                className="
      h-auto py-1.5
      text-2xl font-medium
      border-0 border-b border-zinc-200 dark:border-zinc-800
      rounded-none px-0
      bg-transparent
      focus-visible:ring-0 focus-visible:border-zinc-900 dark:focus-visible:border-zinc-100
      placeholder:text-zinc-300 dark:placeholder:text-zinc-700
      transition-colors duration-200
    "
                            />
                        </div>

                        {/* Date & Time */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800">
                            {/* Start */}
                            <div className="space-y-3">
                                <Label className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300 font-semibold text-sm">
                                    Starts
                                </Label>
                                <div className="flex flex-col gap-2">
                                    <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-white dark:bg-zinc-950" required />
                                    <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="bg-white dark:bg-zinc-950" required />
                                </div>
                            </div>
                            {/* End */}
                            <div className="space-y-3">
                                <Label className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300 font-semibold text-sm">
                                    Ends
                                </Label>
                                <div className="flex flex-col gap-2">
                                    <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-white dark:bg-zinc-950" required />
                                    <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="bg-white dark:bg-zinc-950" required />
                                </div>
                            </div>
                        </div>

                        {/* Calendar & Desc */}
                        <div className="space-y-5">
                            <div className="space-y-3">
                                <Label className="text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400 tracking-wider flex items-center gap-2">
                                    <CalendarIcon className="h-3 w-3" /> Calendar
                                </Label>
                                <Select value={selectedCalendarId} onValueChange={setSelectedCalendarId}>
                                    <SelectTrigger className="h-11 bg-white dark:bg-zinc-950"><SelectValue placeholder="Select calendar" /></SelectTrigger>
                                    <SelectContent>
                                        {calendars?.map((cal) => (
                                            <SelectItem key={cal.id} value={cal.id}>
                                                <div className="flex items-center gap-2">
                                                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: cal.backgroundColor || '#71717a' }} />
                                                    {cal.summary}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400 tracking-wider flex items-center gap-2">
                                    <AlignLeft className="h-3 w-3" /> Description
                                </Label>
                                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Add notes..." className="min-h-[100px] bg-zinc-50/50 dark:bg-zinc-900/50" />
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <DialogFooter className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-900/30 flex justify-between items-center sm:justify-between w-full">
                        {isEditing ? (
                            <Button type="button" variant="ghost" onClick={handleDelete} className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30">
                                <Trash2 className="h-4 w-4 mr-2" /> Delete
                            </Button>
                        ) : (
                            <div /> /* Spacer */
                        )}

                        <div className="flex gap-3">
                            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>Cancel</Button>
                            <Button type="submit" disabled={!title.trim() || isLoading} className="bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950">
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (
                                    <>
                                        <Save className="h-4 w-4 mr-2" /> {isEditing ? "Update" : "Save"}
                                    </>
                                )}
                            </Button>
                        </div>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}