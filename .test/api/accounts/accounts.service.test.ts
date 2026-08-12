import { Test } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AccountsService } from '../../../apps/api/src/modules/accounts/accounts.service';
import { PrismaService } from '../../../apps/api/src/prisma/prisma.service';

describe('AccountsService', () => {
  let service: AccountsService;
  let prisma: {
    user: { findMany: jest.Mock; findUnique: jest.Mock; create: jest.Mock; update: jest.Mock };
  };

  beforeEach(async () => {
    prisma = { user: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn() } };
    const module = await Test.createTestingModule({
      providers: [AccountsService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get(AccountsService);
  });

  describe('listAccounts — only ever returns management accounts, never tenants', () => {
    it('queries strictly for role in [LANDLORD, ADMIN]', async () => {
      prisma.user.findMany.mockResolvedValue([]);
      await service.listAccounts();
      expect(prisma.user.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { role: { in: ['LANDLORD', 'ADMIN'] } },
      }));
    });

    it('counts rooms owned by the landlord profile', async () => {
      prisma.user.findMany.mockResolvedValue([
        { id: 'u1', username: 'a', fullName: 'A', phone: null, isActive: true, createdAt: new Date(), role: 'LANDLORD',
          landlord: { id: 'l1', rooms: [{ id: 'r1' }, { id: 'r2' }] } },
      ]);
      const { landlords } = await service.listAccounts();
      expect(landlords[0].roomCount).toBe(2);
    });

    it('an ADMIN account (no landlord profile) shows roomCount 0, not a crash', async () => {
      prisma.user.findMany.mockResolvedValue([
        { id: 'u1', username: 'admin', fullName: 'Admin', phone: null, isActive: true, createdAt: new Date(), role: 'ADMIN', landlord: null },
      ]);
      const { landlords } = await service.listAccounts();
      expect(landlords[0].roomCount).toBe(0);
      expect(landlords[0].landlordId).toBeNull();
    });
  });

  describe('createLandlordAccount', () => {
    it('rejects a username that is already taken', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'existing' });
      await expect(service.createLandlordAccount({ username: 'taken', password: 'x', fullName: 'A', phone: null } as any))
        .rejects.toThrow(BadRequestException);
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('normalizes the username (trim + lowercase) before checking uniqueness and creating', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({ id: 'u1', landlord: { id: 'l1' } });

      await service.createLandlordAccount({ username: '  MixedCase  ', password: 'x', fullName: 'A', phone: null } as any);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { username: 'mixedcase' } });
      expect(prisma.user.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ username: 'mixedcase', role: 'LANDLORD' }),
      }));
    });

    it('hashes the password — never stores it in plaintext', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({ id: 'u1', landlord: { id: 'l1' } });
      await service.createLandlordAccount({ username: 'x', password: 'super-secret-pass', fullName: 'A', phone: null } as any);
      const [[{ data }]] = prisma.user.create.mock.calls;
      expect(data.passwordHash).not.toBe('super-secret-pass');
    });

    it('new accounts are always created as LANDLORD — this endpoint cannot mint an ADMIN', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({ id: 'u1', landlord: { id: 'l1' } });
      await service.createLandlordAccount({ username: 'x', password: 'x', fullName: 'A', phone: null } as any);
      expect(prisma.user.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ role: 'LANDLORD' }),
      }));
    });
  });

  describe('changeUserRole — privilege escalation guard', () => {
    it('throws NotFoundException for a missing user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.changeUserRole('ghost', 'ADMIN')).rejects.toThrow(NotFoundException);
    });

    it('refuses to touch a TENANT account — cannot be role-escalated through this endpoint', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u1', role: 'TENANT' });
      await expect(service.changeUserRole('u1', 'ADMIN')).rejects.toThrow(BadRequestException);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('allows LANDLORD → ADMIN for an existing management account', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u1', role: 'LANDLORD' });
      await service.changeUserRole('u1', 'ADMIN');
      expect(prisma.user.update).toHaveBeenCalledWith({ where: { id: 'u1' }, data: { role: 'ADMIN' } });
    });

    it('allows ADMIN → LANDLORD (demotion) for an existing management account', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u1', role: 'ADMIN' });
      await service.changeUserRole('u1', 'LANDLORD');
      expect(prisma.user.update).toHaveBeenCalledWith({ where: { id: 'u1' }, data: { role: 'LANDLORD' } });
    });
  });

  describe('changePassword', () => {
    it('throws NotFoundException for a missing account', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.changePassword('ghost', 'newpass')).rejects.toThrow(NotFoundException);
    });

    it('hashes the new password', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u1' });
      await service.changePassword('u1', 'plaintext-here');
      const [[{ data }]] = prisma.user.update.mock.calls;
      expect(data.passwordHash).not.toBe('plaintext-here');
    });
  });
});
