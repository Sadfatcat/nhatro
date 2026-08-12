import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';

interface RecordDto {
  currElec:     number;
  currWater:    number;
  billingMonth?: string;
}

@Injectable()
export class UtilitiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
  ) {}

  async findAll() {
    const billingMonth = this.currentBillingMonth();
    const rooms = await this.prisma.room.findMany({
      orderBy: [{ floor: 'asc' }, { roomNumber: 'asc' }],
      include: {
        utilityRecords: { where: { billingMonth } },
        contracts: {
          where:   { status: 'ACTIVE' },
          orderBy: { startDate: 'desc' },
          take:    1,
          select:  { tenant: { select: { id: true, fullName: true } } },
        },
      },
    });

    const accounts = await this.prisma.user.findMany({
      where:  { roomId: { in: rooms.map(r => r.id) } },
      select: { roomId: true, username: true },
    });
    const usernameByRoomId = new Map(accounts.map(a => [a.roomId, a.username]));

    return rooms.map(r => this.mapRoom(
      { ...r, utilityRecord: r.utilityRecords[0] ?? null },
      usernameByRoomId.get(r.id) ?? null,
    ));
  }

  async findByRoom(roomId: string, month?: string) {
    const room = await this.prisma.room.findUnique({ where: { id: roomId } });
    if (!room) throw new NotFoundException('Không tìm thấy phòng.');

    const billingMonth  = month ?? this.currentBillingMonth();
    const utilityRecord = await this.prisma.utilityRecord.findUnique({
      where: { roomId_billingMonth: { roomId, billingMonth } },
    });
    return this.mapRoom({ ...room, utilityRecord });
  }

  async history(roomId: string, months = 6) {
    const room = await this.prisma.room.findUnique({ where: { id: roomId } });
    if (!room) throw new NotFoundException('Không tìm thấy phòng.');

    const monthKeys = this.lastNMonths(months);
    const records = await this.prisma.utilityRecord.findMany({
      where: { roomId, billingMonth: { in: monthKeys } },
    });
    const byMonth = new Map(records.map(r => [r.billingMonth, r]));

    return monthKeys.map(billingMonth => {
      const r = byMonth.get(billingMonth);
      const currElec  = r?.currElec  ?? 0;
      const prevElec  = r?.prevElec  ?? 0;
      const currWater = r?.currWater ?? 0;
      const prevWater = r?.prevWater ?? 0;
      return {
        billingMonth,
        prevElec, currElec, prevWater, currWater,
        elecUsed:   Math.max(0, currElec - prevElec),
        waterUsed:  Math.max(0, currWater - prevWater),
        recordedAt: r?.recordedAt ?? null,
      };
    });
  }

  async record(roomId: string, dto: RecordDto, role: string) {
    const room = await this.prisma.room.findUnique({ where: { id: roomId } });
    if (!room) throw new NotFoundException('Không tìm thấy phòng.');

    const billingMonth = dto.billingMonth ?? this.currentBillingMonth();

    if (role === 'LANDLORD' && billingMonth !== this.currentBillingMonth()) {
      throw new ForbiddenException('Chủ trọ chỉ được cập nhật chỉ số điện nước của tháng hiện tại.');
    }

    const paidInvoice = await this.prisma.invoice.findFirst({
      where: { roomId, period: billingMonth, status: 'PAID' },
    });
    if (paidInvoice) {
      throw new BadRequestException('Hoá đơn kỳ này đã thanh toán, không thể sửa chỉ số điện nước.');
    }

    const prev = await this.prisma.utilityRecord.findFirst({
      where:   { roomId, billingMonth: { lt: billingMonth } },
      orderBy: { billingMonth: 'desc' },
    });
    const prevElec  = prev?.currElec  ?? 0;
    const prevWater = prev?.currWater ?? 0;
    const now       = new Date();

    const record = await this.prisma.utilityRecord.upsert({
      where:  { roomId_billingMonth: { roomId, billingMonth } },
      update: { prevElec, currElec: dto.currElec, prevWater, currWater: dto.currWater, recordedAt: now },
      create: { roomId, billingMonth, prevElec, currElec: dto.currElec, prevWater, currWater: dto.currWater, recordedAt: now },
    });
    this.events.emit('utility.recorded', { roomId, billingMonth });
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

  private lastNMonths(n: number): string[] {
    const out: string[] = [];
    const d = new Date();
    for (let i = n - 1; i >= 0; i--) {
      const dt = new Date(d.getFullYear(), d.getMonth() - i, 1);
      out.push(`${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`);
    }
    return out;
  }

  private mapRoom(room: any, username: string | null = null) {
    const tenant = room.contracts?.[0]?.tenant ?? null;
    return {
      roomId:       room.id,
      roomNumber:   room.roomNumber,
      floor:        room.floor,
      price:        room.price,
      status:       room.status,
      billingDay:   room.billingDay,
      tenant:       tenant ? {
        tenantId: tenant.id,
        fullName: tenant.fullName,
        username,
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
