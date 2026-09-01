import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/auth/roles.decorator';
import { NotificationsService } from './notifications.service';
import { SendNotificationDto } from './dto/send-notification.dto';
import { SendBulkNotificationDto } from './dto/send-bulk-notification.dto';

interface ApiResponse<T> { success: boolean; data: T | null; message: string; }
const ok = <T>(data: T, msg = 'Thành công'): ApiResponse<T> => ({ success: true, data, message: msg });

@Roles('ADMIN', 'LANDLORD')
@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Post('send')
  async send(@Body() dto: SendNotificationDto): Promise<ApiResponse<{ success: boolean; reason?: string; channel?: string }>> {
    const result = await this.notifications.sendForInvoice(dto.invoiceId, 'invoice-created');
    return ok(result, result.success ? 'Đã gửi thông báo.' : (result.reason ?? 'Gửi thông báo thất bại.'));
  }

  @Post('send-bulk')
  async sendBulk(
    @Body() dto: SendBulkNotificationDto,
  ): Promise<ApiResponse<{ sent: number; failed: { invoiceId: string; reason: string }[] }>> {
    const failed: { invoiceId: string; reason: string }[] = [];
    let sent = 0;

    for (const invoiceId of dto.invoiceIds) {
      const result = await this.notifications.sendForInvoice(invoiceId, 'invoice-created');
      if (result.success) {
        sent++;
      } else {
        failed.push({ invoiceId, reason: result.reason ?? 'Không rõ nguyên nhân.' });
      }
    }

    return ok({ sent, failed }, `Đã gửi ${sent}/${dto.invoiceIds.length} thông báo.`);
  }
}
