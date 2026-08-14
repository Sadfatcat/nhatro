import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationPayload, NotificationProvider, NotificationTemplateKey } from './providers/notification-provider.interface';
import { EmailProvider } from './providers/email.provider';
import { SmsProvider } from './providers/sms.provider';

const INCLUDE_TENANT = {
  room:     { select: { roomNumber: true } },
  contract: { select: { tenant: { select: { email: true, phone: true } } } },
};

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly config:        ConfigService,
    private readonly prisma:        PrismaService,
    private readonly emailProvider: EmailProvider,
    private readonly smsProvider:   SmsProvider,
  ) {}

  async sendForInvoice(invoiceId: string, templateKey: NotificationTemplateKey): Promise<{ success: boolean; reason?: string }> {
    const invoice = await this.prisma.invoice.findUnique({ where: { id: invoiceId }, include: INCLUDE_TENANT });
    if (!invoice) {
      this.logger.warn(`Không tìm thấy hoá đơn ${invoiceId} để gửi thông báo "${templateKey}".`);
      return { success: false, reason: 'Không tìm thấy hoá đơn.' };
    }

    const { email, phone } = invoice.contract.tenant;
    if (!email && !phone) {
      this.logger.warn(`Người thuê phòng ${invoice.room.roomNumber} chưa có email lẫn số điện thoại — bỏ qua gửi "${templateKey}".`);
      return { success: false, reason: 'Người thuê chưa có email lẫn số điện thoại.' };
    }

    return this.send({
      to:   { email: email ?? undefined, phone: phone ?? undefined },
      templateKey,
      invoiceId,
      data: {
        roomNumber:        invoice.room.roomNumber,
        period:            invoice.period,
        rentAmount:        invoice.rentAmount.toLocaleString('vi-VN'),
        electricityAmount: invoice.electricityAmount.toLocaleString('vi-VN'),
        waterAmount:       invoice.waterAmount.toLocaleString('vi-VN'),
        otherFees:         invoice.otherFees.toLocaleString('vi-VN'),
        totalAmount:       invoice.totalAmount.toLocaleString('vi-VN'),
        dueDate:           invoice.dueDate.toLocaleDateString('vi-VN'),
        referenceCode:     invoice.referenceCode,
        prevElec:          invoice.prevElec,
        currElec:          invoice.currElec,
        elecUsed:          invoice.currElec - invoice.prevElec,
        elecUnitPrice:     invoice.elecUnitPrice.toLocaleString('vi-VN'),
        prevWater:         invoice.prevWater,
        currWater:         invoice.currWater,
        waterUsed:         invoice.currWater - invoice.prevWater,
        waterUnitPrice:    invoice.waterUnitPrice.toLocaleString('vi-VN'),
        bankName:          this.config.get<string>('LANDLORD_BANK_NAME') ?? '',
        bankAccountNumber: this.config.get<string>('LANDLORD_BANK_ACCOUNT_NUMBER') ?? '',
        bankAccountName:   this.config.get<string>('LANDLORD_BANK_ACCOUNT_NAME') ?? '',
        bank2Name:          this.config.get<string>('LANDLORD_BANK_2_NAME') ?? '',
        bank2AccountNumber: this.config.get<string>('LANDLORD_BANK_2_ACCOUNT_NUMBER') ?? '',
        bank2AccountName:   this.config.get<string>('LANDLORD_BANK_2_ACCOUNT_NAME') ?? '',
      },
    });
  }

  private resolveProvider(name: string | undefined): NotificationProvider | null {
    if (name === 'email') return this.emailProvider;
    if (name === 'sms') return this.smsProvider;
    return null;
  }

  private logAttempt(payload: NotificationPayload, channel: string, success: boolean, reason?: string): void {
    if (!payload.invoiceId) return;
    this.prisma.notificationLog.create({
      data: { invoiceId: payload.invoiceId, templateKey: payload.templateKey, channel, success, reason },
    }).catch(err => this.logger.error(`Không ghi được notification log: ${err instanceof Error ? err.message : err}`));
  }

  async send(payload: NotificationPayload): Promise<{ success: boolean; reason?: string }> {
    const primaryName  = this.config.get<string>('NOTIFICATION_PRIMARY_PROVIDER');
    const fallbackName = this.config.get<string>('NOTIFICATION_FALLBACK_PROVIDER');

    const primary = this.resolveProvider(primaryName);
    if (!primary) {
      const reason = `Không tìm thấy provider chính hợp lệ ("${primaryName}").`;
      this.logger.warn(`${reason} (template "${payload.templateKey}")`);
      this.logAttempt(payload, primaryName ?? 'unknown', false, reason);
      return { success: false, reason };
    }

    const primaryResult = await primary.send(payload).catch(err => ({
      success: false,
      error: err instanceof Error ? err.message : 'Lỗi không xác định.',
    }));

    if (primaryResult.success) {
      this.logger.log(`Gửi "${payload.templateKey}" thành công qua ${primaryName}.`);
      this.logAttempt(payload, primaryName!, true);
      return { success: true };
    }
    this.logger.warn(`Gửi "${payload.templateKey}" qua ${primaryName} thất bại: ${primaryResult.error}`);

    const fallback = this.resolveProvider(fallbackName);
    if (!fallback) {
      this.logAttempt(payload, primaryName!, false, primaryResult.error);
      return { success: false, reason: primaryResult.error };
    }

    const fallbackResult = await fallback.send(payload).catch(err => ({
      success: false,
      error: err instanceof Error ? err.message : 'Lỗi không xác định.',
    }));

    if (fallbackResult.success) {
      this.logger.log(`Gửi "${payload.templateKey}" thành công qua fallback ${fallbackName}.`);
      this.logAttempt(payload, fallbackName!, true);
      return { success: true };
    }
    this.logger.error(`Gửi "${payload.templateKey}" thất bại cả hai kênh (${primaryName}, ${fallbackName}).`);
    this.logAttempt(payload, fallbackName!, false, fallbackResult.error);
    return { success: false, reason: fallbackResult.error };
  }
}
