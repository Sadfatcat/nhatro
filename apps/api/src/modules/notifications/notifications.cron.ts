import { Injectable, Logger } from '@nestjs/common';
import { InvoicesService } from '../invoices/invoices.service';
import { NotificationsService } from './notifications.service';

const DUE_SOON_DAYS_AHEAD = 3;

@Injectable()
export class NotificationsCron {
  private readonly logger = new Logger(NotificationsCron.name);

  constructor(
    private readonly invoices:      InvoicesService,
    private readonly notifications: NotificationsService,
  ) {}

  // Auto due-soon reminder cron disabled (landlord sends manually now) — kept as a plain
  // method, not @Cron, so a future manual "gửi nhắc sắp đến hạn" button can reuse it.
  async checkDueSoon(): Promise<void> {
    const dueSoon = await this.invoices.findDueSoon(DUE_SOON_DAYS_AHEAD);
    for (const invoice of dueSoon) {
      await this.notifications.sendForInvoice(invoice.id, 'invoice-due-soon');
    }
    if (dueSoon.length > 0) {
      this.logger.log(`Đã gửi nhắc hạn cho ${dueSoon.length} hoá đơn sắp đến hạn.`);
    }
  }
}
