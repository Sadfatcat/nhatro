import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationsService } from './notifications.service';

@Injectable()
export class NotificationsListener {
  private readonly logger = new Logger(NotificationsListener.name);

  constructor(private readonly notifications: NotificationsService) {}

  @OnEvent('invoice.overdue')
  async onInvoiceOverdue(payload: { invoiceId: string }): Promise<void> {
    await this.notify(payload.invoiceId, 'invoice-overdue');
  }

  @OnEvent('invoice.paid')
  async onInvoicePaid(payload: { invoiceId: string }): Promise<void> {
    await this.notify(payload.invoiceId, 'invoice-paid');
  }

  private async notify(invoiceId: string, templateKey: 'invoice-overdue' | 'invoice-paid'): Promise<void> {
    try {
      await this.notifications.sendForInvoice(invoiceId, templateKey);
    } catch (err) {
      this.logger.error(`Gửi thông báo "${templateKey}" cho hoá đơn ${invoiceId} lỗi: ${err instanceof Error ? err.message : err}`);
    }
  }
}
