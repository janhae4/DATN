"use client"

import React, { useState, useCallback, useMemo } from "react";
import { Calendar, View, dateFnsLocalizer, Views } from "react-big-calendar";
import { startOfMonth, endOfMonth, startOfWeek, getDay, format, parse } from "date-fns";
import { enUS } from "date-fns/locale";
import { Loader2, Calendar as CalendarIcon } from "lucide-react";

// Components
import { Card, CardContent } from "@/components/ui/card";
import CustomToolbar from "./CustomToolbar";
import EventDialog from "./EventDialog";

// Hooks
import { useCalendarList, useEvents, useCreateEvent, useUpdateEvent, useDeleteEvent } from '@/hooks/useCalendar';
import { MyEvent } from "@/types/calendar/myEvent.interface";

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

export default function CalendarContent() {
    const [date, setDate] = useState(new Date());
    const [view, setView] = useState<View>(Views.WEEK);
    const [selectedCalendar, setSelectedCalendar] = useState<string>("all");

    // --- Modal State Management ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    // initialData sẽ chứa thông tin Slot (khi tạo) HOẶC Event (khi sửa)
    const [modalData, setModalData] = useState<any>(null);

    // --- Hooks ---
    const { calendarList, isLoading: calendarsLoading } = useCalendarList();
    const { events: apiEvents, isLoading: eventsLoading } = useEvents({
        startTime: startOfMonth(date).toISOString(),
        endTime: endOfMonth(date).toISOString(),
        calendarId: selectedCalendar === "all" ? undefined : selectedCalendar
    });

    const createEvent = useCreateEvent();
    const updateEvent = useUpdateEvent();
    const deleteEvent = useDeleteEvent();

    // Mapping API Data
    const events = useMemo(() => {
        return apiEvents?.map((event: any) => ({
            id: event.id,
            title: event.title,
            start: new Date(event.start),
            end: new Date(event.end),
            allDay: typeof event.start === 'string' ? !event.start.includes('T') : true,
            bgColor: event.colorId || 'black',
            desc: event.description,
            calendarId: event.calendarId,
            source: 'api' as const
        })) || [];
    }, [apiEvents]);

    // --- Handlers ---

    // 1. Click vào ô trống trên lịch -> Tạo mới
    const handleSelectSlot = useCallback(({ start, end }: any) => {
        setModalData({ start, end }); // Chỉ có start/end, không có ID
        setIsModalOpen(true);
    }, []);

    // 2. Click vào Event có sẵn -> Sửa/Xóa
    const handleSelectEvent = useCallback((event: any) => {
        setModalData(event); // Có ID, title, desc...
        setIsModalOpen(true);
    }, []);

    // 3. Xử lý Tạo mới
    const handleCreate = useCallback((data: any) => {
        createEvent.mutate(data, {
            onSuccess: () => setIsModalOpen(false),
            onError: (err) => alert("Failed to create event")
        });
    }, [createEvent]);

    // 4. Xử lý Update
    const handleUpdate = useCallback((id: string, data: any) => {
        updateEvent.mutate({ id, updates: data }, {
            onSuccess: () => setIsModalOpen(false),
            onError: (err) => alert("Failed to update event")
        });
    }, [updateEvent]);

    // 5. Xử lý Delete
    const handleDelete = useCallback((id: string) => {
        deleteEvent.mutate(id, {
            onSuccess: () => setIsModalOpen(false),
            onError: (err) => alert("Failed to delete event")
        });
    }, [deleteEvent]);

    const isLoadingAction = createEvent.isPending || updateEvent.isPending || deleteEvent.isPending;

    const eventPropGetter = useCallback((event: any) => ({
        style: {
            backgroundColor: event.bgColor || '#3b82f6',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            fontSize: '0.85rem',
            fontWeight: '500',
            boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
        }
    }), []);

    return (
        <div className="flex flex-col items-center justify-center ">
            <Card className="w-full shadow-xl border-slate-200">
                <CardContent className="bg-white rounded-xl ">

                    <div className="my-custom-calendar h-[550px]">
                        <Calendar
                            localizer={localizer}
                            events={events}
                            defaultView={Views.WEEK}
                            view={view}
                            onView={setView}
                            date={date}
                            onNavigate={setDate}
                            scrollToTime={new Date(1970, 1, 1, 6)}
                            selectable
                            onSelectEvent={handleSelectEvent} // Click event -> Edit
                            onSelectSlot={handleSelectSlot}   // Click slot -> Create
                            components={{
                                toolbar: (props) => (
                                    <CustomToolbar {...props} selectedCalendar={selectedCalendar} onCalendarChange={setSelectedCalendar} calendarList={calendarList || []} />
                                )
                            }}
                            eventPropGetter={eventPropGetter}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Component Dialog dùng chung cho cả Create và Edit */}
            <EventDialog 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                initialData={modalData}
                calendars={calendarList || []}
                onCreate={handleCreate}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
                isLoading={isLoadingAction}
            />
        </div>
    );
};