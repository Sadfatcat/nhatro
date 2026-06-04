import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

interface CreateRoomDto { roomNumber: string; floor: number; price: number; status?: string; }
interface UpdateRoomDto { roomNumber?: string; floor?: number; price?: number; status?: string; }

@Injectable()
export class RoomsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const rooms = await this.prisma.room.findMany({
      orderBy: [{ floor: 'asc' }, { roomNumber: 'asc' }],
      include: { tenant: { include: { user: true } } },
    });
    return rooms.map(r => ({
      roomId:     r.id,
      roomNumber: r.roomNumber,
      floor:      r.floor,
      price:      r.price,
      status:     r.status,
      tenant: r.tenant ? {
        tenantId:  r.tenant.id,
        fullName:  r.tenant.fullName,
        phone:     r.tenant.phone,
        username:  r.tenant.user.username,
      } : null,
    }));
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
    return this.prisma.room.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    const room = await this.prisma.room.findUnique({ where: { id }, include: { tenant: true } });
    if (!room) throw new NotFoundException('Không tìm thấy phòng.');
    if (room.tenant) throw new NotFoundException('Không thể xoá phòng đang có người thuê.');
    await this.prisma.room.delete({ where: { id } });
  }
}
