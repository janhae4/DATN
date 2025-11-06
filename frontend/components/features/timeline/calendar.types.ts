// timeline/calendar.types.ts

// 1. Định nghĩa kiểu dữ liệu cho Form
export interface EventFormData {
  id: string | null
  title: string
  description: string
  startDate: string // YYYY-MM-DD
  startTime: string // HH:mm
  endDate: string   // YYYY-MM-DD
  endTime: string   // HH:mm
  calendarId: string
}

// 2. Định nghĩa kiểu dữ liệu cho Calendar Config
export interface CalendarConfig {
  colorName: string
  light: {
    main: string
    container: string
    onContainer?: string
  }
  dark: {
    main: string
    container: string
    onContainer?: string
  }
}

// 3. Định nghĩa kiểu cho danh sách lịch
export type AvailableCalendars = Record<string, CalendarConfig>;

// 4. Chuyển config lịch ra khỏi file View
export const initialCalendars: AvailableCalendars = {
  personal: {
    colorName: 'personal',
    light: {
      main: 'lightgreen',
      container: 'lightgreen',
    },
    dark: {
      main: 'lightgreen',
      container: 'lightgreen',
    },
  },
  work: {
    colorName: 'work',
    light: {
      main: '#1cf9b0',
      container: '#dafff0',
    },
    dark: {
      main: '#FF0000',
      container: '#FF0000',
    },
  },
  leisure: {
    colorName: 'leisure',
    light: {
      main: '#1cf9b0',
      container: '#dafff0',
    },
    dark: {
      main: '#c0fff5',
      container: '#42a297',
    },
  },
  school: {
    colorName: 'school',
    light: {
      main: '#1c7df9',
      container: '#d2e7ff',
    },
    dark: {
      main: '#c0dfff',
      container: '#426aa2',
    },
  },
}