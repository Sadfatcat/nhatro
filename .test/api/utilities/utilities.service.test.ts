import { Test } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UtilitiesService } from '../../../apps/api/src/modules/utilities/utilities.service';
import { PrismaService } from '../../../apps/api/src/prisma/prisma.service';

describe('UtilitiesService', () => {
  let service: UtilitiesService;
  let prisma: {
    room:          { findUnique: jest.Mock; findMany: jest.Mock; update: jest.Mock; updateMany: jest.Mock };
    user:          { findMany: jest.Mock };
    invoice:       { findFirst: jest.Mock };
    utilityRecord: { findFirst: jest.Mock; findMany: jest.Mock; findUnique: jest.Mock; upsert: jest.Mock };
  };
  let events: { emit: jest.Mock };

  const now = new Date('2026-08-15T00:00:00Z');

  beforeEach(async () => {
    jest.useFakeTimers().setSystemTime(now);
    prisma = {
      room:          { findUnique: jest.fn(), findMany: jest.fn(), update: jest.fn(), updateMany: jest.fn() },
      user:          { findMany: jest.fn() },
      invoice:       { findFirst: jest.fn() },
      utilityRecord: { findFirst: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), upsert: jest.fn() },
    };
    events = { emit: jest.fn() };
    const module = await Test.createTestingModule({
      providers: [
        UtilitiesService,
        { provide: PrismaService, useValue: prisma },
        { provide: EventEmitter2, useValue: events },
      ],
    }).compile();
    service = module.get(UtilitiesService);
  });

  afterEach(() => jest.useRealTimers());

  describe('record — the exact bug fixed this session: per-month history, not overwrite-in-place', () => {
    it('throws NotFoundException for a missing room', async () => {
      prisma.room.findUnique.mockResolvedValue(null);
      await expect(service.record('ghost', { currElec: 10, currWater: 5 })).rejects.toThrow(NotFoundException);
    });

    it('blocks the write entirely when the period already has a PAID invoice, with a clear message', async () => {
      prisma.room.findUnique.mockResolvedValue({ id: 'r1' });
      prisma.invoice.findFirst.mockResolvedValue({ id: 'inv-1', status: 'PAID' });

      await expect(service.record('r1', { currElec: 10, currWater: 5, billingMonth: '2026-08' }))
        .rejects.toThrow('Hoá đơn kỳ này đã thanh toán, không thể sửa chỉ số điện nước.');
      expect(prisma.utilityRecord.upsert).not.toHaveBeenCalled();
    });

    it('derives prevElec/prevWater from the immediately-preceding month\'s curr values — not any later month', async () => {
      prisma.room.findUnique.mockResolvedValue({ id: 'r1' });
      prisma.invoice.findFirst.mockResolvedValue(null);
      prisma.utilityRecord.findFirst.mockResolvedValue({ billingMonth: '2026-07', currElec: 170, currWater: 30 });
      prisma.utilityRecord.upsert.mockResolvedValue({});

      await service.record('r1', { currElec: 220, currWater: 45, billingMonth: '2026-09' });

      expect(prisma.utilityRecord.findFirst).toHaveBeenCalledWith({
        where:   { roomId: 'r1', billingMonth: { lt: '2026-09' } },
        orderBy: { billingMonth: 'desc' },
      });
      expect(prisma.utilityRecord.upsert).toHaveBeenCalledWith(expect.objectContaining({
        where:  { roomId_billingMonth: { roomId: 'r1', billingMonth: '2026-09' } },
        update: expect.objectContaining({ prevElec: 170, currElec: 220, prevWater: 30, currWater: 45 }),
      }));
    });

    it('defaults prev to 0 when there is no earlier month at all (first-ever reading)', async () => {
      prisma.room.findUnique.mockResolvedValue({ id: 'r1' });
      prisma.invoice.findFirst.mockResolvedValue(null);
      prisma.utilityRecord.findFirst.mockResolvedValue(null);
      prisma.utilityRecord.upsert.mockResolvedValue({});

      await service.record('r1', { currElec: 90, currWater: 8, billingMonth: '2026-07' });

      expect(prisma.utilityRecord.upsert).toHaveBeenCalledWith(expect.objectContaining({
        update: expect.objectContaining({ prevElec: 0, prevWater: 0 }),
      }));
    });

    it('defaults billingMonth to the current calendar month when not supplied', async () => {
      prisma.room.findUnique.mockResolvedValue({ id: 'r1' });
      prisma.invoice.findFirst.mockResolvedValue(null);
      prisma.utilityRecord.findFirst.mockResolvedValue(null);
      prisma.utilityRecord.upsert.mockResolvedValue({});

      await service.record('r1', { currElec: 1, currWater: 1 });

      expect(prisma.invoice.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { roomId: 'r1', period: '2026-08', status: 'PAID' } }));
    });

    it('emits utility.recorded with the room and resolved billingMonth, for the invoice sync listener', async () => {
      prisma.room.findUnique.mockResolvedValue({ id: 'r1' });
      prisma.invoice.findFirst.mockResolvedValue(null);
      prisma.utilityRecord.findFirst.mockResolvedValue(null);
      prisma.utilityRecord.upsert.mockResolvedValue({});

      await service.record('r1', { currElec: 1, currWater: 1, billingMonth: '2026-06' });
      expect(events.emit).toHaveBeenCalledWith('utility.recorded', { roomId: 'r1', billingMonth: '2026-06' });
    });
  });

  describe('history — powers the tenant-home 6-month chart', () => {
    it('throws NotFoundException for a missing room', async () => {
      prisma.room.findUnique.mockResolvedValue(null);
      await expect(service.history('ghost')).rejects.toThrow(NotFoundException);
    });

    it('returns exactly `months` entries, zero-filled for months with no recorded reading', async () => {
      prisma.room.findUnique.mockResolvedValue({ id: 'r1' });
      prisma.utilityRecord.findMany.mockResolvedValue([
        { billingMonth: '2026-08', prevElec: 100, currElec: 170, prevWater: 10, currWater: 30, recordedAt: now },
      ]);

      const result = await service.history('r1', 6);
      expect(result).toHaveLength(6);
      expect(result[result.length - 1]).toMatchObject({ billingMonth: '2026-08', elecUsed: 70, waterUsed: 20 });
      expect(result[0]).toMatchObject({ billingMonth: '2026-03', elecUsed: 0, waterUsed: 0, recordedAt: null });
    });

    it('orders months oldest → newest, ending on the current month', async () => {
      prisma.room.findUnique.mockResolvedValue({ id: 'r1' });
      prisma.utilityRecord.findMany.mockResolvedValue([]);
      const result = await service.history('r1', 3);
      expect(result.map(r => r.billingMonth)).toEqual(['2026-06', '2026-07', '2026-08']);
    });

    it('clamps a negative delta (bad/reset meter) to zero instead of a negative usage number', async () => {
      prisma.room.findUnique.mockResolvedValue({ id: 'r1' });
      prisma.utilityRecord.findMany.mockResolvedValue([
        { billingMonth: '2026-08', prevElec: 500, currElec: 100, prevWater: 50, currWater: 10, recordedAt: now },
      ]);
      const result = await service.history('r1', 1);
      expect(result[0].elecUsed).toBe(0);
      expect(result[0].waterUsed).toBe(0);
    });
  });

  describe('findByRoom — no more auto-seeding zeroed rows on every GET (removed side effect)', () => {
    it('defaults to the current month when none is given', async () => {
      prisma.room.findUnique.mockResolvedValue({ id: 'r1' });
      prisma.utilityRecord.findUnique.mockResolvedValue(null);
      await service.findByRoom('r1');
      expect(prisma.utilityRecord.findUnique).toHaveBeenCalledWith({
        where: { roomId_billingMonth: { roomId: 'r1', billingMonth: '2026-08' } },
      });
    });

    it('reads the exact month requested via the query param', async () => {
      prisma.room.findUnique.mockResolvedValue({ id: 'r1' });
      prisma.utilityRecord.findUnique.mockResolvedValue(null);
      await service.findByRoom('r1', '2026-03');
      expect(prisma.utilityRecord.findUnique).toHaveBeenCalledWith({
        where: { roomId_billingMonth: { roomId: 'r1', billingMonth: '2026-03' } },
      });
    });

    it('returns utilityRecord: null (does NOT create a row) when nothing exists for that month', async () => {
      prisma.room.findUnique.mockResolvedValue({ id: 'r1', roomNumber: '101', floor: 1, price: 1, status: 'OCCUPIED', billingDay: 15 });
      prisma.utilityRecord.findUnique.mockResolvedValue(null);
      const result = await service.findByRoom('r1', '2026-03');
      expect(result.utilityRecord).toBeNull();
      expect(prisma.utilityRecord.upsert).not.toHaveBeenCalled();
    });
  });

  describe('findAll — management dashboard, current month only, no auto-seed', () => {
    it('scopes the included utilityRecords to the current billing month only', async () => {
      prisma.room.findMany.mockResolvedValue([]);
      prisma.user.findMany.mockResolvedValue([]);
      await service.findAll();
      expect(prisma.room.findMany).toHaveBeenCalledWith(expect.objectContaining({
        include: expect.objectContaining({ utilityRecords: { where: { billingMonth: '2026-08' } } }),
      }));
    });
  });
});
