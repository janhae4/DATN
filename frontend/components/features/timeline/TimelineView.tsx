'use client'

import { useNextCalendarApp, ScheduleXCalendar } from '@schedule-x/react'
import {
  createViewDay,
  createViewMonthAgenda,
  createViewMonthGrid,
  createViewWeek,
} from '@schedule-x/calendar'
import '@schedule-x/theme-shadcn/dist/index.css'
import { createEventsServicePlugin } from '@schedule-x/events-service'
import 'temporal-polyfill/global'
import { useState } from 'react'
import { createDragAndDropPlugin } from '@schedule-x/drag-and-drop'
import { CreateEventModal } from './CreateEventModal'
import {
  EventFormData,
  initialCalendars,
} from './calendar.types'

function TimelineView() {
  const eventsService = useState(() => createEventsServicePlugin())[0]

  const [calendars, setCalendars] = useState(initialCalendars)
  const [timeZone] = useState(() => Temporal.Now.timeZoneId())
  const [formData, setFormData] = useState<EventFormData | null>(null)
  const defaultCalendarId = Object.keys(calendars)[0] || 'personal'


  const convertEventToFormData = (calendarEvent: any): EventFormData => {
    const startDateTime = calendarEvent.start
    const endDateTime = calendarEvent.end
    const calendarId = calendarEvent.calendarId && calendars[calendarEvent.calendarId]
      ? calendarEvent.calendarId
      : defaultCalendarId

    return {
      id: calendarEvent.id,
      title: calendarEvent.title,
      description: calendarEvent.description || '',
      startDate: startDateTime.toPlainDate().toString(),
      startTime: startDateTime.toPlainTime().toString({ smallestUnit: 'minute' }),
      endDate: endDateTime.toPlainDate().toString(),
      endTime: endDateTime.toPlainTime().toString({ smallestUnit: 'minute' }),
      calendarId: calendarId,
    }
  }

  const handleSubmit = (data: EventFormData) => {
    const startDateTime = Temporal.ZonedDateTime.from(
      `${data.startDate}T${data.startTime}[${timeZone}]`
    )
    const endDateTime = Temporal.ZonedDateTime.from(
      `${data.endDate}T${data.endTime}[${timeZone}]`
    )

    if (data.id) {
      // --- LOGIC UPDATE ---
      eventsService.update({
        id: data.id,
        title: data.title,
        description: data.description,
        start: startDateTime,
        end: endDateTime,
        calendarId: data.calendarId,
      })
    } else {
      // --- LOGIC CREATE ---
      const eventId = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      eventsService.add({
        id: eventId,
        title: data.title,
        description: data.description,
        start: startDateTime,
        end: endDateTime,
        calendarId: data.calendarId,
      })
    }
    setFormData(null) // Đóng modal
  }

  // Khi xóa sự kiện
  const handleDelete = (id: string) => {
    eventsService.remove(id)
    setFormData(null) // Đóng modal
  }

  // --- CẤU HÌNH CALENDAR ---
  const calendar = useNextCalendarApp({
    timezone: timeZone as any,
    calendars: calendars,
    views: [
      createViewDay(),
      createViewWeek(),
      createViewMonthGrid(),
      createViewMonthAgenda(),
    ],
    plugins: [
      eventsService,
      createDragAndDropPlugin(),
    ],
    callbacks: {
      onRender: () => {
        eventsService.getAll()
      },
      // Mở modal "Tạo mới" khi click vào ngày
      onClickDate: (date: Temporal.PlainDate) => {
        const dateString = date.toString()
        setFormData({
          id: null,
          title: '',
          description: '',
          startDate: dateString,
          startTime: '09:00',
          endDate: dateString,
          endTime: '10:00',
          calendarId: defaultCalendarId,
        })
      },
      // Mở modal "Tạo mới" khi click vào giờ
      onClickDateTime: (datetime: Temporal.ZonedDateTime) => {
        const endDatetime = datetime.add({ hours: 1 })
        setFormData({
          id: null,
          title: '',
          description: '',
          startDate: datetime.toPlainDate().toString(),
          startTime: datetime.toPlainTime().toString({ smallestUnit: 'minute' }),
          endDate: endDatetime.toPlainDate().toString(),
          endTime: endDatetime.toPlainTime().toString({ smallestUnit: 'minute' }),
          calendarId: defaultCalendarId,
        })
      },
      // Mở modal "Chỉnh sửa" khi click vào sự kiện
      onEventClick: (event: any, e: UIEvent) => {
        setFormData(convertEventToFormData(event))
      },
    },
  })

  return (
    <>
      <div className={`sx-react-calendar-wrapper sx-theme-shadcn`}>
        <ScheduleXCalendar calendarApp={calendar} />
      </div>

      <CreateEventModal
        open={formData !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) setFormData(null)
        }}
        value={formData}
        onChange={setFormData}
        availableCalendars={calendars}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
      />
    </>
  )
}

export default TimelineView