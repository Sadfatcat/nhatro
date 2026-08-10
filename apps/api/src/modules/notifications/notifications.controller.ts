import { BadRequestException, Body, Controller, Headers, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { SendNotificationDto } from './dto/send-notification.dto';
import { SendBulkNotificationDto } from './dto/send-bulk-notification.dto';

interface ApiResponse<T> { success: boolean; data: T | null; message: string; }
const ok = <T>(data: T, msg = 'Thành công'): ApiResponse<T> => ({ success: true, data, message: msg });

function roleFromToken(auth?: string): string | null {
  if (!auth?.startsWith('Bearer ')) return null;
  const m = auth.slice(7).match(/^db-token-(\w+)-\d+$/);
  return m ? m[1].toUpperCase() : null;
}

function requireManagement(auth: string | undefined): void {
  const role = roleFromToken(auth);
  if (!role || role === 'TENANT' || role === 'GUEST') {
    throw new BadRequestException('Bạn không có quyền thực hiện thao tác này.');
  }
}

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Post('send')
  async send(
    @Body() dto: SendNotificationDto,
    @Headers('authorization') auth: string,
  ): Promise<ApiResponse<{ success: boolean; reason?: string }>> {
    requireManagement(auth);
    const result = await this.notifications.sendForInvoice(dto.invoiceId, 'invoice-created');
    return ok(result, result.success ? 'Đã gửi thông báo.' : (result.reason ?? 'Gửi thông báo thất bại.'));
  }

  @Post('send-bulk')
  async sendBulk(
    @Body() dto: SendBulkNotificationDto,
    @Headers('authorization') auth: string,
  ): Promise<ApiResponse<{ sent: number; failed: { invoiceId: string; reason: string }[] }>> {
    requireManagement(auth);

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
