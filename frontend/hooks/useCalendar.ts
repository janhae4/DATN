// hooks/useCalendar.ts

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarItem, CalendarEvent, CreateEventDto, UpdateEventDto, GetEventDto, calendarService } from "../services/calendarService";



const CALENDAR_QUERY_KEY = "calendars";
const EVENTS_QUERY_KEY = "events";

// Hook lấy danh sách các cuốn lịch (Dropdown Select)
export function useCalendarList() {
  const {
    data: calendarList = [],
    isLoading,
    error,
  } = useQuery<CalendarItem[]>({
    queryKey: [CALENDAR_QUERY_KEY, "list"],
    queryFn: () => calendarService.listCalendars(),
  });

  return {
    calendarList,
    isLoading,
    error: error as Error | null,
  };
}

// Hook lấy danh sách sự kiện (Dùng cho giao diện lịch)
export function useEvents(filter: GetEventDto) {
  const queryKey = [EVENTS_QUERY_KEY, filter]; 
  
  const {
    data: events = [],
    isLoading,
    error,
  } = useQuery<CalendarEvent[]>({
    queryKey,
    queryFn: () => calendarService.listEvents(filter),
    enabled: !!filter, 
  });

  return {
    events,
    isLoading,
    error: error as Error | null,
    queryKey
  };
}

// Hook lấy chi tiết 1 sự kiện
export function useEvent(eventId: string | null) {
  const {
    data: event,
    isLoading,
    error,
  } = useQuery<CalendarEvent>({
    queryKey: [EVENTS_QUERY_KEY, eventId],
    queryFn: () => calendarService.getEvent(eventId!),
    enabled: !!eventId,
  });

  return {
    event,
    isLoading,
    error: error as Error | null,
  };
}

// Hook tạo sự kiện
export function useCreateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateEventDto) => calendarService.createEvent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [EVENTS_QUERY_KEY] }); 
    },
  });
}

// Hook cập nhật sự kiện
export function useUpdateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateEventDto }) =>
      calendarService.updateEvent(id, updates),
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: [EVENTS_QUERY_KEY, id] });
      const previousEvent = queryClient.getQueryData<CalendarEvent>([EVENTS_QUERY_KEY, id]);

      queryClient.setQueryData<CalendarEvent>([EVENTS_QUERY_KEY, id], (old) => {
        if (!old) return old;
        return { ...old, ...updates } as CalendarEvent;
      });

      return { previousEvent };
    },
    onError: (err, newEvent, context) => {
      if (context?.previousEvent) {
        queryClient.setQueryData([EVENTS_QUERY_KEY, newEvent.id], context.previousEvent);
      }
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: [EVENTS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [EVENTS_QUERY_KEY, variables.id] });
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    // SỬA Ở ĐÂY: Nhận object { id, calendarId }
    mutationFn: ({ id, calendarId }: { id: string; calendarId?: string }) =>
      calendarService.deleteEvent(id, calendarId),
      
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      // Thêm thông báo nếu thích
    },
    onError: (err) => {
        console.error("Delete failed:", err);
    }
  });
}