import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { RoomsService } from '../../../apps/api/src/modules/rooms/rooms.service';
import { PrismaService } from '../../../apps/api/src/prisma/prisma.service';

describe('RoomsService', () => {
  let service: RoomsService;
  let prisma: {
    room: { findMany: jest.Mock; findUnique: jest.Mock; create: jest.Mock; update: jest.Mock };
    user: { findMany: jest.Mock; findFirst: jest.Mock; update: jest.Mock };
    contract: { updateMany: jest.Mock };
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      room:     { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
      user:     { findMany: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
      contract: { updateMany: jest.fn() },
      $transaction: jest.fn(),
    };
    const module = await Test.createTestingModule({
      providers: [RoomsService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get(RoomsService);
  });

  describe('findAll — response shape', () => {
    it('attaches the ACTIVE tenant and their account username to each room', async () => {
      prisma.room.findMany.mockResolvedValue([
        { id: 'r1', roomNumber: '101', floor: 1, price: 2000000, status: 'OCCUPIED',
          contracts: [{ tenant: { id: 't1', fullName: 'A', phone: '090' } }] },
      ]);
      prisma.user.findMany.mockResolvedValue([{ roomId: 'r1', username: 'phong101' }]);

      const [room] = await service.findAll();
      expect(room.tenant).toEqual({ tenantId: 't1', fullName: 'A', phone: '090', username: 'phong101' });
    });

    it('tenant is null for a vacant room with no active contract', async () => {
      prisma.room.findMany.mockResolvedValue([
        { id: 'r1', roomNumber: '101', floor: 1, price: 2000000, status: 'AVAILABLE', contracts: [] },
      ]);
      prisma.user.findMany.mockResolvedValue([]);
      const [room] = await service.findAll();
      expect(room.tenant).toBeNull();
    });
  });

  describe('create', () => {
    it('CURRENT BEHAVIOR (flagged, unconfirmed): prefixes the room number with "P-" — inconsistent with the 43 existing plain-number rooms; see vault issue room-number-p-prefix-inconsistency', async () => {
      prisma.room.create.mockResolvedValue({ id: 'new-room', roomNumber: 'P-105' });
      const result = await service.create({ roomNumber: '105', floor: 1, price: 2000000 });
      expect(prisma.room.create).toHaveBeenCalledWith({
        data: { roomNumber: 'P-105', floor: 1, price: 2000000, status: 'AVAILABLE' },
      });
      expect(result.roomNumber).toBe('P-105');
    });

    it('defaults status to AVAILABLE when not given', async () => {
      prisma.room.create.mockResolvedValue({ id: 'r1', roomNumber: 'P-1' });
      await service.create({ roomNumber: '1', floor: 1, price: 1 });
      expect(prisma.room.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: 'AVAILABLE' }) }));
    });
  });

  describe('update — vacating a room also terminates its active contract (Room↔Tenant decoupling)', () => {
    it('throws NotFoundException for a missing room', async () => {
      prisma.room.findUnique.mockResolvedValue(null);
      await expect(service.update('ghost', { status: 'AVAILABLE' })).rejects.toThrow(NotFoundException);
    });

    it('a plain field edit (e.g. price) does NOT touch contracts — no transaction needed', async () => {
      prisma.room.findUnique.mockResolvedValue({ id: 'r1', status: 'OCCUPIED' });
      prisma.room.update.mockResolvedValue({ id: 'r1' });
      await service.update('r1', { price: 3000000 });
      expect(prisma.$transaction).not.toHaveBeenCalled();
      expect(prisma.room.update).toHaveBeenCalledWith({ where: { id: 'r1' }, data: { price: 3000000 } });
    });

    it('setting status → AVAILABLE from a non-available room auto-terminates the ACTIVE contract, in one transaction', async () => {
      prisma.room.findUnique.mockResolvedValue({ id: 'r1', status: 'OCCUPIED' });
      const txContractUpdateMany = jest.fn();
      const txRoomUpdate         = jest.fn().mockResolvedValue({ id: 'r1', status: 'AVAILABLE' });
      prisma.$transaction.mockImplementation(async (cb: any) => cb({
        contract: { updateMany: txContractUpdateMany },
        room:     { update: txRoomUpdate },
      }));

      await service.update('r1', { status: 'AVAILABLE' });

      expect(txContractUpdateMany).toHaveBeenCalledWith({
        where: { roomId: 'r1', status: 'ACTIVE' },
        data:  { status: 'TERMINATED' },
      });
      expect(txRoomUpdate).toHaveBeenCalledWith({ where: { id: 'r1' }, data: { status: 'AVAILABLE' } });
    });

    it('setting status → AVAILABLE when the room is ALREADY available does not re-trigger contract termination', async () => {
      prisma.room.findUnique.mockResolvedValue({ id: 'r1', status: 'AVAILABLE' });
      prisma.room.update.mockResolvedValue({ id: 'r1' });
      await service.update('r1', { status: 'AVAILABLE' });
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('getAccount', () => {
    it('returns null when the room has no linked user account', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      expect(await service.getAccount('r1')).toBeNull();
    });

    it('returns username + email when an account exists', async () => {
      prisma.user.findFirst.mockResolvedValue({ username: 'u1', email: 'u1@x.com' });
      expect(await service.getAccount('r1')).toEqual({ username: 'u1', email: 'u1@x.com' });
    });
  });

  describe('changePassword', () => {
    it('throws NotFoundException when the room has no account to change', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      await expect(service.changePassword('r1', 'newpass123')).rejects.toThrow(NotFoundException);
    });

    it('hashes the new password before storing it (never stores plaintext)', async () => {
      prisma.user.findFirst.mockResolvedValue({ id: 'u1' });
      await service.changePassword('r1', 'plaintext-pass');
      const [[{ data }]] = prisma.user.update.mock.calls;
      expect(data.passwordHash).not.toBe('plaintext-pass');
      expect(data.passwordHash.length).toBeGreaterThan(20);
    });
  });
});
