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
      include: {
        utilityRecord: true,
        tenant: { select: { id: true, fullName: true, user: { select: { username: true } } } },
      },
    });

    const missing = rooms.filter(r => !r.utilityRecord);
    if (missing.length > 0) {
      const now          = new Date();
      const billingMonth = this.currentBillingMonth();
      await this.prisma.utilityRecord.createMany({
        data: missing.map(r => ({
          roomId: r.id,
          prevElec: 0, currElec: 0,
          prevWater: 0, currWater: 0,
          recordedAt: now,
          billingMonth,
        })),
        skipDuplicates: true,
      });
      const seeded = await this.prisma.utilityRecord.findMany({ where: { roomId: { in: missing.map(r => r.id) } } });
      const seedMap = new Map(seeded.map(u => [u.roomId, u]));
      rooms.forEach(r => { if (!r.utilityRecord) r.utilityRecord = seedMap.get(r.id) ?? null; });
    }

    return rooms.map(r => this.mapRoom(r));
  }

  async findByRoom(roomId: string) {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      include: { utilityRecord: true },
    });
    if (!room) throw new NotFoundException('Không tìm thấy phòng.');
    if (!room.utilityRecord) {
      room.utilityRecord = await this.prisma.utilityRecord.create({
        data: {
          roomId,
          prevElec: 0, currElec: 0,
          prevWater: 0, currWater: 0,
          recordedAt: new Date(),
          billingMonth: this.currentBillingMonth(),
        },
      });
    }
    return this.mapRoom(room);
  }

  async record(roomId: string, dto: RecordDto) {
    const room = await this.prisma.room.findUnique({ where: { id: roomId } });
    if (!room) throw new NotFoundException('Không tìm thấy phòng.');

    const now          = new Date();
    const billingMonth = this.currentBillingMonth();

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

  async setBillingDayBulk(roomIds: string[], billingDay: number) {
    return this.prisma.room.updateMany({ where: { id: { in: roomIds } }, data: { billingDay } });
  }

  private currentBillingMonth(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
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
