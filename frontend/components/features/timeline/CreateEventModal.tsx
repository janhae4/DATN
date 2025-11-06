// CreateEventModal.tsx
'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { format, parseISO } from 'date-fns' // Thêm parseISO
import { CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
// 1. Import types từ file mới
import { EventFormData, AvailableCalendars } from './calendar.types'

// 2. Props đã được đơn giản hóa
interface CreateEventModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  
  availableCalendars: AvailableCalendars 
  
  value: EventFormData | null // Nhận toàn bộ form data
  onChange: (data: EventFormData) => void // Hàm callback để cập nhật data
  
  onSubmit: (data: EventFormData) => void
  onDelete: (id: string) => void
}

// --- Component DatePicker (tách nhỏ ra cho gọn) ---
interface DatePickerProps {
  value?: Date
  onChange: (date?: Date) => void
  disabled?: any
}

function DatePicker({ value, onChange, disabled }: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "justify-start text-left font-normal",
            !value && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          <span>{value ? format(value, "PPP") : "Pick a date"}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={onChange}
          disabled={disabled}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  )
}
// --------------------------------------------------


export function CreateEventModal({
  open,
  onOpenChange,
  availableCalendars,
  value, // Nhận giá trị
  onChange, // Nhận hàm onChange
  onSubmit,
  onDelete,
}: CreateEventModalProps) {
  
  // 3. XÓA tất cả state (useState) và useEffect
  // Component này giờ được kiểm soát hoàn toàn bởi parent

  const isEditing = !!value?.id;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value) return; // Không có data thì không submit

    // Kiểm tra logic thời gian (có thể giữ lại)
    const startDateTime = new Date(`${value.startDate}T${value.startTime}`);
    const endDateTime = new Date(`${value.endDate}T${value.endTime}`);
  
    if (endDateTime < startDateTime) {
      alert("End date/time cannot be before start date/time.");
      return;
    }
    
    onSubmit(value); // Gửi data về parent
  };

  const handleDeleteConfirm = () => {
    if (!isEditing || !value?.id) return
    onDelete(value.id); // Gửi ID về parent
  }

  // 4. Helper để cập nhật state ở parent
  const handleChange = (field: keyof EventFormData, fieldValue: string) => {
    if (!value) return;
    onChange({ ...value, [field]: fieldValue });
  }

  // Nếu không có data (modal đang đóng), không render gì cả
  if (!value) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Event' : 'Create New Event'}</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            {/* Title */}
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={value.title} // 5. Dùng value.title
                onChange={(e) => handleChange('title', e.target.value)} // 6. Dùng hàm handleChange
                required
              />
            </div>

            {/* Description */}
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={value.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Optional event details..."
              />
            </div>

            {/* Start Date & Start Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Start Date</Label>
                {/* 7. Dùng component DatePicker */}
                <DatePicker 
                  value={value.startDate ? parseISO(value.startDate) : undefined}
                  onChange={(date) => {
                    if (!value) return;
                    const newDate = date ? format(date, 'yyyy-MM-dd') : '';
                    onChange({
                      ...value,
                      startDate: newDate,
                      // Tự động cập nhật endDate nếu nó trống
                      endDate: value.endDate || newDate
                    })
                  }}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="start-time">Start Time</Label>
                <Input
                  id="start-time"
                  type="time"
                  value={value.startTime}
                  onChange={(e) => handleChange('startTime', e.target.value)}
                  required
                />
              </div>
            </div>

            {/* End Date & End Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>End Date</Label>
                <DatePicker 
                  value={value.endDate ? parseISO(value.endDate) : undefined}
                  onChange={(date) => {
                    if (!value) return;
                    handleChange('endDate', date ? format(date, 'yyyy-MM-dd') : '')
                  }}
                  disabled={{ before: value.startDate ? parseISO(value.startDate) : new Date(0) }}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="end-time">End Time</Label>
                <Input
                  id="end-time"
                  type="time"
                  value={value.endTime}
                  onChange={(e) => handleChange('endTime', e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Calendar Select */}
            <div className="grid gap-2">
              <Label>Calendar</Label>
              <Select 
                value={value.calendarId} 
                onValueChange={(id) => handleChange('calendarId', id)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a calendar" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(availableCalendars).map(([id, calendar]) => (
                    <SelectItem key={id} value={id}>
                      <div className="flex items-center gap-2">
                        <span 
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: calendar.light.main }}
                        />
                        <span>{calendar.colorName}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* DialogFooter (với AlertDialog) */}
          <DialogFooter className="sm:justify-end">
            {isEditing && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    variant="outline" // Sửa lại: Nút Xóa nên màu đỏ
                  >
                    Delete 
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete this event.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteConfirm}>
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            <Button type="submit" className={isEditing ? "" : "ml-auto"}>
              {isEditing ? 'Save Changes' : 'Create Event'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}