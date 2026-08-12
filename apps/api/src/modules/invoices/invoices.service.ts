import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma, InvoiceStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { RoomsService } from '../rooms/rooms.service';
import { ContractsService } from '../contracts/contracts.service';
import { UtilitiesService } from '../utilities/utilities.service';
import { GenerateInvoiceDto } from './dto/generate-invoice.dto';
import { MarkPaidDto } from './dto/mark-paid.dto';
import { BulkMarkPaidDto } from './dto/bulk-mark-paid.dto';

interface InvoiceFilter {
  status?: InvoiceStatus;
  period?: string;
  roomId?: string;
  contractId?: string;
}

const INCLUDE_ROOM = { room: { select: { roomNumber: true, floor: true } } };

const ELECTRICITY_PRICE_PER_KWH = 3500;
const WATER_PRICE_PER_M3        = 30000;
const TRASH_FEE_PER_ROOM        = 50000;
const DEFAULT_DUE_DAYS          = 5;

@Injectable()
export class InvoicesService {
  private readonly logger = new Logger(InvoicesService.name);

  constructor(
    private readonly prisma:     PrismaService,
    private readonly rooms:      RoomsService,
    private readonly contracts:  ContractsService,
    private readonly utilities:  UtilitiesService,
    private readonly events:     EventEmitter2,
    private readonly config:     ConfigService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async checkOverdue(): Promise<void> {
    const overdue = await this.prisma.invoice.findMany({
      where:  { status: InvoiceStatus.SENT, dueDate: { lt: new Date() } },
      select: { id: true },
    });
    if (overdue.length === 0) return;

    await this.prisma.invoice.updateMany({
      where: { id: { in: overdue.map(i => i.id) } },
      data:  { status: InvoiceStatus.OVERDUE },
    });

    for (const invoice of overdue) {
      this.events.emit('invoice.overdue', { invoiceId: invoice.id });
    }
    this.logger.log(`Đã chuyển ${overdue.length} hoá đơn sang OVERDUE.`);
  }

  async generate(dto: GenerateInvoiceDto) {
    const allRooms  = await this.rooms.findAll();
    const targetIds = dto.roomIds?.length ? new Set(dto.roomIds) : null;
    const rooms     = allRooms.filter(r =>
      r.status === 'OCCUPIED' && (!targetIds || targetIds.has(r.roomId)),
    );

    const dueDate = dto.dueDate
      ? new Date(dto.dueDate)
      : new Date(Date.now() + DEFAULT_DUE_DAYS * 24 * 60 * 60 * 1000);

    const created: unknown[] = [];
    const skipped: { roomId: string; roomNumber: string; reason: string }[] = [];

    for (const room of rooms) {
      const contract = await this.contracts.findByRoom(room.roomId);
      if (!contract) {
        skipped.push({ roomId: room.roomId, roomNumber: room.roomNumber, reason: 'Không có hợp đồng đang hiệu lực.' });
        continue;
      }

      const utility = await this.utilities.findByRoom(room.roomId, dto.period);
      if (!utility.utilityRecord || utility.utilityRecord.billingMonth !== dto.period) {
        skipped.push({ roomId: room.roomId, roomNumber: room.roomNumber, reason: 'Chưa chốt số điện nước cho kỳ này.' });
        continue;
      }

      const { prevElec, currElec, prevWater, currWater } = utility.utilityRecord;
      const elecUsed  = Math.max(0, currElec - prevElec);
      const waterUsed = Math.max(0, currWater - prevWater);

      const rentAmount        = room.price;
      const electricityAmount = Math.round(elecUsed * ELECTRICITY_PRICE_PER_KWH);
      const waterAmount       = Math.round(waterUsed * WATER_PRICE_PER_M3);
      const otherFees         = TRASH_FEE_PER_ROOM;
      const totalAmount       = rentAmount + electricityAmount + waterAmount + otherFees;

      try {
        const invoice = await this.prisma.invoice.create({
          data: {
            roomId:            room.roomId,
            contractId:        contract.id,
            period:            dto.period,
            rentAmount,
            electricityAmount,
            waterAmount,
            otherFees,
            totalAmount,
            referenceCode:     this.buildReferenceCode(room.roomNumber, dto.period),
            dueDate,
            prevElec:          prevElec,
            currElec:          currElec,
            prevWater:         prevWater,
            currWater:         currWater,
            elecUnitPrice:     ELECTRICITY_PRICE_PER_KWH,
            waterUnitPrice:    WATER_PRICE_PER_M3,
          },
        });
        created.push(invoice);
      } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
          skipped.push({ roomId: room.roomId, roomNumber: room.roomNumber, reason: 'Hoá đơn kỳ này đã tồn tại.' });
          continue;
        }
        throw err;
      }
    }

    if (created.length === 0 && skipped.length === 0) {
      throw new BadRequestException('Không có phòng nào đang thuê để sinh hoá đơn.');
    }

    return { created, skipped };
  }

  /** Called when a utility reading is (re)saved for a period. Creates the invoice
   *  if none exists yet for that period, or recalculates an existing non-PAID one. */
  async syncInvoiceForPeriod(roomId: string, period: string): Promise<void> {
    const existing = await this.prisma.invoice.findFirst({ where: { roomId, period } });
    if (!existing) {
      await this.generate({ period, roomIds: [roomId] });
      return;
    }
    if (existing.status === InvoiceStatus.PAID) {
      throw new BadRequestException('Hoá đơn kỳ này đã thanh toán, không thể sửa chỉ số điện nước.');
    }

    const utility = await this.utilities.findByRoom(roomId, period);
    if (!utility.utilityRecord || utility.utilityRecord.billingMonth !== period) return;

    const { prevElec, currElec, prevWater, currWater } = utility.utilityRecord;
    const elecUsed           = Math.max(0, currElec - prevElec);
    const waterUsed          = Math.max(0, currWater - prevWater);
    const electricityAmount  = Math.round(elecUsed * ELECTRICITY_PRICE_PER_KWH);
    const waterAmount        = Math.round(waterUsed * WATER_PRICE_PER_M3);
    const totalAmount        = existing.rentAmount + electricityAmount + waterAmount + existing.otherFees;

    await this.prisma.invoice.update({
      where: { id: existing.id },
      data: {
        prevElec, currElec, prevWater, currWater,
        electricityAmount, waterAmount, totalAmount,
        elecUnitPrice:  ELECTRICITY_PRICE_PER_KWH,
        waterUnitPrice: WATER_PRICE_PER_M3,
      },
    });
  }

  async findDueSoon(daysAhead: number): Promise<{ id: string }[]> {
    const target = new Date();
    target.setDate(target.getDate() + daysAhead);
    const startOfDay = new Date(target);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(target);
    endOfDay.setHours(23, 59, 59, 999);

    return this.prisma.invoice.findMany({
      where:  { status: InvoiceStatus.SENT, dueDate: { gte: startOfDay, lte: endOfDay } },
      select: { id: true },
    });
  }

  async findAll(filter: InvoiceFilter) {
    return this.prisma.invoice.findMany({
      where:   { status: filter.status, period: filter.period, roomId: filter.roomId, contractId: filter.contractId },
      include: INCLUDE_ROOM,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const invoice = await this.prisma.invoice.findUnique({ where: { id }, include: INCLUDE_ROOM });
    if (!invoice) throw new NotFoundException('Không tìm thấy hoá đơn.');
    return {
      ...invoice,
      bankInfo: {
        bankName:          this.config.get<string>('LANDLORD_BANK_NAME') ?? null,
        bankAccountNumber: this.config.get<string>('LANDLORD_BANK_ACCOUNT_NUMBER') ?? null,
        bankAccountName:   this.config.get<string>('LANDLORD_BANK_ACCOUNT_NAME') ?? null,
      },
    };
  }

  async markPaid(id: string, dto: MarkPaidDto) {
    const invoice = await this.prisma.invoice.findUnique({ where: { id } });
    if (!invoice) throw new NotFoundException('Không tìm thấy hoá đơn.');
    if (invoice.status === InvoiceStatus.PAID) {
      throw new BadRequestException('Hoá đơn này đã được đánh dấu thanh toán.');
    }
    const updated = await this.prisma.invoice.update({
      where: { id },
      data:  { status: InvoiceStatus.PAID, paidAt: new Date(), markedBy: dto.markedBy ?? null },
    });
    this.events.emit('invoice.paid', { invoiceId: updated.id });
    return updated;
  }

  async bulkMarkPaid(dto: BulkMarkPaidDto) {
    const toUpdate = await this.prisma.invoice.findMany({
      where:  { id: { in: dto.ids }, status: { not: InvoiceStatus.PAID } },
      select: { id: true },
    });
    const result = await this.prisma.invoice.updateMany({
      where: { id: { in: toUpdate.map(i => i.id) } },
      data:  { status: InvoiceStatus.PAID, paidAt: new Date(), markedBy: dto.markedBy ?? null },
    });
    for (const invoice of toUpdate) {
      this.events.emit('invoice.paid', { invoiceId: invoice.id });
    }
    return { updated: result.count };
  }

  async remove(id: string): Promise<void> {
    const invoice = await this.prisma.invoice.findUnique({ where: { id } });
    if (!invoice) throw new NotFoundException('Không tìm thấy hoá đơn.');
    if (invoice.status === InvoiceStatus.PAID) {
      throw new BadRequestException('Không thể xoá hoá đơn đã thanh toán.');
    }
    await this.prisma.invoice.delete({ where: { id } });
  }

  private buildReferenceCode(roomNumber: string, period: string): string {
    const code       = roomNumber.replace(/[^a-zA-Z0-9]/g, '');
    const [year, month] = period.split('-');
    return `NT-${code}-${month}${year}`;
  }
}
