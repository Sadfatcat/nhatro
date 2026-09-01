import { Test } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import { Prisma, InvoiceStatus } from '@prisma/client';
import { InvoicesService } from '../../../apps/api/src/modules/invoices/invoices.service';
import { PrismaService } from '../../../apps/api/src/prisma/prisma.service';
import { RoomsService } from '../../../apps/api/src/modules/rooms/rooms.service';
import { ContractsService } from '../../../apps/api/src/modules/contracts/contracts.service';
import { UtilitiesService } from '../../../apps/api/src/modules/utilities/utilities.service';

const occupiedRoom = (roomId: string, roomNumber: string, price = 2000000) =>
  ({ roomId, roomNumber, floor: 1, price, status: 'OCCUPIED' });

const utilityFor = (billingMonth: string, prevElec: number, currElec: number, prevWater: number, currWater: number) => ({
  utilityRecord: { billingMonth, prevElec, currElec, prevWater, currWater },
});

function duplicateKeyError() {
  return new Prisma.PrismaClientKnownRequestError('Unique constraint failed', { code: 'P2002', clientVersion: '6.0.0' });
}

describe('InvoicesService', () => {
  let service: InvoicesService;
  let prisma: {
    invoice: { findMany: jest.Mock; findFirst: jest.Mock; findUnique: jest.Mock; create: jest.Mock; update: jest.Mock; updateMany: jest.Mock; delete: jest.Mock; count: jest.Mock };
    invoiceEditLog: { create: jest.Mock };
    user: { findUnique: jest.Mock };
  };
  let rooms:     { findAll: jest.Mock };
  let contracts: { findByRoom: jest.Mock };
  let utilities: { findByRoom: jest.Mock };
  let events:    { emit: jest.Mock };

  beforeEach(async () => {
    prisma = {
      invoice: {
        findMany: jest.fn(), findFirst: jest.fn(), findUnique: jest.fn(),
        create: jest.fn(), update: jest.fn(), updateMany: jest.fn(), delete: jest.fn(), count: jest.fn(),
      },
      invoiceEditLog: { create: jest.fn() },
      user: { findUnique: jest.fn().mockResolvedValue({ fullName: 'Người dùng test' }) },
    };
    rooms     = { findAll: jest.fn() };
    contracts = { findByRoom: jest.fn() };
    utilities = { findByRoom: jest.fn() };
    events    = { emit: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        InvoicesService,
        { provide: PrismaService,    useValue: prisma },
        { provide: RoomsService,     useValue: rooms },
        { provide: ContractsService, useValue: contracts },
        { provide: UtilitiesService, useValue: utilities },
        { provide: EventEmitter2,    useValue: events },
        { provide: ConfigService,    useValue: { get: () => null } },
      ],
    }).compile();
    service = module.get(InvoicesService);
  });

  describe('generate — pricing formula (regression: 3500đ/kWh, 30000đ/m³, +50000đ rác)', () => {
    it('computes exact amounts from meter usage', async () => {
      rooms.findAll.mockResolvedValue([occupiedRoom('r1', '101', 2000000)]);
      contracts.findByRoom.mockResolvedValue({ id: 'contract-1' });
      utilities.findByRoom.mockResolvedValue(utilityFor('2026-08', 100, 150, 10, 15));
      prisma.invoice.create.mockImplementation(({ data }: any) => Promise.resolve(data));

      const { created, skipped } = await service.generate({ period: '2026-08' } as any);

      expect(skipped).toHaveLength(0);
      const invoice = created[0] as any;
      expect(invoice.electricityAmount).toBe(50 * 3500);   // 175000
      expect(invoice.waterAmount).toBe(5 * 30000);          // 150000
      expect(invoice.totalAmount).toBe(2000000 + 175000 + 150000 + 50000);
    });

    it('clamps negative usage to zero instead of a negative bill (meter reset / bad prev value)', async () => {
      rooms.findAll.mockResolvedValue([occupiedRoom('r1', '101', 2000000)]);
      contracts.findByRoom.mockResolvedValue({ id: 'contract-1' });
      utilities.findByRoom.mockResolvedValue(utilityFor('2026-08', 500, 100, 50, 10)); // curr < prev
      prisma.invoice.create.mockImplementation(({ data }: any) => Promise.resolve(data));

      const { created } = await service.generate({ period: '2026-08' } as any);
      expect((created[0] as any).electricityAmount).toBe(0);
      expect((created[0] as any).waterAmount).toBe(0);
    });
  });

  describe('generate — skip reasons', () => {
    it('skips a room with no active contract, with the right reason', async () => {
      rooms.findAll.mockResolvedValue([occupiedRoom('r1', '101')]);
      contracts.findByRoom.mockResolvedValue(null);

      const { created, skipped } = await service.generate({ period: '2026-08' } as any);
      expect(created).toHaveLength(0);
      expect(skipped[0]).toMatchObject({ roomId: 'r1', reason: 'Không có hợp đồng đang hiệu lực.' });
    });

    it('skips a room that has not closed its meter reading for this period', async () => {
      rooms.findAll.mockResolvedValue([occupiedRoom('r1', '101')]);
      contracts.findByRoom.mockResolvedValue({ id: 'contract-1' });
      utilities.findByRoom.mockResolvedValue({ utilityRecord: null });

      const { skipped } = await service.generate({ period: '2026-08' } as any);
      expect(skipped[0].reason).toBe('Chưa chốt số điện nước cho kỳ này.');
    });

    it('skips (not throws) when the invoice for this room+period already exists (duplicate referenceCode)', async () => {
      rooms.findAll.mockResolvedValue([occupiedRoom('r1', '101')]);
      contracts.findByRoom.mockResolvedValue({ id: 'contract-1' });
      utilities.findByRoom.mockResolvedValue(utilityFor('2026-08', 0, 10, 0, 5));
      prisma.invoice.create.mockRejectedValue(duplicateKeyError());

      const { created, skipped } = await service.generate({ period: '2026-08' } as any);
      expect(created).toHaveLength(0);
      expect(skipped[0].reason).toBe('Hoá đơn kỳ này đã tồn tại.');
    });

    it('only considers rooms that are OCCUPIED, ignoring AVAILABLE/MAINTENANCE', async () => {
      rooms.findAll.mockResolvedValue([
        occupiedRoom('r1', '101'),
        { roomId: 'r2', roomNumber: '102', floor: 1, price: 1000000, status: 'AVAILABLE' },
      ]);
      contracts.findByRoom.mockResolvedValue(null); // r1 will be skipped for lack of contract, r2 never even checked

      await service.generate({ period: '2026-08' } as any);
      expect(contracts.findByRoom).toHaveBeenCalledTimes(1);
      expect(contracts.findByRoom).toHaveBeenCalledWith('r1');
    });

    it('restricts to the given roomIds when provided', async () => {
      rooms.findAll.mockResolvedValue([occupiedRoom('r1', '101'), occupiedRoom('r2', '102')]);
      contracts.findByRoom.mockResolvedValue(null);

      await service.generate({ period: '2026-08', roomIds: ['r2'] } as any);
      expect(contracts.findByRoom).toHaveBeenCalledTimes(1);
      expect(contracts.findByRoom).toHaveBeenCalledWith('r2');
    });

    it('throws BadRequestException only when there is truly nothing to do (no occupied rooms at all)', async () => {
      rooms.findAll.mockResolvedValue([]);
      await expect(service.generate({ period: '2026-08' } as any)).rejects.toThrow(BadRequestException);
    });
  });

  describe('buildReferenceCode — collision risk between differently-formatted room numbers', () => {
    it('strips non-alphanumeric characters, so room "A-1" and "A1" produce the SAME reference code', async () => {
      rooms.findAll.mockResolvedValue([occupiedRoom('r1', 'A-1')]);
      contracts.findByRoom.mockResolvedValue({ id: 'c1' });
      utilities.findByRoom.mockResolvedValue(utilityFor('2026-08', 0, 0, 0, 0));
      prisma.invoice.create.mockImplementation(({ data }: any) => Promise.resolve(data));

      const { created } = await service.generate({ period: '2026-08' } as any);
      // documents the real collision risk flagged during code review — not a fix, just a guard
      // so this doesn't silently regress into something worse.
      expect((created[0] as any).referenceCode).toBe('NT-A1-082026');
    });
  });

  describe('syncInvoiceForPeriod', () => {
    it('does NOT create an invoice for a room that has none yet this period (auto-create removed)', async () => {
      prisma.invoice.findFirst.mockResolvedValue(null);

      await service.syncInvoiceForPeriod('r1', '2026-08');
      expect(prisma.invoice.create).not.toHaveBeenCalled();
      expect(prisma.invoice.update).not.toHaveBeenCalled();
    });

    it('throws and does NOT touch the row when the existing invoice is already PAID', async () => {
      prisma.invoice.findFirst.mockResolvedValue({ id: 'inv-1', status: InvoiceStatus.PAID });
      await expect(service.syncInvoiceForPeriod('r1', '2026-08')).rejects.toThrow(BadRequestException);
      expect(prisma.invoice.update).not.toHaveBeenCalled();
    });

    it('recalculates a non-PAID invoice from the latest meter reading', async () => {
      prisma.invoice.findFirst.mockResolvedValue({
        id: 'inv-1', status: InvoiceStatus.SENT, rentAmount: 2000000, garbageFee: 50000, otherFees: 0, deduction: 0,
      });
      utilities.findByRoom.mockResolvedValue(utilityFor('2026-08', 0, 20, 0, 3));

      await service.syncInvoiceForPeriod('r1', '2026-08');

      expect(prisma.invoice.update).toHaveBeenCalledWith({
        where: { id: 'inv-1' },
        data: expect.objectContaining({
          electricityAmount: 20 * 3500,
          waterAmount:       3 * 30000,
          totalAmount:        2000000 + 20 * 3500 + 3 * 30000 + 50000,
        }),
      });
    });

    it('preserves manually-edited garbageFee/otherFees/deduction — only meter-derived fields change', async () => {
      prisma.invoice.findFirst.mockResolvedValue({
        id: 'inv-1', status: InvoiceStatus.SENT, rentAmount: 2000000, garbageFee: 70000, otherFees: 20000, deduction: 100000,
      });
      utilities.findByRoom.mockResolvedValue(utilityFor('2026-08', 0, 20, 0, 3));

      await service.syncInvoiceForPeriod('r1', '2026-08');

      expect(prisma.invoice.update).toHaveBeenCalledWith({
        where: { id: 'inv-1' },
        data: {
          prevElec: 0, currElec: 20, prevWater: 0, currWater: 3,
          electricityAmount: 20 * 3500,
          waterAmount:       3 * 30000,
          totalAmount:        2000000 + 20 * 3500 + 3 * 30000 + 70000 + 20000 - 100000,
          elecUnitPrice:  3500,
          waterUnitPrice: 30000,
        },
      });
    });

    it('does nothing when the utility record does not actually match this period (edge case guard)', async () => {
      prisma.invoice.findFirst.mockResolvedValue({ id: 'inv-1', status: InvoiceStatus.SENT, rentAmount: 1, garbageFee: 0, otherFees: 0, deduction: 0 });
      utilities.findByRoom.mockResolvedValue({ utilityRecord: null });

      await service.syncInvoiceForPeriod('r1', '2026-08');
      expect(prisma.invoice.update).not.toHaveBeenCalled();
    });
  });

  describe('markPaid', () => {
    it('throws NotFoundException for a missing invoice', async () => {
      prisma.invoice.findUnique.mockResolvedValue(null);
      await expect(service.markPaid('ghost', 'u1')).rejects.toThrow(NotFoundException);
    });

    it('refuses to re-mark an already-PAID invoice', async () => {
      prisma.invoice.findUnique.mockResolvedValue({ id: '1', status: InvoiceStatus.PAID });
      await expect(service.markPaid('1', 'u1')).rejects.toThrow(BadRequestException);
    });

    it('marks paid and emits invoice.paid', async () => {
      prisma.invoice.findUnique.mockResolvedValue({ id: '1', status: InvoiceStatus.SENT });
      prisma.invoice.update.mockResolvedValue({ id: '1', status: InvoiceStatus.PAID });
      await service.markPaid('1', 'u1');
      expect(events.emit).toHaveBeenCalledWith('invoice.paid', { invoiceId: '1' });
    });

    it('resolves markedBy from the JWT userId (server-side), never from client input', async () => {
      prisma.invoice.findUnique.mockResolvedValue({ id: '1', status: InvoiceStatus.SENT });
      prisma.invoice.update.mockResolvedValue({ id: '1', status: InvoiceStatus.PAID });
      prisma.user.findUnique.mockResolvedValue({ fullName: 'Chủ trọ A' });

      await service.markPaid('1', 'u1');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: 'u1' }, select: { fullName: true } });
      expect(prisma.invoice.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ markedBy: 'Chủ trọ A' }),
      }));
    });
  });

  describe('bulkMarkPaid', () => {
    it('only updates invoices that are not already PAID, and emits one event per updated invoice', async () => {
      prisma.invoice.findMany.mockResolvedValue([{ id: '1' }, { id: '2' }]); // already excludes PAID via the where clause
      prisma.invoice.updateMany.mockResolvedValue({ count: 2 });

      const result = await service.bulkMarkPaid({ ids: ['1', '2', '3-already-paid'] } as any, 'u1');

      expect(prisma.invoice.findMany).toHaveBeenCalledWith({
        where:  { id: { in: ['1', '2', '3-already-paid'] }, status: { not: InvoiceStatus.PAID } },
        select: { id: true },
      });
      expect(result.updated).toBe(2);
      expect(events.emit).toHaveBeenCalledTimes(2);
    });

    it('resolves markedBy from the JWT userId, not from the request body', async () => {
      prisma.invoice.findMany.mockResolvedValue([{ id: '1' }]);
      prisma.invoice.updateMany.mockResolvedValue({ count: 1 });
      prisma.user.findUnique.mockResolvedValue({ fullName: 'Quản lý B' });

      await service.bulkMarkPaid({ ids: ['1'] } as any, 'u2');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: 'u2' }, select: { fullName: true } });
      expect(prisma.invoice.updateMany).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ markedBy: 'Quản lý B' }),
      }));
    });
  });

  describe('update — PATCH /invoices/:id', () => {
    const baseInvoice = {
      id: '1', status: InvoiceStatus.SENT, rentAmount: 2000000, electricityAmount: 175000,
      waterAmount: 150000, garbageFee: 50000, otherFees: 0, deduction: 0, dueDate: new Date('2026-08-20'),
    };

    it('throws NotFoundException for a missing invoice', async () => {
      prisma.invoice.findUnique.mockResolvedValue(null);
      await expect(service.update('ghost', {} as any, 'u1')).rejects.toThrow(NotFoundException);
    });

    it('refuses to edit an already-PAID invoice', async () => {
      prisma.invoice.findUnique.mockResolvedValue({ ...baseInvoice, status: InvoiceStatus.PAID });
      await expect(service.update('1', { rentAmount: 1 } as any, 'u1')).rejects.toThrow(BadRequestException);
      expect(prisma.invoice.update).not.toHaveBeenCalled();
    });

    it('recomputes totalAmount from the 4 real fields — a client-supplied totalAmount is not part of the DTO and is ignored', async () => {
      prisma.invoice.findUnique.mockResolvedValue(baseInvoice);
      prisma.invoice.update.mockResolvedValue({ ...baseInvoice });

      // simulate a malicious/stale client trying to smuggle totalAmount through the body
      await service.update('1', { rentAmount: 3000000, totalAmount: 999 } as any, 'u1');

      expect(prisma.invoice.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: expect.objectContaining({
          rentAmount:  3000000,
          totalAmount: 3000000 + 175000 + 150000 + 50000, // NOT 999
        }),
      });
    });

    it('recomputes totalAmount with garbageFee and deduction included', async () => {
      prisma.invoice.findUnique.mockResolvedValue(baseInvoice);
      prisma.invoice.update.mockResolvedValue({ ...baseInvoice });

      await service.update('1', { garbageFee: 70000, deduction: 100000 } as any, 'u1');

      expect(prisma.invoice.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: expect.objectContaining({
          garbageFee:  70000,
          deduction:   100000,
          totalAmount: 2000000 + 175000 + 150000 + 70000 + 0 - 100000,
        }),
      });
    });

    it('resolves editedBy from the JWT userId (server-side), never trusts a client-supplied name', async () => {
      prisma.invoice.findUnique.mockResolvedValue(baseInvoice);
      prisma.invoice.update.mockResolvedValue({ ...baseInvoice });
      prisma.user.findUnique.mockResolvedValue({ fullName: 'Chủ trọ thật' });

      await service.update('1', { rentAmount: 2500000, editedBy: 'Hacker' } as any, 'u1');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: 'u1' }, select: { fullName: true } });
      expect(prisma.invoiceEditLog.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ editedBy: 'Chủ trọ thật' }),
      }));
    });

    it('does not write an edit log when nothing actually changed', async () => {
      prisma.invoice.findUnique.mockResolvedValue(baseInvoice);
      prisma.invoice.update.mockResolvedValue({ ...baseInvoice });

      await service.update('1', {} as any, 'u1');

      expect(prisma.invoiceEditLog.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll — pagination', () => {
    it('without a page param, returns a plain array (backward-compatible with old callers)', async () => {
      prisma.invoice.findMany.mockResolvedValue([{ id: '1' }, { id: '2' }]);

      const result = await service.findAll({});

      expect(Array.isArray(result)).toBe(true);
      expect(prisma.invoice.count).not.toHaveBeenCalled();
    });

    it('with a page param, returns { items, total } and defaults pageSize to 10', async () => {
      prisma.invoice.findMany.mockResolvedValue([{ id: '1' }]);
      prisma.invoice.count.mockResolvedValue(23);

      const result = await service.findAll({ page: 2 });

      expect(prisma.invoice.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 10, take: 10 }));
      expect(result).toEqual({ items: [{ id: '1' }], total: 23 });
    });

    it('honors an explicit pageSize', async () => {
      prisma.invoice.findMany.mockResolvedValue([]);
      prisma.invoice.count.mockResolvedValue(0);

      await service.findAll({ page: 3, pageSize: 5 });

      expect(prisma.invoice.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 10, take: 5 }));
    });
  });

  describe('findAll — notified filter combined with period/roomIds', () => {
    it('notified=true + period + roomIds all apply together (relation "some")', async () => {
      prisma.invoice.findMany.mockResolvedValue([]);

      await service.findAll({ period: '2026-08', roomIds: ['r1', 'r2'], notified: true });

      expect(prisma.invoice.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
          period: '2026-08',
          roomId: { in: ['r1', 'r2'] },
          notificationLogs: { some: {} },
        }),
      }));
    });

    it('notified=false uses relation "none", still combined with period', async () => {
      prisma.invoice.findMany.mockResolvedValue([]);

      await service.findAll({ period: '2026-08', notified: false });

      expect(prisma.invoice.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ period: '2026-08', notificationLogs: { none: {} } }),
      }));
    });

    it('notified omitted → no notificationLogs filter at all', async () => {
      prisma.invoice.findMany.mockResolvedValue([]);

      await service.findAll({ period: '2026-08' });

      expect(prisma.invoice.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ notificationLogs: undefined }),
      }));
    });
  });

  describe('generate — bulk generate skip/create split', () => {
    it('a room whose invoice already exists (PAID or not) lands in skipped with a reason, not duplicated', async () => {
      rooms.findAll.mockResolvedValue([occupiedRoom('r1', '101'), occupiedRoom('r2', '102')]);
      contracts.findByRoom.mockResolvedValue({ id: 'c1' });
      utilities.findByRoom.mockResolvedValue(utilityFor('2026-08', 0, 10, 0, 5));
      prisma.invoice.create
        .mockRejectedValueOnce(duplicateKeyError())
        .mockImplementationOnce(({ data }: any) => Promise.resolve(data));

      const { created, skipped } = await service.generate({ period: '2026-08', roomIds: ['r1', 'r2'] } as any);

      expect(skipped).toEqual([{ roomId: 'r1', roomNumber: '101', reason: 'Hoá đơn kỳ này đã tồn tại.' }]);
      expect(created).toHaveLength(1);
      expect((created[0] as any).roomId).toBe('r2');
    });
  });

  describe('billing period boundary (11 → 10)', () => {
    const periodOn = (isoDate: string): string => {
      jest.useFakeTimers().setSystemTime(new Date(isoDate));
      try {
        return (service as any).currentBillingPeriod();
      } finally {
        jest.useRealTimers();
      }
    };

    it('the 10th still belongs to the PREVIOUS month\'s period', () => {
      expect(periodOn('2026-08-10T12:00:00Z')).toBe('2026-07');
    });

    it('the 11th rolls over into the CURRENT month\'s period', () => {
      expect(periodOn('2026-08-11T12:00:00Z')).toBe('2026-08');
    });

    it('rolls over the year boundary (Jan 5th → December of the previous year)', () => {
      expect(periodOn('2026-01-05T12:00:00Z')).toBe('2025-12');
    });
  });

  describe('remove — deleting invoices', () => {
    it('throws NotFoundException for a missing invoice', async () => {
      prisma.invoice.findUnique.mockResolvedValue(null);
      await expect(service.remove('ghost')).rejects.toThrow(NotFoundException);
    });

    it('refuses to delete a PAID invoice (financial record must be preserved)', async () => {
      prisma.invoice.findUnique.mockResolvedValue({ id: '1', status: InvoiceStatus.PAID });
      await expect(service.remove('1')).rejects.toThrow(BadRequestException);
      expect(prisma.invoice.delete).not.toHaveBeenCalled();
    });

    it('deletes a non-PAID invoice', async () => {
      prisma.invoice.findUnique.mockResolvedValue({ id: '1', status: InvoiceStatus.SENT });
      await service.remove('1');
      expect(prisma.invoice.delete).toHaveBeenCalledWith({ where: { id: '1' } });
    });
  });
});
