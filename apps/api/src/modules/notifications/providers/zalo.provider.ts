import { Injectable, Logger } from '@nestjs/common';
import { NotificationPayload, NotificationProvider, NotificationSendResult } from './notification-provider.interface';

/**
 * Chưa implement — chờ Đạt đăng ký Zalo OA + submit template ZNS được duyệt.
 * Xem TEMP-notification-plan-pending.md mục E bước 8 trước khi code thật:
 * đọc tài liệu Zalo hiện hành, không copy mẫu cũ, lưu refresh token ở DB không hardcode .env.
 */
@Injectable()
export class ZaloProvider implements NotificationProvider {
  private readonly logger = new Logger(ZaloProvider.name);

  async send(_payload: NotificationPayload): Promise<NotificationSendResult> {
    this.logger.warn('Zalo provider chưa được implement — chờ OA thật + template ZNS đã duyệt.');
    return { success: false, error: 'Zalo provider chưa được implement.' };
  }
}
