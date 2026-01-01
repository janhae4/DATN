"use client"

import React, { useState, useCallback, useMemo } from "react";
import { Calendar, View, dateFnsLocalizer, Views } from "react-big-calendar";
import { startOfMonth, endOfMonth, startOfWeek, getDay, format, parse } from "date-fns";
import { enUS } from "date-fns/locale";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CustomToolbar from "./CustomToolbar";
import EventDialog from "./EventDialog";
import { useCalendarList, useEvents, useCreateEvent, useUpdateEvent, useDeleteEvent } from '@/hooks/useCalendar';

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
    const [modalData, setModalData] = useState<any>(null);

    // --- Hooks ---
    const { calendarList } = useCalendarList();
    
    // Logic filter thời gian
    const { events: apiEvents, isLoading: eventsLoading } = useEvents({
        startTime: startOfMonth(date).toISOString(),
        endTime: endOfMonth(date).toISOString(),
        calendarId: selectedCalendar === "all" ? undefined : selectedCalendar
    });

    const createEvent = useCreateEvent();
    const updateEvent = useUpdateEvent();
    const deleteEvent = useDeleteEvent();

    // Mapping API Data sang format của React-Big-Calendar
    const events = useMemo(() => {
        return apiEvents?.map((event: any) => ({
            id: event.id,
            title: event.title || '(No Title)',
            start: new Date(event.start),
            end: new Date(event.end),
            allDay: typeof event.start === 'string' ? !event.start.includes('T') : true,
            bgColor: event.colorId || '#3b82f6', // Fallback màu xanh mặc định
            desc: event.description,
            calendarId: event.calendarId,
            source: 'api' as const
        })) || [];
    }, [apiEvents]);

    // --- Handlers ---

    const handleSelectSlot = useCallback(({ start, end }: any) => {
        setModalData({ start, end });
        setIsModalOpen(true);
    }, []);

    const handleSelectEvent = useCallback((event: any) => {
        setModalData(event);
        setIsModalOpen(true);
    }, []);

    const handleCreate = useCallback((data: any) => {
        createEvent.mutate(data, {
            onSuccess: () => {
                setIsModalOpen(false);
                // Có thể thêm toast.success("Event created!")
            },
            onError: () => alert("Failed to create event")
        });
    }, [createEvent]);

    const handleUpdate = useCallback((id: string, data: any) => {
        const payload = {
            ...data,
            calendarId: modalData?.calendarId 
        };

        updateEvent.mutate({ id, updates: payload }, {
            onSuccess: () => setIsModalOpen(false),
            onError: () => alert("Failed to update event")
        });
    }, [updateEvent, modalData]); 

    // --- ENHANCEMENT: Thêm Alert xác nhận xóa ---
    const handleDelete = useCallback((id: string) => {
        // 1. Hỏi xác nhận trước khi xóa
        if (!window.confirm("Are you sure you want to delete this event? This action cannot be undone.")) {
            return;
        }

        // 2. Thực hiện xóa
        deleteEvent.mutate({ 
            id, 
            calendarId: modalData?.calendarId 
        }, {
            onSuccess: () => {
                setIsModalOpen(false);
                // toast.success("Event deleted successfully");
            },
            onError: () => alert("Failed to delete event")
        });
    }, [deleteEvent, modalData]);

    const isLoadingAction = createEvent.isPending || updateEvent.isPending || deleteEvent.isPending;

    // --- ENHANCEMENT: Styling cho Event đẹp hơn ---
    const eventPropGetter = useCallback((event: any) => {
        const backgroundColor = event.bgColor;
        return {
            style: {
                backgroundColor: backgroundColor,
                borderLeft: `4px solid ${adjustColor(backgroundColor, -20)}`, // Tạo viền đậm bên trái
                color: '#fff',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: '600',
                border: 'none',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                padding: '2px 5px',
                opacity: 0.95
            }
        };
    }, []);

    return (
        <div className="flex flex-col h-full w-full gap-4 relative">

            {/* Loading Overlay khi fetch data hoặc đang submit */}
            {(eventsLoading || isLoadingAction) && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/50 backdrop-blur-sm rounded-xl">
                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                </div>
            )}

            <Card className="w-full pt-0! max-h-[600px] shadow-lg border-slate-200 overflow-hidden">
                <CardContent className="bg-white p-0">
                    <div className="px-4 pb-4 h-[600px] w-full">
                        <Calendar
                            localizer={localizer}
                            events={events}
                            defaultView={Views.WEEK}
                            view={view}
                            onView={setView}
                            date={date}
                            onNavigate={setDate}
                            scrollToTime={new Date(1970, 1, 1, 6)} // Scroll tới 6h sáng
                            selectable
                            popup // Hiển thị "Show more" khi quá nhiều event
                            onSelectEvent={handleSelectEvent}
                            onSelectSlot={handleSelectSlot}
                            components={{
                                toolbar: (props) => (
                                    <CustomToolbar 
                                        {...props} 
                                        selectedCalendar={selectedCalendar} 
                                        onCalendarChange={setSelectedCalendar} 
                                        calendarList={calendarList || []} 
                                    />
                                )
                            }}
                            eventPropGetter={eventPropGetter}
                            dayPropGetter={(date) => ({
                                style: {
                                    backgroundColor: date.getDay() === 0 || date.getDay() === 6 ? '#f8fafc' : undefined // Highlight cuối tuần
                                }
                            })}
                        />
                    </div>
                </CardContent>
            </Card>

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

// Helper để làm tối màu (cho border)
function adjustColor(color: string, amount: number) {
    return '#' + color.replace(/^#/, '').replace(/../g, color => ('0' + Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).substr(-2));
}