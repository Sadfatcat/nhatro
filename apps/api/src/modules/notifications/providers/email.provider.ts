import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { NotificationPayload, NotificationProvider, NotificationSendResult } from './notification-provider.interface';
import { invoiceCreatedTemplate } from '../templates/invoice-created.template';
import { invoiceDueSoonTemplate } from '../templates/invoice-due-soon.template';
import { invoiceOverdueTemplate } from '../templates/invoice-overdue.template';
import { invoicePaidTemplate } from '../templates/invoice-paid.template';

const TEMPLATE_BUILDERS = {
  'invoice-created':  invoiceCreatedTemplate,
  'invoice-due-soon': invoiceDueSoonTemplate,
  'invoice-overdue':  invoiceOverdueTemplate,
  'invoice-paid':     invoicePaidTemplate,
};

@Injectable()
export class EmailProvider implements NotificationProvider {
  private readonly logger = new Logger(EmailProvider.name);

  constructor(private readonly config: ConfigService) {}

  async send(payload: NotificationPayload): Promise<NotificationSendResult> {
    if (!payload.to.email) {
      return { success: false, error: 'Người nhận chưa có email.' };
    }

    const apiKey = this.config.get<string>('EMAIL_API_KEY');
    if (!apiKey) {
      this.logger.warn('EMAIL_API_KEY chưa được cấu hình — không gửi được email thật.');
      return { success: false, error: 'EMAIL_API_KEY chưa được cấu hình.' };
    }

    const from = this.config.get<string>('EMAIL_FROM') ?? 'noreply@yourdomain.com';
    const { subject, html } = TEMPLATE_BUILDERS[payload.templateKey](payload.data);

    try {
      const resend = new Resend(apiKey);
      const result = await resend.emails.send({ from, to: payload.to.email, subject, html });
      if (result.error) {
        return { success: false, error: result.error.message };
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Lỗi không xác định.' };
    }
  }
}
