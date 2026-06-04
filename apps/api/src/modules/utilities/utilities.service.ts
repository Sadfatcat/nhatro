import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

interface RecordDto {
  prevElec:  number;
  currElec:  number;
  prevWater: number;
  currWater: number;
}

@Injectable()
export class UtilitiesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const rooms = await this.prisma.room.findMany({
      orderBy: [{ floor: 'asc' }, { roomNumber: 'asc' }],
      include: { utilityRecord: true, tenant: { include: { user: true } } },
    });
    return rooms.map(r => this.mapRoom(r));
  }

  async findByRoom(roomId: string) {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      include: { utilityRecord: true },
    });
    if (!room) throw new NotFoundException('Không tìm thấy phòng.');
    return this.mapRoom(room);
  }

  async record(roomId: string, dto: RecordDto) {
    const room = await this.prisma.room.findUnique({ where: { id: roomId } });
    if (!room) throw new NotFoundException('Không tìm thấy phòng.');

    const now          = new Date();
    const billingMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const record = await this.prisma.utilityRecord.upsert({
      where:  { roomId },
      update: {
        prevElec:     dto.prevElec,
        currElec:     dto.currElec,
        prevWater:    dto.prevWater,
        currWater:    dto.currWater,
        recordedAt:   now,
        billingMonth,
      },
      create: {
        roomId,
        prevElec:     dto.prevElec,
        currElec:     dto.currElec,
        prevWater:    dto.prevWater,
        currWater:    dto.currWater,
        recordedAt:   now,
        billingMonth,
      },
    });
    return record;
  }

  async setBillingDay(roomId: string, billingDay: number) {
    const room = await this.prisma.room.findUnique({ where: { id: roomId } });
    if (!room) throw new NotFoundException('Không tìm thấy phòng.');
    return this.prisma.room.update({ where: { id: roomId }, data: { billingDay } });
  }

  private mapRoom(room: any) {
    return {
      roomId:       room.id,
      roomNumber:   room.roomNumber,
      floor:        room.floor,
      price:        room.price,
      status:       room.status,
      billingDay:   room.billingDay,
      tenant:       room.tenant ? {
        tenantId: room.tenant.id,
        fullName: room.tenant.fullName,
        username: room.tenant.user?.username,
      } : null,
      utilityRecord: room.utilityRecord ? {
        id:           room.utilityRecord.id,
        prevElec:     room.utilityRecord.prevElec,
        currElec:     room.utilityRecord.currElec,
        prevWater:    room.utilityRecord.prevWater,
        currWater:    room.utilityRecord.currWater,
        recordedAt:   room.utilityRecord.recordedAt,
        billingMonth: room.utilityRecord.billingMonth,
      } : null,
    };
  }
}
