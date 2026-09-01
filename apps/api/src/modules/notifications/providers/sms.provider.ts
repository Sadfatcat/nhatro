import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NotificationPayload, NotificationProvider, NotificationSendResult } from './notification-provider.interface';
import { invoiceCreatedSmsTemplate } from '../templates/invoice-created.template';
import { invoiceDueSoonSmsTemplate } from '../templates/invoice-due-soon.template';
import { invoiceOverdueSmsTemplate } from '../templates/invoice-overdue.template';
import { invoicePaidSmsTemplate } from '../templates/invoice-paid.template';
import { invoiceMergedSmsTemplate } from '../templates/invoice-merged.template';
import { invoiceMergedPaidSmsTemplate } from '../templates/invoice-merged-paid.template';

const TEMPLATE_BUILDERS = {
  'invoice-created':      invoiceCreatedSmsTemplate,
  'invoice-due-soon':     invoiceDueSoonSmsTemplate,
  'invoice-overdue':      invoiceOverdueSmsTemplate,
  'invoice-paid':         invoicePaidSmsTemplate,
  'invoice-merged':       invoiceMergedSmsTemplate,
  'invoice-merged-paid':  invoiceMergedPaidSmsTemplate,
};

@Injectable()
export class SmsProvider implements NotificationProvider {
  private readonly logger = new Logger(SmsProvider.name);

  constructor(private readonly config: ConfigService) {}

  async send(payload: NotificationPayload): Promise<NotificationSendResult> {
    if (!payload.to.phone) {
      return { success: false, error: 'Người nhận chưa có số điện thoại.' };
    }

    const url = this.config.get<string>('SMS_GATEWAY_URL');
    const user = this.config.get<string>('SMS_GATEWAY_USER');
    const password = this.config.get<string>('SMS_GATEWAY_PASSWORD');
    if (!url || !user || !password) {
      this.logger.warn('SMS_GATEWAY_URL/USER/PASSWORD chưa được cấu hình — không gửi được SMS thật.');
      return { success: false, error: 'SMS_GATEWAY_URL/USER/PASSWORD chưa được cấu hình.' };
    }

    const text  = TEMPLATE_BUILDERS[payload.templateKey](payload.data);
    const phone = this.toE164(payload.to.phone);

    try {
      const res = await fetch(url, {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          Authorization:   `Basic ${Buffer.from(`${user}:${password}`).toString('base64')}`,
        },
        body: JSON.stringify({ textMessage: { text }, phoneNumbers: [phone] }),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        return { success: false, error: `SMS gateway trả lỗi ${res.status}${body ? `: ${body}` : ''}.` };
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Lỗi không xác định.' };
    }
  }

  /** SMS gateway (cloud API) requires E.164 — local DB stores Vietnamese numbers as 0xxxxxxxxx. */
  private toE164(phone: string): string {
    if (phone.startsWith('+')) return phone;
    if (phone.startsWith('0')) return `+84${phone.slice(1)}`;
    return phone;
  }
}
