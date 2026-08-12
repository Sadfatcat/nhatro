import { Test } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TenantsService } from '../../../apps/api/src/modules/tenants/tenants.service';
import { PrismaService } from '../../../apps/api/src/prisma/prisma.service';

describe('TenantsService', () => {
  let service: TenantsService;
  let prisma: {
    tenant:   { create: jest.Mock; findMany: jest.Mock; findUnique: jest.Mock; update: jest.Mock; delete: jest.Mock };
    contract: { findMany: jest.Mock; findFirst: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      tenant:   { create: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn(), delete: jest.fn() },
      contract: { findMany: jest.fn(), findFirst: jest.fn() },
    };
    const module = await Test.createTestingModule({
      providers: [TenantsService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get(TenantsService);
  });

  describe('findAll — attaches each tenant\'s current room via their ACTIVE contract', () => {
    it('tenant with no active contract has room: null', async () => {
      prisma.tenant.findMany.mockResolvedValue([{ id: 't1', fullName: 'A', phone: '090' }]);
      prisma.contract.findMany.mockResolvedValue([]);
      const [row] = await service.findAll();
      expect(row.room).toBeNull();
    });

    it('tenant with an active contract shows the linked room', async () => {
      prisma.tenant.findMany.mockResolvedValue([{ id: 't1', fullName: 'A', phone: '090' }]);
      prisma.contract.findMany.mockResolvedValue([
        { tenantId: 't1', room: { id: 'r1', roomNumber: '101', price: 2000000 } },
      ]);
      const [row] = await service.findAll();
      expect(row.room).toEqual({ roomId: 'r1', roomNumber: '101', price: 2000000 });
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException for a missing tenant', async () => {
      prisma.tenant.findUnique.mockResolvedValue(null);
      await expect(service.findOne('ghost')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('throws NotFoundException before attempting to update a missing tenant', async () => {
      prisma.tenant.findUnique.mockResolvedValue(null);
      await expect(service.update('ghost', { fullName: 'X' } as any)).rejects.toThrow(NotFoundException);
      expect(prisma.tenant.update).not.toHaveBeenCalled();
    });

    it('clears dateOfBirth to null when explicitly set to empty, but leaves it untouched when omitted', async () => {
      prisma.tenant.findUnique.mockResolvedValue({ id: 't1' });
      prisma.tenant.update.mockResolvedValue({ id: 't1' });

      await service.update('t1', { dateOfBirth: '' } as any);
      expect(prisma.tenant.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ dateOfBirth: null }),
      }));

      prisma.tenant.update.mockClear();
      await service.update('t1', { fullName: 'New Name' } as any);
      expect(prisma.tenant.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ dateOfBirth: undefined }),
      }));
    });
  });

  describe('remove — cannot delete a tenant who still has ANY contract linked (active or not)', () => {
    it('throws NotFoundException for a missing tenant', async () => {
      prisma.tenant.findUnique.mockResolvedValue(null);
      await expect(service.remove('ghost')).rejects.toThrow(NotFoundException);
    });

    it('refuses deletion when a contract row still references this tenant', async () => {
      prisma.tenant.findUnique.mockResolvedValue({ id: 't1' });
      prisma.contract.findFirst.mockResolvedValue({ id: 'c1', tenantId: 't1' });
      await expect(service.remove('t1')).rejects.toThrow(BadRequestException);
      expect(prisma.tenant.delete).not.toHaveBeenCalled();
    });

    it('deletes when no contract references the tenant at all', async () => {
      prisma.tenant.findUnique.mockResolvedValue({ id: 't1' });
      prisma.contract.findFirst.mockResolvedValue(null);
      await service.remove('t1');
      expect(prisma.tenant.delete).toHaveBeenCalledWith({ where: { id: 't1' } });
    });
  });
});
