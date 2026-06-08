import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateLandlordAccountDto } from './dto/create-landlord-account.dto';
import { CreateRoomAccountDto } from './dto/create-room-account.dto';

@Injectable()
export class AccountsService {
  constructor(private readonly prisma: PrismaService) {}

  async listAccounts() {
    const [rooms, landlords] = await Promise.all([
      this.prisma.room.findMany({
        orderBy: [{ floor: 'asc' }, { roomNumber: 'asc' }],
        include: { tenant: { include: { user: true } } },
      }),
      this.prisma.user.findMany({
        where:   { role: { in: ['LANDLORD', 'ADMIN'] } },
        orderBy: { createdAt: 'desc' },
        include: { landlord: { include: { rooms: true } } },
      }),
    ]);

    return {
      rooms: rooms.map(room => ({
        roomId:     room.id,
        roomNumber: room.roomNumber,
        floor:      room.floor,
        price:      room.price,
        status:     room.status,
        tenant: room.tenant
          ? {
              tenantId:    room.tenant.id,
              userId:      room.tenant.user.id,
              fullName:    room.tenant.fullName,
              phone:       room.tenant.phone,
              dateOfBirth: room.tenant.dateOfBirth,
              hometown:    room.tenant.hometown,
              nationalId:  room.tenant.nationalId,
              username:    room.tenant.user.username,
              email:       room.tenant.user.email,
              isActive:    room.tenant.user.isActive,
            }
          : null,
      })),
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

  async createRoomAccount(dto: CreateRoomAccountDto): Promise<unknown> {
    const room = await this.prisma.room.findUnique({ where: { id: dto.roomId }, include: { tenant: true } });
    if (!room) throw new NotFoundException('Không tìm thấy phòng.');
    if (room.tenant) throw new BadRequestException('Phòng này đã có tài khoản người thuê.');

    const username = dto.username.trim().toLowerCase();
    const existsUsername = await this.prisma.user.findUnique({ where: { username } });
    if (existsUsername) throw new BadRequestException('Username đã được sử dụng.');

    const internalEmail = `${username}@nhatro.local`;
    const existsEmail = await this.prisma.user.findUnique({ where: { email: internalEmail } });
    if (existsEmail) throw new BadRequestException('Username đã được sử dụng.');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    return this.prisma.$transaction(async tx => {
      const user = await tx.user.create({
        data: {
          email:    internalEmail,
          username,
          passwordHash,
          fullName: dto.fullName,
          phone:    dto.phone,
          role:     'TENANT',
          roomId:   room.id,
        },
      });
      const tenant = await tx.tenant.create({
        data: {
          userId:      user.id,
          roomId:      room.id,
          fullName:    dto.fullName,
          phone:       dto.phone,
          dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
          hometown:    dto.hometown,
          nationalId:  dto.nationalId,
        },
      });
      await tx.room.update({ where: { id: room.id }, data: { status: 'OCCUPIED' } });
      return { userId: user.id, tenantId: tenant.id, username };
    });
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

  async updateTenantInfo(
    roomId: string,
    data: { fullName?: string; phone?: string; dateOfBirth?: string | null; hometown?: string | null; nationalId?: string | null },
  ): Promise<void> {
    const room = await this.prisma.room.findUnique({ where: { id: roomId }, include: { tenant: true } });
    if (!room?.tenant) throw new NotFoundException('Phòng chưa có người thuê.');
    await this.prisma.tenant.update({
      where: { id: room.tenant.id },
      data: {
        fullName:    data.fullName,
        phone:       data.phone,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        hometown:    data.hometown,
        nationalId:  data.nationalId,
      },
    });
  }

  async getRoomCredentials(roomId: string): Promise<{ username: string | null; email: string }> {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      include: { tenant: { include: { user: true } } },
    });
    if (!room?.tenant) throw new NotFoundException('Phòng chưa có tài khoản.');
    return { username: room.tenant.user.username, email: room.tenant.user.email };
  }

  async changeRoomPassword(roomId: string, password: string): Promise<void> {
    const room = await this.prisma.room.findUnique({ where: { id: roomId }, include: { tenant: true } });
    if (!room?.tenant) throw new NotFoundException('Phòng chưa có tài khoản.');
    const passwordHash = await bcrypt.hash(password, 10);
    await this.prisma.user.update({ where: { id: room.tenant.userId }, data: { passwordHash } });
  }

  async deleteTenant(tenantId: string): Promise<void> {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Không tìm thấy người thuê.');
    await this.prisma.$transaction(async tx => {
      await tx.room.update({ where: { id: tenant.roomId }, data: { status: 'AVAILABLE' } });
      await tx.tenant.delete({ where: { id: tenantId } });
      await tx.user.delete({ where: { id: tenant.userId } });
    });
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

  async updateRoomPrice(roomId: string, price: number): Promise<void> {
    await this.prisma.room.update({ where: { id: roomId }, data: { price } });
  }

  async updateRoomStatus(roomId: string, status: string): Promise<void> {
    await this.prisma.room.update({ where: { id: roomId }, data: { status } });
  }

}
