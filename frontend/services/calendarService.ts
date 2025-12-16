// services/calendarService.ts

import apiClient from "./apiClient";

// --- DTOs (Lấy từ các file calendar/dto/*.ts của mom) ---

// calendar/dto/create-event.dto.ts
export interface CreateEventDto {
  summary: string;
  description?: string;
  startTime: string; // ISO Date String
  endTime: string;   // ISO Date String
  calendarId?: string; // ID của lịch muốn tạo
}

// calendar/dto/update-event.dto.ts (Dùng Partial của Create)
export interface UpdateEventDto extends Partial<CreateEventDto> {}


// calendar/dto/get-event.dto.ts (Filter)
export interface GetEventDto {
  startTime?: string;
  endTime?: string;
  calendarId?: string;
}

// --- Frontend Types (Dựa trên format Google Calendar API trả về) ---

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: string; 
  end: string;   
  link: string; 
  calendarId?: string; 
  colorId?: string;
  status: 'confirmed' | 'cancelled';
}

export interface CalendarItem {
  id: string; 
  summary: string; 
  description?: string;
  backgroundColor?: string;
  primary: boolean;
}

// --- Service Implementation ---

export const calendarService = {
  /**
   * Lấy danh sách các cuốn lịch của user
   * GET /calendar/list
   */
  listCalendars: async (): Promise<CalendarItem[]> => {
    const response = await apiClient.get<CalendarItem[]>(`/calendar/list`);
    return response.data;
  },
  
  /**
   * Lấy danh sách sự kiện có filter
   * GET /calendar?startTime=...&calendarId=...
   */
  listEvents: async (filter: GetEventDto): Promise<CalendarEvent[]> => {
    // Filter out undefined values before creating URL params
    const filteredFilter = Object.fromEntries(
      Object.entries(filter).filter(([_, value]) => value !== undefined)
    );
    const params = new URLSearchParams(filteredFilter as Record<string, string>).toString();
    console.log(params)
    const response = await apiClient.get<CalendarEvent[]>(`/calendar?${params}`);
    return response.data;
  },

  /**
   * Lấy chi tiết 1 sự kiện
   * GET /calendar/{id}
   */
  getEvent: async (eventId: string): Promise<CalendarEvent> => {
    const response = await apiClient.get<CalendarEvent>(`/calendar/${eventId}`);
    return response.data;
  },

  /**
   * Tạo sự kiện mới
   * POST /calendar
   */
  createEvent: async (data: CreateEventDto): Promise<CalendarEvent> => {
    const response = await apiClient.post<CalendarEvent>('/calendar', data);
    return response.data;
  },

  /**
   * Cập nhật sự kiện
   * PUT /calendar/{id}
   */
  updateEvent: async (eventId: string, updates: UpdateEventDto): Promise<CalendarEvent> => {
    const response = await apiClient.put<CalendarEvent>(`/calendar/${eventId}`, updates);
    return response.data;
  },

  /**
   * Xóa sự kiện
   * DELETE /calendar/{id}
   */
  deleteEvent: async (eventId: string): Promise<void> => {
    await apiClient.delete(`/calendar/${eventId}`);
  },

  
};