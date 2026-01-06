import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationUpdateDto, Role } from '@app/contracts';
import { RoleGuard } from '../common/role/role.guard';
import { CurrentUser } from '../common/role/current-user.decorator';
import { Roles } from '../common/role/role.decorator';

@Controller('notifications')
@UseGuards(RoleGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  /**
   * Endpoint để lấy tất cả notification của user hiện tại.
   * GET /notifications
   */
  @Get()
  @Roles(Role.USER, Role.ADMIN)
  findAll(@CurrentUser('id') userId: string) {
    return this.notificationService.getNotifications(userId);
  }

  /**
   * Endpoint để đánh dấu TẤT CẢ notification của user là đã đọc.
   * POST /notifications/read-all
   */
  @Post('read-all')
  markAllAsRead(@CurrentUser('id') userId: string) {
    this.notificationService.markAllAsRead(userId);
    return { message: 'All notifications marked as read.' };
  }

  /**
   * Endpoint để đánh dấu một notification cụ thể là đã đọc.
   * PATCH /notifications/:id/read
   */
  @Patch(':id/read')
  markAsRead(@Param('id') id: string) {
    this.notificationService.markAsRead(id);
    return { message: `Notification ${id} marked as read.` };
  }

  /**
   * Endpoint để đánh dấu một notification cụ thể là CHƯA đọc.
   * PATCH /notifications/:id/unread
   */
  @Patch(':id/unread')
  markAsUnread(@Param('id') id: string) {
    this.notificationService.markAsUnread(id);
    return { message: `Notification ${id} marked as unread.` };
  }

  /**
   * Endpoint để cập nhật nội dung một notification.
   * PATCH /notifications/:id
   */
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: NotificationUpdateDto) {
    return this.notificationService.updateNotification(id, updateDto);
  }

  /**
   * Endpoint để xóa một notification.
   * DELETE /notifications/:id
   */
  @Delete(':id')
  remove(@Param('id') id: string) {
    this.notificationService.deleteNotification(id);
    return { message: `Notification ${id} has been deleted.` };
  }

  // Lưu ý: Endpoint để TẠO notification thường không public trực tiếp.
  // Nó sẽ được gọi nội bộ bởi các service khác (ví dụ: service Order tạo noti khi có đơn hàng mới).
  // Nếu bạn vẫn muốn tạo một endpoint public, nó sẽ trông như thế này:
  /*
  @Post()
  create(@Body() createDto: NotificationEventDto) {
      this.notificationService.createNotification(createDto);
      return { message: 'Notification creation event sent.' };
  }
  */
}
