"use client"
import React, { useState, useCallback } from 'react';
import { Calendar, dateFnsLocalizer, Views, type View } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import axios from 'axios';

// Google OAuth
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';

// Shadcn UI & Icons
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Loader2, Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { redirect } from 'next/dist/server/api-utils';

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
  source?: 'google' | 'local';
}

// --- 3. MOCK DATA (Data cũ của ní) ---
const mockEvents: MyEvent[] = [
  { title: "All Day Event very long title", bgColor: "#ff7f50", allDay: true, start: new Date(2015, 3, 0), end: new Date(2015, 3, 1) },
  { title: "Long Event", start: new Date(2015, 3, 7), end: new Date(2015, 3, 10) },
  { title: "DTS STARTS", bgColor: "#dc143c", start: new Date(2016, 2, 13, 0, 0, 0), end: new Date(2016, 2, 20, 0, 0, 0) },
  { title: "Conference", bgColor: "#e9967a", start: new Date(2015, 3, 11), end: new Date(2015, 3, 13), desc: "Big conference" },
  { title: "Meeting", bgColor: "#8fbc8f", start: new Date(2015, 3, 12, 10, 30, 0, 0), end: new Date(2015, 3, 12, 12, 30, 0, 0), desc: "Pre-meeting" },
  { title: "Lunch", bgColor: "#cd5c5c", start: new Date(2015, 3, 12, 12, 0, 0, 0), end: new Date(2015, 3, 12, 13, 0, 0, 0), desc: "Power lunch" },
  { title: "Happy Hour", bgColor: "#2e8b57", start: new Date(2015, 3, 12, 12, 0, 0, 0), end: new Date(2015, 3, 12, 13, 0, 0, 0), desc: "Happy hour" },
  { title: "Birthday Party", bgColor: "#afeeee", start: new Date(2015, 3, 13, 7, 0, 0), end: new Date(2015, 3, 13, 10, 30, 0) }
];

// --- 4. CUSTOM TOOLBAR COMPONENT ---
const CustomToolbar = ({ date, onNavigate, view, onView }: any) => {
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
    </div>
  );
};

// --- 5. MAIN LOGIC COMPONENT ---
const CalendarContent = () => {
  const [events, setEvents] = useState<MyEvent[]>(mockEvents);
  const [date, setDate] = useState(new Date(2015, 3, 12)); // Default date theo data mẫu
  const [view, setView] = useState<View>(Views.WEEK);
  const [isLoading, setIsLoading] = useState(false);

  // --- Logic Sync Google ---
  const fetchGoogleEvents = async (accessToken: string) => {
    setIsLoading(true);
    try {
      const response = await axios.get('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: {
          timeMin: new Date(new Date().getFullYear(), 0, 1).toISOString(),
          singleEvents: true,
          orderBy: 'startTime',
        }
      });

      const googleEvents = response.data.items.map((item: any) => ({
        id: item.id,
        title: item.summary || '(No Title)',
        start: new Date(item.start.dateTime || item.start.date),
        end: new Date(item.end.dateTime || item.end.date),
        allDay: !item.start.dateTime,
        bgColor: '#ea4335', // Màu đỏ đặc trưng Google
        desc: item.description,
        source: 'google'
      }));

      setEvents(prev => [...prev, ...googleEvents]);
      // Chuyển lịch về ngày hôm nay để user thấy sự kiện Google vừa sync
      setDate(new Date());
      alert(`Đã lấy về ${googleEvents.length} sự kiện từ Google!`);

    } catch (error) {
      console.error(error);
      alert("Lỗi Sync rồi ní ơi. Check console xem sao.");
    } finally {
      setIsLoading(false);
    }
  };
  React.useEffect(() => {
    // 1. Lấy cái chuỗi query trên URL (?code=...)
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');

    // 2. Nếu có 'code', nghĩa là vừa đi từ Google về
    if (code) {
      console.log("Detect được code từ Google, bắt đầu xử lý...");

      // Bật loading lên cho user biết đang làm việc
      setIsLoading(true);

      // 3. Gửi cái code này xuống Backend của mom để đổi lấy Token
      // LƯU Ý:Mom phải thay cái đường dẫn API bên dưới bằng API thật của mom
      axios.post('http://localhost:3000/auth/google/callback', { code })
        .then(response => {
          const accessToken = response.data.accessToken;

          if (accessToken) {
            fetchGoogleEvents(accessToken);

            window.history.replaceState({}, document.title, window.location.pathname);

            alert("Sync thành công rồi nhen!");
          }
        })
        .catch(err => {
          console.error("Lỗi đổi code lấy token:", err);
          alert("Lỗi khi xử lý login Google.");
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, []);

  const login = useGoogleLogin({
    onSuccess: (res) => fetchGoogleEvents(res.access_token),
    scope: 'https://www.googleapis.com/auth/calendar.readonly',
    onError: () => alert('Login Google thất bại')
  });

  // --- Event & Slot Handlers ---
  const handleSelectEvent = useCallback((event: MyEvent) => {
    alert(`📌 ${event.title}\n📝 ${event.desc || 'Không có mô tả'}`);
  }, []);

  const handleSelectSlot = useCallback(({ start, end }: any) => {
    const title = window.prompt('Tạo sự kiện nhanh (Demo):');
    if (title) {
      setEvents(prev => [...prev, { title, start, end, source: 'local', bgColor: '#3b82f6' }]);
    }
  }, []);

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

              <p className="text-slate-500 text-sm">Task Management & Google Calendar</p>
            </div>

            <Button
              onClick={() => window.location.href = 'http://localhost:3000/auth/google'}
              disabled={isLoading}
              variant="outline"
              className="gap-2 border-slate-300"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <span className="text-blue-600 font-bold">G</span>}
              {isLoading ? 'Đang tải...' : 'Sync Google Calendar'}
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

              components={{ toolbar: CustomToolbar }}
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