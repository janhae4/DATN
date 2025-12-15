"use client"
import React, { useState, useCallback, useMemo } from 'react';
import { Calendar, dateFnsLocalizer, Views, type View } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { format, parse, startOfWeek, getDay, startOfMonth, endOfMonth } from 'date-fns';
import { enUS } from 'date-fns/locale';

// Shadcn UI & Icons
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Loader2, Calendar as CalendarIcon } from "lucide-react";
import ChatbotWidget from '@/components/chatbot/ChatbotWidget';

// Calendar Hooks
import { useCalendarList, useEvents, useCreateEvent, useUpdateEvent, useDeleteEvent } from '@/hooks/useCalendar';

// --- 1. SETUP LOCALIZER ---
const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

// --- 2. TYPES ---
interface MyEvent {
  id?: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  bgColor?: string;
  desc?: string;
  source?: 'api';
}

// --- 4. CUSTOM TOOLBAR COMPONENT ---
const CustomToolbar = ({ date, onNavigate, view, onView, selectedCalendar, onCalendarChange, calendarList }: any) => {
  return (
    <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
      <div className="flex items-center gap-3 w-full md:w-auto">
        <div className="flex items-center rounded-lg border bg-background shadow-sm p-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onNavigate('PREV')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 px-3 font-medium" onClick={() => onNavigate('TODAY')}>
            Today
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onNavigate('NEXT')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <h2 className="text-xl font-bold text-foreground capitalize tracking-tight min-w-[150px]">
          {format(date, 'MMMM yyyy')}
        </h2>
      </div>

      <div className="flex items-center gap-3">
        <Select value={view} onValueChange={onView}>
          <SelectTrigger className="w-[140px] bg-background shadow-sm">
            <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
            <SelectValue placeholder="Select view" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="month">Month</SelectItem>
            <SelectItem value="week">Week</SelectItem>
            <SelectItem value="day">Day</SelectItem>
            <SelectItem value="agenda">Agenda</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={selectedCalendar} onValueChange={onCalendarChange}>
          <SelectTrigger className="w-[200px] bg-background shadow-sm">
            <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
            <SelectValue placeholder="Select calendar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Calendars</SelectItem>
            {calendarList.map((calendar: any) => (
              <SelectItem key={calendar.id} value={calendar.id}>
                {calendar.summary}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

// --- 5. MAIN LOGIC COMPONENT ---
const CalendarContent = () => {
  const [date, setDate] = useState(new Date());
  const [view, setView] = useState<View>(Views.WEEK);
  const [selectedCalendar, setSelectedCalendar] = useState<string>("all");
  
  // Calendar hooks
  const { calendarList, isLoading: calendarsLoading } = useCalendarList();

  const { events: apiEvents, isLoading: eventsLoading } = useEvents({
    startTime: startOfMonth(date).toISOString(),
    endTime: endOfMonth(date).toISOString(),
    calendarId: selectedCalendar === "all" ? undefined : selectedCalendar
  });
    
    console.log("gg events",apiEvents);

  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();
  
  // Convert API events to calendar format
  const events = useMemo(() => {
    const googleEvents = apiEvents.map((event: any) => ({
      id: event.id,
      title: event.title,
      start: new Date(event.start),
      end: new Date(event.end),
      allDay: !event.start.includes('T'),
      bgColor: event.colorId || '#3b82f6',
      desc: event.description,
      source: 'api' as const
    }));
    
    return googleEvents;
  }, [apiEvents]);

  // --- Event & Slot Handlers ---
  const handleSelectEvent = useCallback((event: MyEvent) => {
    alert(` ${event.title}\n ${event.desc || 'Không có mô tả'}`);
  }, []);

  const handleSelectSlot = useCallback(({ start, end }: any) => {
    const title = window.prompt('Tạo sự kiện mới:');
    if (title) {
      createEvent.mutate({
        summary: title,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        calendarId: selectedCalendar === "all" ? undefined : selectedCalendar
      });
    }
  }, [createEvent, selectedCalendar]);

  const eventPropGetter = useCallback((event: MyEvent) => {
    return {
      style: {
        backgroundColor: event.bgColor || '#3b82f6',
        color: '#fff',
        border: 'none',
        borderRadius: '6px',
        fontSize: '0.8rem',
        fontWeight: '500'
      }
    };
  }, []);

  return (
    <div className=" bg-slate-50/50 min-h-screen flex flex-col items-center justify-center">
      <Card className="w-full max-w-7xl shadow-xl border-slate-200">

        <CardContent className=" bg-white rounded-b-xl">
          <div className="flex flex-row items-center justify-between pb-4 bg-white rounded-t-xl">

            <div>
              <ChatbotWidget/>

              <p className="text-slate-500 text-sm">Task Management & Google Calendar</p>
            </div>

            <Button
              disabled={eventsLoading || calendarsLoading}
              variant="outline"
              className="gap-2 border-slate-300"
            >
              {(eventsLoading || calendarsLoading) ? <Loader2 className="h-4 w-4 animate-spin" /> : <span className="text-blue-600 font-bold">G</span>}
              {(eventsLoading || calendarsLoading) ? 'Đang tải...' : 'Calendar'}
            </Button>
          </div>
          <div className="my-custom-calendar h-[600px]">
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
              onSelectEvent={handleSelectEvent}
              onSelectSlot={handleSelectSlot}

              components={{ toolbar: (props) => (
                <CustomToolbar 
                  {...props} 
                  selectedCalendar={selectedCalendar}
                  onCalendarChange={setSelectedCalendar}
                  calendarList={calendarList}
                />
              ) }}
              eventPropGetter={eventPropGetter}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default function CalendarPage() {
  return <CalendarContent />;
}