import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateLandlordAccountDto } from './dto/create-landlord-account.dto';

@Injectable()
export class AccountsService {
  constructor(private readonly prisma: PrismaService) {}

  async listAccounts() {
    const landlords = await this.prisma.user.findMany({
      where:   { role: { in: ['LANDLORD', 'ADMIN'] } },
      orderBy: { createdAt: 'desc' },
      include: { landlord: { include: { rooms: true } } },
    });

    return {
      landlords: landlords.map(u => ({
        userId:     u.id,
        landlordId: u.landlord?.id ?? null,
        username:   u.username,
        fullName:   u.fullName,
        phone:      u.phone,
        isActive:   u.isActive,
        createdAt:  u.createdAt,
        roomCount:  u.landlord?.rooms.length ?? 0,
        role:       u.role,
      })),
    };
  }

  async createLandlordAccount(dto: CreateLandlordAccountDto): Promise<unknown> {
    const username = dto.username.trim().toLowerCase();
    const exists = await this.prisma.user.findUnique({ where: { username } });
    if (exists) throw new BadRequestException('Username đã được sử dụng.');

    const internalEmail = `${username}@nhatro.local`;
    const passwordHash  = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: internalEmail,
        username,
        passwordHash,
        fullName: dto.fullName,
        phone:    dto.phone,
        role:     'LANDLORD',
        landlord: { create: { fullName: dto.fullName, phone: dto.phone } },
      },
      include: { landlord: true },
    });
    return { userId: user.id, landlordId: user.landlord?.id };
  }

  async changePassword(userId: string, password: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Không tìm thấy tài khoản.');
    const passwordHash = await bcrypt.hash(password, 10);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  }

  async changeUserRole(userId: string, role: 'LANDLORD' | 'ADMIN'): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Không tìm thấy tài khoản.');
    if (user.role !== 'LANDLORD' && user.role !== 'ADMIN')
      throw new BadRequestException('Chỉ có thể đổi role giữa Landlord và Admin.');
    await this.prisma.user.update({ where: { id: userId }, data: { role } });
  }
}
