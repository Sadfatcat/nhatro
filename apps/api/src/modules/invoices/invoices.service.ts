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
import { BulkMarkPaidDto } from './dto/bulk-mark-paid.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';

interface InvoiceFilter {
  status?: InvoiceStatus;
  period?: string;
  roomId?: string;
  roomIds?: string[];
  contractId?: string;
  notified?: boolean;
  page?: number;
  pageSize?: number;
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
      const garbageFee        = TRASH_FEE_PER_ROOM;
      const otherFees         = 0;
      const deduction         = 0;
      const totalAmount       = rentAmount + electricityAmount + waterAmount + garbageFee + otherFees - deduction;

      try {
        const invoice = await this.prisma.invoice.create({
          data: {
            roomId:            room.roomId,
            contractId:        contract.id,
            period:            dto.period,
            rentAmount,
            electricityAmount,
            waterAmount,
            garbageFee,
            otherFees,
            deduction,
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

  /** Called when a utility reading is (re)saved for a period. Recalculates an
   *  existing non-PAID invoice for that period; does not create new invoices. */
  async syncInvoiceForPeriod(roomId: string, period: string): Promise<void> {
    const existing = await this.prisma.invoice.findFirst({ where: { roomId, period } });
    if (!existing) return;
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
    const totalAmount        = existing.rentAmount + electricityAmount + waterAmount + existing.garbageFee + existing.otherFees - existing.deduction;

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
    const where: Prisma.InvoiceWhereInput = {
      status:     filter.status,
      period:     filter.period,
      roomId:     filter.roomIds?.length ? { in: filter.roomIds } : filter.roomId,
      contractId: filter.contractId,
      notificationLogs: filter.notified === undefined ? undefined
        : filter.notified ? { some: {} } : { none: {} },
    };
    const include = {
      ...INCLUDE_ROOM,
      contract: { select: { tenant: { select: { fullName: true } } } },
      _count:   { select: { notificationLogs: true } },
    };

    if (!filter.page) {
      return this.prisma.invoice.findMany({ where, include, orderBy: { createdAt: 'desc' } });
    }

    const pageSize = filter.pageSize ?? 10;
    const page     = filter.page;
    const [items, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where, include,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.invoice.count({ where }),
    ]);
    return { items, total };
  }

  async getDashboardStats() {
    const currentPeriod = this.currentBillingPeriod();
    const trendPeriods  = this.lastNBillingPeriods(6);

    const [pending, currentIncome, trendGrouped, recent] = await Promise.all([
      this.prisma.invoice.aggregate({
        where: { status: { in: [InvoiceStatus.SENT, InvoiceStatus.OVERDUE] } },
        _sum:   { totalAmount: true },
        _count: true,
      }),
      this.prisma.invoice.aggregate({
        where: { status: InvoiceStatus.PAID, period: currentPeriod },
        _sum: { totalAmount: true },
      }),
      this.prisma.invoice.groupBy({
        by:    ['period'],
        where: { status: InvoiceStatus.PAID, period: { in: trendPeriods } },
        _sum:  { totalAmount: true, rentAmount: true },
      }),
      this.prisma.invoice.findMany({
        take:    5,
        orderBy: { createdAt: 'desc' },
        include: { ...INCLUDE_ROOM, contract: { select: { tenant: { select: { fullName: true } } } } },
      }),
    ]);

    const trendByPeriod = new Map(trendGrouped.map(g => [g.period, g._sum]));
    const incomeTrend = trendPeriods.map(period => ({
      period,
      totalIncome: trendByPeriod.get(period)?.totalAmount ?? 0,
      rentIncome:  trendByPeriod.get(period)?.rentAmount  ?? 0,
    }));

    return {
      pendingAmount:      pending._sum.totalAmount ?? 0,
      unpaidCount:        pending._count,
      currentMonthIncome: currentIncome._sum.totalAmount ?? 0,
      incomeTrend,
      recentInvoices: recent.map(inv => ({
        id:          inv.id,
        roomNumber:  inv.room.roomNumber,
        tenantName:  inv.contract.tenant.fullName,
        totalAmount: inv.totalAmount,
        status:      inv.status,
        createdAt:   inv.createdAt,
      })),
    };
  }

  /** Billing period runs 11th of month N to 10th of month N+1 — see utilities.service.ts. */
  private currentBillingPeriod(): string {
    const d = new Date();
    const dt = new Date(d.getFullYear(), d.getDate() <= 10 ? d.getMonth() - 1 : d.getMonth(), 1);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
  }

  private lastNBillingPeriods(n: number): string[] {
    const out: string[] = [];
    const d    = new Date();
    const base = new Date(d.getFullYear(), d.getDate() <= 10 ? d.getMonth() - 1 : d.getMonth(), 1);
    for (let i = n - 1; i >= 0; i--) {
      const dt = new Date(base.getFullYear(), base.getMonth() - i, 1);
      out.push(`${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`);
    }
    return out;
  }

  async findOne(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where:   { id },
      include: {
        ...INCLUDE_ROOM,
        notificationLogs: { orderBy: { sentAt: 'desc' } },
        editLogs:         { orderBy: { editedAt: 'desc' } },
      },
    });
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

  async update(id: string, dto: UpdateInvoiceDto, userId: string) {
    const invoice = await this.prisma.invoice.findUnique({ where: { id } });
    if (!invoice) throw new NotFoundException('Không tìm thấy hoá đơn.');
    if (invoice.status === InvoiceStatus.PAID) {
      throw new BadRequestException('Hoá đơn đã thanh toán, không thể sửa.');
    }

    const rentAmount        = dto.rentAmount        ?? invoice.rentAmount;
    const electricityAmount = dto.electricityAmount ?? invoice.electricityAmount;
    const waterAmount       = dto.waterAmount        ?? invoice.waterAmount;
    const garbageFee        = dto.garbageFee         ?? invoice.garbageFee;
    const otherFees         = dto.otherFees          ?? invoice.otherFees;
    const deduction         = dto.deduction          ?? invoice.deduction;
    const totalAmount       = rentAmount + electricityAmount + waterAmount + garbageFee + otherFees - deduction;
    const dueDate           = dto.dueDate ? new Date(dto.dueDate) : invoice.dueDate;

    const changes: Record<string, { from: unknown; to: unknown }> = {};
    if (dto.rentAmount        !== undefined && dto.rentAmount        !== invoice.rentAmount)        changes.rentAmount        = { from: invoice.rentAmount,        to: dto.rentAmount };
    if (dto.electricityAmount !== undefined && dto.electricityAmount !== invoice.electricityAmount) changes.electricityAmount = { from: invoice.electricityAmount, to: dto.electricityAmount };
    if (dto.waterAmount       !== undefined && dto.waterAmount       !== invoice.waterAmount)        changes.waterAmount       = { from: invoice.waterAmount,       to: dto.waterAmount };
    if (dto.garbageFee        !== undefined && dto.garbageFee        !== invoice.garbageFee)         changes.garbageFee        = { from: invoice.garbageFee,        to: dto.garbageFee };
    if (dto.otherFees         !== undefined && dto.otherFees         !== invoice.otherFees)          changes.otherFees         = { from: invoice.otherFees,         to: dto.otherFees };
    if (dto.deduction         !== undefined && dto.deduction         !== invoice.deduction)          changes.deduction         = { from: invoice.deduction,         to: dto.deduction };
    if (dto.dueDate           !== undefined && dueDate.getTime()     !== invoice.dueDate.getTime())  changes.dueDate           = { from: invoice.dueDate,           to: dueDate };

    const updated = await this.prisma.invoice.update({
      where: { id },
      data:  { rentAmount, electricityAmount, waterAmount, garbageFee, otherFees, deduction, totalAmount, dueDate },
    });

    if (Object.keys(changes).length > 0) {
      const editedBy = await this.resolveUserDisplayName(userId);
      await this.prisma.invoiceEditLog.create({
        data: { invoiceId: id, editedBy, changes: changes as Prisma.InputJsonValue },
      });
    }

    return updated;
  }

  async markPaid(id: string, userId: string) {
    const invoice = await this.prisma.invoice.findUnique({ where: { id } });
    if (!invoice) throw new NotFoundException('Không tìm thấy hoá đơn.');
    if (invoice.status === InvoiceStatus.PAID) {
      throw new BadRequestException('Hoá đơn này đã được đánh dấu thanh toán.');
    }
    const markedBy = await this.resolveUserDisplayName(userId);
    const updated = await this.prisma.invoice.update({
      where: { id },
      data:  { status: InvoiceStatus.PAID, paidAt: new Date(), markedBy },
    });
    this.events.emit('invoice.paid', { invoiceId: updated.id });
    return updated;
  }

  async bulkMarkPaid(dto: BulkMarkPaidDto, userId: string) {
    const toUpdate = await this.prisma.invoice.findMany({
      where:  { id: { in: dto.ids }, status: { not: InvoiceStatus.PAID } },
      select: { id: true },
    });
    const markedBy = await this.resolveUserDisplayName(userId);
    const result = await this.prisma.invoice.updateMany({
      where: { id: { in: toUpdate.map(i => i.id) } },
      data:  { status: InvoiceStatus.PAID, paidAt: new Date(), markedBy },
    });
    for (const invoice of toUpdate) {
      this.events.emit('invoice.paid', { invoiceId: invoice.id });
    }
    return { updated: result.count };
  }

  /** Resolves the display name for an audit field (markedBy/editedBy) from the
   *  JWT-authenticated user id — never trusts a client-supplied name. */
  private async resolveUserDisplayName(userId: string): Promise<string | null> {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { fullName: true } });
    return user?.fullName ?? null;
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
