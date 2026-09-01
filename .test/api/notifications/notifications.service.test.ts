import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { NotificationsService } from '../../../apps/api/src/modules/notifications/notifications.service';
import { PrismaService } from '../../../apps/api/src/prisma/prisma.service';
import { EmailProvider } from '../../../apps/api/src/modules/notifications/providers/email.provider';
import { SmsProvider } from '../../../apps/api/src/modules/notifications/providers/sms.provider';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prisma: { invoice: { findUnique: jest.Mock }; notificationLog: { create: jest.Mock } };
  let email: { send: jest.Mock };
  let sms:   { send: jest.Mock };
  let config: Record<string, string | undefined>;

  const baseInvoice = {
    id: 'inv-1', period: '2026-08', rentAmount: 2000000, electricityAmount: 175000,
    waterAmount: 150000, otherFees: 50000, totalAmount: 2375000, dueDate: new Date('2026-08-20'),
    referenceCode: 'NT-101-082026', prevElec: 100, currElec: 150, elecUnitPrice: 3500,
    prevWater: 10, currWater: 15, waterUnitPrice: 30000,
    room: { roomNumber: '101' },
    contract: { tenant: { email: 'tenant@example.com', phone: '0900000000' } },
  };

  beforeEach(async () => {
    prisma = { invoice: { findUnique: jest.fn() }, notificationLog: { create: jest.fn().mockResolvedValue({}) } };
    email  = { send: jest.fn() };
    sms    = { send: jest.fn() };
    // Real project config: SMS is primary, email is the fallback (SMS is cheaper).
    config = { NOTIFICATION_PRIMARY_PROVIDER: 'sms', NOTIFICATION_FALLBACK_PROVIDER: 'email' };

    const module = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: prisma },
        { provide: EmailProvider, useValue: email },
        { provide: SmsProvider,   useValue: sms },
        { provide: ConfigService, useValue: { get: (k: string) => config[k] } },
      ],
    }).compile();
    service = module.get(NotificationsService);
  });

  describe('sendForInvoice', () => {
    it('fails cleanly (not a throw) when the invoice does not exist', async () => {
      prisma.invoice.findUnique.mockResolvedValue(null);
      const result = await service.sendForInvoice('ghost', 'invoice-created');
      expect(result).toEqual({ success: false, reason: 'Không tìm thấy hoá đơn.' });
    });

    it('fails cleanly with no exception when the tenant has neither email nor phone', async () => {
      prisma.invoice.findUnique.mockResolvedValue({ ...baseInvoice, contract: { tenant: { email: null, phone: null } } });
      const result = await service.sendForInvoice('inv-1', 'invoice-created');
      expect(result).toEqual({ success: false, reason: 'Không có dữ liệu người dùng.' });
      expect(sms.send).not.toHaveBeenCalled();
      expect(email.send).not.toHaveBeenCalled();
    });

    it('still attempts to send when only phone is present (no email on file)', async () => {
      prisma.invoice.findUnique.mockResolvedValue({ ...baseInvoice, contract: { tenant: { email: null, phone: '0900000000' } } });
      sms.send.mockResolvedValue({ success: true });

      const result = await service.sendForInvoice('inv-1', 'invoice-created');
      expect(result).toEqual({ success: true });
      expect(sms.send).toHaveBeenCalled();
    });

    it('computes elecUsed/waterUsed correctly from the invoice snapshot for the template', async () => {
      prisma.invoice.findUnique.mockResolvedValue(baseInvoice);
      sms.send.mockResolvedValue({ success: true });

      await service.sendForInvoice('inv-1', 'invoice-created');

      const [[payload]] = sms.send.mock.calls;
      expect(payload.data.elecUsed).toBe(50);
      expect(payload.data.waterUsed).toBe(5);
      expect(payload.to).toEqual({ email: 'tenant@example.com', phone: '0900000000' });
    });

    it('forceChannel="sms" bypasses the primary/fallback chain entirely (manual SMS-only trigger)', async () => {
      prisma.invoice.findUnique.mockResolvedValue(baseInvoice);
      sms.send.mockResolvedValue({ success: true });

      await service.sendForInvoice('inv-1', 'invoice-created', 'sms');

      expect(sms.send).toHaveBeenCalled();
      expect(email.send).not.toHaveBeenCalled();
    });
  });

  describe('send — SMS-first fallback chain', () => {
    it('fails clearly when the configured primary provider name is invalid', async () => {
      config.NOTIFICATION_PRIMARY_PROVIDER = 'carrier-pigeon';
      const result = await service.send({ to: { phone: '0900000000' }, templateKey: 'invoice-created', data: {} });
      expect(result.success).toBe(false);
      expect(sms.send).not.toHaveBeenCalled();
      expect(email.send).not.toHaveBeenCalled();
    });

    it('succeeds via SMS (primary) without ever touching the email fallback', async () => {
      sms.send.mockResolvedValue({ success: true });
      const result = await service.send({ to: { phone: '0900000000' }, templateKey: 'invoice-created', data: {} });
      expect(result).toEqual({ success: true });
      expect(email.send).not.toHaveBeenCalled();
    });

    it('falls back to email when SMS (primary) fails', async () => {
      sms.send.mockResolvedValue({ success: false, error: 'SMS gateway down' });
      email.send.mockResolvedValue({ success: true });

      const result = await service.send({ to: { email: 'x@x.com', phone: '0900000000' }, templateKey: 'invoice-created', data: {} });
      expect(result).toEqual({ success: true });
      expect(email.send).toHaveBeenCalled();
    });

    it('when BOTH sms and email fail, returns { success: false, reason } — does not throw', async () => {
      sms.send.mockResolvedValue({ success: false, error: 'SMS gateway down' });
      email.send.mockResolvedValue({ success: false, error: 'SMTP down' });

      const result = await service.send({ to: { email: 'x@x.com', phone: '0900000000' }, templateKey: 'invoice-created', data: {} });
      expect(result).toEqual({ success: false, reason: 'SMTP down' });
    });

    it('does not crash the whole flow when a provider throws instead of rejecting cleanly', async () => {
      sms.send.mockRejectedValue(new Error('network unreachable'));
      email.send.mockResolvedValue({ success: false, error: 'SMTP down' });
      const result = await service.send({ to: { email: 'x@x.com', phone: '0900000000' }, templateKey: 'invoice-created', data: {} });
      expect(result.success).toBe(false);
      expect(result.reason).toBe('SMTP down');
    });

    it('returns the primary (SMS) error, unmodified, when no fallback is configured and primary fails', async () => {
      config.NOTIFICATION_FALLBACK_PROVIDER = '';
      sms.send.mockResolvedValue({ success: false, error: 'SMS gateway down' });
      const result = await service.send({ to: { phone: '0900000000' }, templateKey: 'invoice-created', data: {} });
      expect(result).toEqual({ success: false, reason: 'SMS gateway down' });
      expect(email.send).not.toHaveBeenCalled();
    });
  });
});
