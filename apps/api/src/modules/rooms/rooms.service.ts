import * as bcrypt from 'bcryptjs';
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ContractsService } from '../contracts/contracts.service';

interface CreateRoomDto { roomNumber: string; floor: number; price: number; status?: string; }
interface UpdateRoomDto { roomNumber?: string; floor?: number; price?: number; status?: string; }

@Injectable()
export class RoomsService {
  constructor(
    private readonly prisma:    PrismaService,
    private readonly contracts: ContractsService,
  ) {}

  async findAll() {
    const rooms = await this.prisma.room.findMany({
      orderBy: [{ floor: 'asc' }, { roomNumber: 'asc' }],
      include: {
        contracts: {
          where:   { status: 'ACTIVE' },
          orderBy: { startDate: 'desc' },
          take:    1,
          include: { tenant: true },
        },
      },
    });

    const accounts = await this.prisma.user.findMany({
      where:  { roomId: { in: rooms.map(r => r.id) } },
      select: { roomId: true, username: true },
    });
    const usernameByRoomId = new Map(accounts.map(a => [a.roomId, a.username]));

    return rooms.map(r => {
      const tenant = r.contracts[0]?.tenant ?? null;
      return {
        roomId:     r.id,
        roomNumber: r.roomNumber,
        floor:      r.floor,
        price:      r.price,
        status:     r.status,
        tenant: tenant ? {
          tenantId:  tenant.id,
          fullName:  tenant.fullName,
          phone:     tenant.phone,
          username:  usernameByRoomId.get(r.id) ?? null,
        } : null,
      };
    });
  }

  async create(dto: CreateRoomDto) {
    const room = await this.prisma.room.create({
      data: {
        roomNumber: `P-${dto.roomNumber}`,
        floor:      dto.floor,
        price:      dto.price,
        status:     dto.status ?? 'AVAILABLE',
      },
    });
    return { roomId: room.id, roomNumber: room.roomNumber };
  }

  async update(id: string, dto: UpdateRoomDto) {
    const room = await this.prisma.room.findUnique({ where: { id } });
    if (!room) throw new NotFoundException('Không tìm thấy phòng.');

    const isVacating = dto.status === 'AVAILABLE' && room.status !== 'AVAILABLE';
    if (!isVacating) {
      return this.prisma.room.update({ where: { id }, data: dto });
    }

    // Chuyển phòng về trống: kết thúc luôn hợp đồng đang hiệu lực (nếu có),
    // vì Room↔Tenant không còn gắn cứng — quan hệ thuê chỉ tồn tại qua Contract.
    return this.prisma.$transaction(async tx => {
      await tx.contract.updateMany({
        where: { roomId: id, status: 'ACTIVE' },
        data:  { status: 'TERMINATED' },
      });
      return tx.room.update({ where: { id }, data: dto });
    });
  }

  async remove(id: string) {
    const room = await this.prisma.room.findUnique({ where: { id } });
    if (!room) throw new NotFoundException('Không tìm thấy phòng.');
    const activeContract = await this.contracts.findByRoom(id);
    if (activeContract) throw new NotFoundException('Không thể xoá phòng đang có người thuê.');
    await this.prisma.room.delete({ where: { id } });
  }

  async getAccount(roomId: string): Promise<{ username: string | null; email: string } | null> {
    const account = await this.prisma.user.findFirst({ where: { roomId } });
    if (!account) return null;
    return { username: account.username, email: account.email };
  }

  async changePassword(roomId: string, password: string): Promise<void> {
    const account = await this.prisma.user.findFirst({ where: { roomId } });
    if (!account) throw new NotFoundException('Phòng chưa có tài khoản.');
    const passwordHash = await bcrypt.hash(password, 10);
    await this.prisma.user.update({ where: { id: account.id }, data: { passwordHash } });
  }
}
