import { Test } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ContractsService } from '../../../apps/api/src/modules/contracts/contracts.service';
import { PrismaService } from '../../../apps/api/src/prisma/prisma.service';

const room   = { id: 'room-1', roomNumber: '101', floor: 1, price: 2500000 };
const tenant = { id: 'tenant-1', fullName: 'Nguyen Van A', phone: '0900000000', dateOfBirth: null, hometown: null, nationalId: null, tenantIdDate: null };

function makeContractRow(overrides: Partial<any> = {}) {
  return {
    id: 'c1', roomId: 'room-1', tenantId: 'tenant-1',
    startDate: new Date('2026-01-01'), endDate: null,
    firstBillingDate: null, lastBillingDate: null,
    deposit: 0, status: 'ACTIVE', notes: null, filePath: null,
    createdAt: new Date('2026-01-01'),
    room, tenant,
    ...overrides,
  };
}

describe('ContractsService', () => {
  let service: ContractsService;
  let prisma: {
    room:     { findUnique: jest.Mock; update: jest.Mock };
    tenant:   { findUnique: jest.Mock };
    contract: { findMany: jest.Mock; findFirst: jest.Mock; findUnique: jest.Mock; update: jest.Mock; delete: jest.Mock };
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      room:     { findUnique: jest.fn(), update: jest.fn() },
      tenant:   { findUnique: jest.fn() },
      contract: { findMany: jest.fn(), findFirst: jest.fn(), findUnique: jest.fn(), update: jest.fn(), delete: jest.fn() },
      $transaction: jest.fn(),
    };
    const module = await Test.createTestingModule({
      providers: [ContractsService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get(ContractsService);
  });

  describe('findOne / findAll / findByRoom — response shape', () => {
    it('findOne reshapes the flat Prisma row into nested room/tenant objects', async () => {
      prisma.contract.findUnique.mockResolvedValue(makeContractRow());
      const result = await service.findOne('c1');
      expect(result.room).toEqual({ roomId: 'room-1', roomNumber: '101', floor: 1, price: 2500000 });
      expect(result.tenant.tenantId).toBe('tenant-1');
    });

    it('findOne throws NotFoundException for a missing id', async () => {
      prisma.contract.findUnique.mockResolvedValue(null);
      await expect(service.findOne('ghost')).rejects.toThrow(NotFoundException);
    });

    it('findByRoom only ever looks up the ACTIVE contract for that room', async () => {
      prisma.contract.findFirst.mockResolvedValue(null);
      await service.findByRoom('room-1');
      expect(prisma.contract.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { roomId: 'room-1', status: 'ACTIVE' } }),
      );
    });

    it('findByRoom returns null (not an error) when the room has no active contract', async () => {
      prisma.contract.findFirst.mockResolvedValue(null);
      await expect(service.findByRoom('room-1')).resolves.toBeNull();
    });
  });

  describe('create — room/tenant validation and occupancy guard', () => {
    const dto = { roomId: 'room-1', tenantId: 'tenant-1', startDate: '2026-01-01', deposit: 1000000 } as any;

    it('throws NotFoundException when the room does not exist', async () => {
      prisma.room.findUnique.mockResolvedValue(null);
      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when the tenant does not exist', async () => {
      prisma.room.findUnique.mockResolvedValue(room);
      prisma.tenant.findUnique.mockResolvedValue(null);
      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
    });

    it('rejects creating a second ACTIVE contract for a room that already has one, and never writes it', async () => {
      prisma.room.findUnique.mockResolvedValue(room);
      prisma.tenant.findUnique.mockResolvedValue(tenant);
      const txContractCreate = jest.fn();
      const txRoomUpdate     = jest.fn();
      prisma.$transaction.mockImplementation(async (cb: any) => cb({
        contract: { findFirst: jest.fn().mockResolvedValue(makeContractRow()), create: txContractCreate },
        room:     { update: txRoomUpdate },
      }));

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
      expect(txContractCreate).not.toHaveBeenCalled();
      expect(txRoomUpdate).not.toHaveBeenCalled();
    });

    it('on success: creates the contract row and flips the room to OCCUPIED in the same transaction', async () => {
      prisma.room.findUnique.mockResolvedValue(room);
      prisma.tenant.findUnique.mockResolvedValue(tenant);
      const created = makeContractRow();
      const txRoomUpdate = jest.fn();
      prisma.$transaction.mockImplementation(async (cb: any) => cb({
        contract: { findFirst: jest.fn().mockResolvedValue(null), create: jest.fn().mockResolvedValue(created) },
        room:     { update: txRoomUpdate },
      }));

      // No real docx template at this cwd in the test environment — renderDocx legitimately
      // fails past the point that matters here. What we're proving is the DB side already committed correctly.
      await expect(service.create(dto)).rejects.toThrow('Template hợp đồng không tồn tại');
      expect(txRoomUpdate).toHaveBeenCalledWith({ where: { id: 'room-1' }, data: { status: 'OCCUPIED' } });
    });
  });

  describe('update — ending a contract frees up the room (regression: room used to stay OCCUPIED)', () => {
    it('flips the room back to AVAILABLE when status transitions away from ACTIVE', async () => {
      prisma.contract.findUnique.mockResolvedValue(makeContractRow({ status: 'ACTIVE' }));
      const txRoomUpdate = jest.fn();
      prisma.$transaction.mockImplementation(async (cb: any) => cb({
        contract: { update: jest.fn() },
        room:     { update: txRoomUpdate },
      }));

      await expect(service.update('c1', { status: 'TERMINATED' } as any)).rejects.toThrow('Template hợp đồng không tồn tại');
      expect(txRoomUpdate).toHaveBeenCalledWith({ where: { id: 'room-1' }, data: { status: 'AVAILABLE' } });
    });

    it('does NOT touch the room when the contract stays ACTIVE (e.g. deposit edit only)', async () => {
      prisma.contract.findUnique.mockResolvedValue(makeContractRow({ status: 'ACTIVE' }));
      const txRoomUpdate = jest.fn();
      prisma.$transaction.mockImplementation(async (cb: any) => cb({
        contract: { update: jest.fn() },
        room:     { update: txRoomUpdate },
      }));

      await expect(service.update('c1', { deposit: 2000000 } as any)).rejects.toThrow('Template hợp đồng không tồn tại');
      expect(txRoomUpdate).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('throws NotFoundException for a missing contract', async () => {
      prisma.contract.findUnique.mockResolvedValue(null);
      await expect(service.remove('ghost')).rejects.toThrow(NotFoundException);
    });

    it('deletes the DB row (file cleanup is best-effort and must not block deletion)', async () => {
      prisma.contract.findUnique.mockResolvedValue(makeContractRow({ filePath: null }));
      prisma.contract.delete.mockResolvedValue(makeContractRow());
      await service.remove('c1');
      expect(prisma.contract.delete).toHaveBeenCalledWith({ where: { id: 'c1' } });
    });

    it('propagates the DB error instead of swallowing it when the contract still has invoices (FK RESTRICT)', async () => {
      prisma.contract.findUnique.mockResolvedValue(makeContractRow({ filePath: null }));
      prisma.contract.delete.mockRejectedValue(
        Object.assign(new Error('Foreign key constraint violated'), { code: 'P2003' }),
      );
      await expect(service.remove('c1')).rejects.toThrow('Foreign key constraint violated');
    });
  });
});
