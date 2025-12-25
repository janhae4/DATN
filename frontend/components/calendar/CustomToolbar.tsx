import { Button } from "../ui/button";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


export default function CustomToolbar({ date, onNavigate, view, onView, selectedCalendar, onCalendarChange, calendarList }: any) {
  return (
    <div className="flex text-primary flex-col md:flex-row items-center justify-between mb-6 mt-6 gap-4">
      <div className="flex items-center gap-3 w-full md:w-auto">
        <div className="flex items-center rounded-lg border bg-background shadow-sm p-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 hover:bg-muted"
            onClick={() => onNavigate('PREV')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-3 hover:bg-muted"
            onClick={() => onNavigate('TODAY')}
          >
            Today
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 hover:bg-muted"
            onClick={() => onNavigate('NEXT')}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <h2 className="text-xl font-bold  capitalize tracking-tight min-w-[150px]">
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
