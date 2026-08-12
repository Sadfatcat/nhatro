import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { NotificationsService } from '../../../apps/api/src/modules/notifications/notifications.service';
import { PrismaService } from '../../../apps/api/src/prisma/prisma.service';
import { EmailProvider } from '../../../apps/api/src/modules/notifications/providers/email.provider';
import { ZaloProvider } from '../../../apps/api/src/modules/notifications/providers/zalo.provider';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prisma: { invoice: { findUnique: jest.Mock } };
  let email:  { send: jest.Mock };
  let zalo:   { send: jest.Mock };
  let config: Record<string, string | undefined>;

  const baseInvoice = {
    id: 'inv-1', period: '2026-08', rentAmount: 2000000, electricityAmount: 175000,
    waterAmount: 150000, otherFees: 50000, totalAmount: 2375000, dueDate: new Date('2026-08-20'),
    referenceCode: 'NT-101-082026', prevElec: 100, currElec: 150, elecUnitPrice: 3500,
    prevWater: 10, currWater: 15, waterUnitPrice: 30000,
    room: { roomNumber: '101' },
    contract: { tenant: { email: 'tenant@example.com' } },
  };

  beforeEach(async () => {
    prisma = { invoice: { findUnique: jest.fn() } };
    email  = { send: jest.fn() };
    zalo   = { send: jest.fn() };
    config = { NOTIFICATION_PRIMARY_PROVIDER: 'email', NOTIFICATION_FALLBACK_PROVIDER: '' };

    const module = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: prisma },
        { provide: EmailProvider, useValue: email },
        { provide: ZaloProvider, useValue: zalo },
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

    it('fails cleanly when the tenant has no email on file — does not call the provider at all', async () => {
      prisma.invoice.findUnique.mockResolvedValue({ ...baseInvoice, contract: { tenant: { email: null } } });
      const result = await service.sendForInvoice('inv-1', 'invoice-created');
      expect(result).toEqual({ success: false, reason: 'Người thuê chưa có email.' });
      expect(email.send).not.toHaveBeenCalled();
    });

    it('computes elecUsed/waterUsed correctly from the invoice snapshot for the email template', async () => {
      prisma.invoice.findUnique.mockResolvedValue(baseInvoice);
      email.send.mockResolvedValue({ success: true });

      await service.sendForInvoice('inv-1', 'invoice-created');

      const [[payload]] = email.send.mock.calls;
      expect(payload.data.elecUsed).toBe(50);
      expect(payload.data.waterUsed).toBe(5);
      expect(payload.to).toEqual({ email: 'tenant@example.com' });
    });
  });

  describe('send — provider fallback chain', () => {
    it('fails clearly when the configured primary provider name is invalid', async () => {
      config.NOTIFICATION_PRIMARY_PROVIDER = 'sms-carrier-pigeon';
      const result = await service.send({ to: { email: 'x@x.com' }, templateKey: 'invoice-created', data: {} });
      expect(result.success).toBe(false);
      expect(email.send).not.toHaveBeenCalled();
    });

    it('succeeds via the primary provider without ever touching the fallback', async () => {
      email.send.mockResolvedValue({ success: true });
      const result = await service.send({ to: { email: 'x@x.com' }, templateKey: 'invoice-created', data: {} });
      expect(result).toEqual({ success: true });
      expect(zalo.send).not.toHaveBeenCalled();
    });

    it('falls back to the secondary provider when the primary fails', async () => {
      config.NOTIFICATION_FALLBACK_PROVIDER = 'zalo';
      email.send.mockResolvedValue({ success: false, error: 'SMTP down' });
      zalo.send.mockResolvedValue({ success: true });

      const result = await service.send({ to: { email: 'x@x.com' }, templateKey: 'invoice-created', data: {} });
      expect(result).toEqual({ success: true });
      expect(zalo.send).toHaveBeenCalled();
    });

    it('reports the PRIMARY error when both primary and fallback fail', async () => {
      config.NOTIFICATION_FALLBACK_PROVIDER = 'zalo';
      email.send.mockResolvedValue({ success: false, error: 'SMTP down' });
      zalo.send.mockResolvedValue({ success: false, error: 'Zalo API error' });

      const result = await service.send({ to: { email: 'x@x.com' }, templateKey: 'invoice-created', data: {} });
      expect(result).toEqual({ success: false, reason: 'Zalo API error' });
    });

    it('does not crash the whole flow when a provider throws instead of rejecting cleanly', async () => {
      email.send.mockRejectedValue(new Error('network unreachable'));
      const result = await service.send({ to: { email: 'x@x.com' }, templateKey: 'invoice-created', data: {} });
      expect(result.success).toBe(false);
      expect(result.reason).toBe('network unreachable');
    });

    it('returns the primary error (not a crash) when no fallback is configured and primary fails', async () => {
      config.NOTIFICATION_FALLBACK_PROVIDER = '';
      email.send.mockResolvedValue({ success: false, error: 'SMTP down' });
      const result = await service.send({ to: { email: 'x@x.com' }, templateKey: 'invoice-created', data: {} });
      expect(result).toEqual({ success: false, reason: 'SMTP down' });
    });
  });
});
