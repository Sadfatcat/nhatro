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
      where:  { status: InvoiceStatus.SENT, dueDate: { lt: new Date() }, mergedInvoiceId: null },
      select: { id: true },
    });
    if (overdue.length > 0) {
      await this.prisma.invoice.updateMany({
        where: { id: { in: overdue.map(i => i.id) } },
        data:  { status: InvoiceStatus.OVERDUE },
      });

      for (const invoice of overdue) {
        this.events.emit('invoice.overdue', { invoiceId: invoice.id });
      }
      this.logger.log(`Đã chuyển ${overdue.length} hoá đơn sang OVERDUE.`);
    }

    const overdueMerged = await this.prisma.mergedInvoice.findMany({
      where:  { status: InvoiceStatus.SENT, dueDate: { lt: new Date() } },
      select: { id: true },
    });
    if (overdueMerged.length) {
      await this.prisma.mergedInvoice.updateMany({
        where: { id: { in: overdueMerged.map(m => m.id) } },
        data:  { status: InvoiceStatus.OVERDUE },
      });
      for (const m of overdueMerged) {
        this.events.emit('merged-invoice.overdue', { mergedInvoiceId: m.id });
      }
    }
  }

  private buildInvoiceData(
    room:     { roomId: string; roomNumber: string; price: number },
    contract: { id: string },
    utility:  { prevElec: number; currElec: number; prevWater: number; currWater: number },
    period:   string,
    dueDate:  Date,
  ) {
    const { prevElec, currElec, prevWater, currWater } = utility;
    const elecUsed  = Math.max(0, currElec - prevElec);
    const waterUsed = Math.max(0, currWater - prevWater);

    const rentAmount        = room.price;
    const electricityAmount = Math.round(elecUsed * ELECTRICITY_PRICE_PER_KWH);
    const waterAmount       = Math.round(waterUsed * WATER_PRICE_PER_M3);
    const garbageFee        = TRASH_FEE_PER_ROOM;
    const otherFees         = 0;
    const deduction         = 0;
    const totalAmount       = rentAmount + electricityAmount + waterAmount + garbageFee + otherFees - deduction;

    return {
      roomId:            room.roomId,
      contractId:        contract.id,
      period,
      rentAmount,
      electricityAmount,
      waterAmount,
      garbageFee,
      otherFees,
      deduction,
      totalAmount,
      referenceCode:     this.buildReferenceCode(room.roomNumber, period),
      dueDate,
      prevElec,
      currElec,
      prevWater,
      currWater,
      elecUnitPrice:     ELECTRICITY_PRICE_PER_KWH,
      waterUnitPrice:    WATER_PRICE_PER_M3,
    };
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

      try {
        const invoice = await this.prisma.invoice.create({
          data: this.buildInvoiceData(room, contract, utility.utilityRecord, dto.period, dueDate),
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
   *  for that period if it doesn't exist yet; otherwise recalculates it, unless
   *  it's already PAID. */
  async syncInvoiceForPeriod(roomId: string, period: string): Promise<void> {
    const existing = await this.prisma.invoice.findFirst({ where: { roomId, period } });
    if (existing?.status === InvoiceStatus.PAID) {
      throw new BadRequestException('Hoá đơn kỳ này đã thanh toán, không thể sửa chỉ số điện nước.');
    }

    const utility = await this.utilities.findByRoom(roomId, period);
    if (!utility.utilityRecord || utility.utilityRecord.billingMonth !== period) return;

    if (!existing) {
      const room = await this.prisma.room.findUnique({ where: { id: roomId }, select: { id: true, roomNumber: true, price: true } });
      const contract = await this.contracts.findByRoom(roomId);
      if (!room || !contract) return;
      const roomForInvoice = { roomId: room.id, roomNumber: room.roomNumber, price: room.price };
      const dueDate = new Date(Date.now() + DEFAULT_DUE_DAYS * 24 * 60 * 60 * 1000);
      try {
        await this.prisma.invoice.create({
          data: this.buildInvoiceData(roomForInvoice, contract, utility.utilityRecord, period, dueDate),
        });
      } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') return;
        throw err;
      }
      return;
    }

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

  /** Same filter/pagination contract as findAll(), but merges MergedInvoice rows in place of
   *  their now-hidden child invoices — used by the paginated invoice-creation-log list only. */
  async findAllCombined(filter: InvoiceFilter & { sortBy?: string; sortDir?: 'asc' | 'desc' }) {
    const where: Prisma.InvoiceWhereInput = {
      status:          filter.status,
      period:          filter.period,
      roomId:          filter.roomIds?.length ? { in: filter.roomIds } : filter.roomId,
      contractId:      filter.contractId,
      mergedInvoiceId: null,
      notificationLogs: filter.notified === undefined ? undefined
        : filter.notified ? { some: {} } : { none: {} },
    };
    const include = {
      ...INCLUDE_ROOM,
      contract: { select: { tenant: { select: { fullName: true } } } },
      _count:   { select: { notificationLogs: true } },
    };

    type CombinedRow = {
      id: string; roomNumber: string; tenantName: string; period: string; totalAmount: number;
      status: InvoiceStatus; createdAt: Date; dueDate: Date; notified: boolean; kind: 'invoice' | 'merged';
    };

    const [invoices, mergedInvoices] = await Promise.all([
      this.prisma.invoice.findMany({ where, include }),
      this.prisma.mergedInvoice.findMany({
        where:   { period: filter.period },
        include: { tenant: { select: { fullName: true } } },
      }),
    ]);

    const combined: CombinedRow[] = [
      ...invoices.map(inv => ({
        id:          inv.id,
        roomNumber:  inv.room.roomNumber,
        tenantName:  inv.contract.tenant.fullName,
        period:      inv.period,
        totalAmount: inv.totalAmount,
        status:      inv.status,
        createdAt:   inv.createdAt,
        dueDate:     inv.dueDate,
        notified:    inv._count.notificationLogs > 0,
        kind:        'invoice' as const,
      })),
      ...mergedInvoices.map(m => ({
        id:          m.id,
        roomNumber:  m.roomLabel,
        tenantName:  m.tenant.fullName,
        period:      m.period,
        totalAmount: m.totalAmount,
        status:      m.status,
        createdAt:   m.createdAt,
        dueDate:     m.dueDate,
        notified:    false,
        kind:        'merged' as const,
      })),
    ];

    const dir = filter.sortDir === 'desc' ? -1 : 1;
    if (filter.sortBy === 'roomNumber') {
      combined.sort((a, b) => dir * a.roomNumber.localeCompare(b.roomNumber, 'vi', { numeric: true }));
    } else {
      combined.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    const total    = combined.length;
    const pageSize = filter.pageSize ?? 10;
    const page     = filter.page ?? 1;
    const items    = combined.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize);

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

    const updated = await this.prisma.$transaction(async tx => {
      const result = await tx.invoice.update({
        where: { id },
        data:  { rentAmount, electricityAmount, waterAmount, garbageFee, otherFees, deduction, totalAmount, dueDate },
      });

      if (invoice.mergedInvoiceId) {
        const siblings = await tx.invoice.findMany({ where: { mergedInvoiceId: invoice.mergedInvoiceId } });
        const mergedTotal   = siblings.reduce((sum, inv) => sum + inv.totalAmount, 0);
        const mergedDueDate = new Date(Math.max(...siblings.map(inv => inv.dueDate.getTime())));
        await tx.mergedInvoice.update({
          where: { id: invoice.mergedInvoiceId },
          data:  { totalAmount: mergedTotal, dueDate: mergedDueDate },
        });
      }

      return result;
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
    if (invoice.mergedInvoiceId) {
      throw new BadRequestException('Hoá đơn này đã được gộp — đánh dấu thanh toán ở hoá đơn gộp.');
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
      where:  { id: { in: dto.ids }, status: { not: InvoiceStatus.PAID }, mergedInvoiceId: null },
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
    if (invoice.mergedInvoiceId) {
      throw new BadRequestException('Hoá đơn này đã được gộp, không thể xoá riêng lẻ.');
    }
    await this.prisma.invoice.delete({ where: { id } });
  }

  private buildReferenceCode(roomNumber: string, period: string): string {
    const code       = roomNumber.replace(/[^a-zA-Z0-9]/g, '');
    const [year, month] = period.split('-');
    return `NT-${code}-${month}${year}`;
  }

  /** Groups un-merged, non-PAID invoices for a period by tenant — tenants renting
   *  more than one room are candidates for merging into a single invoice. */
  async getMergeSuggestions(period: string) {
    const invoices = await this.prisma.invoice.findMany({
      where:   { period, mergedInvoiceId: null, status: { not: InvoiceStatus.PAID } },
      include: { ...INCLUDE_ROOM, contract: { select: { tenantId: true, tenant: { select: { fullName: true } } } } },
    });

    const byTenant = new Map<string, { tenantId: string; tenantName: string; invoices: typeof invoices }>();
    for (const inv of invoices) {
      const tenantId = inv.contract.tenantId;
      const group = byTenant.get(tenantId) ?? { tenantId, tenantName: inv.contract.tenant.fullName, invoices: [] };
      group.invoices.push(inv);
      byTenant.set(tenantId, group);
    }

    return [...byTenant.values()]
      .filter(g => g.invoices.length >= 2)
      .map(g => ({
        tenantId:    g.tenantId,
        tenantName:  g.tenantName,
        totalAmount: g.invoices.reduce((sum, inv) => sum + inv.totalAmount, 0),
        invoices: g.invoices.map(inv => ({
          id:          inv.id,
          roomNumber:  inv.room.roomNumber,
          totalAmount: inv.totalAmount,
        })),
      }));
  }

  async mergeInvoices(invoiceIds: string[]): Promise<{ mergedInvoiceId: string }> {
    if (invoiceIds.length < 2) {
      throw new BadRequestException('Cần chọn ít nhất 2 hoá đơn để gộp.');
    }

    const invoices = await this.prisma.invoice.findMany({
      where:   { id: { in: invoiceIds } },
      include: { contract: { select: { tenantId: true } }, room: { select: { roomNumber: true } } },
    });
    if (invoices.length !== invoiceIds.length) {
      throw new BadRequestException('Một số hoá đơn không tồn tại.');
    }
    if (invoices.some(inv => inv.status === InvoiceStatus.PAID)) {
      throw new BadRequestException('Không thể gộp hoá đơn đã thanh toán.');
    }
    if (invoices.some(inv => inv.mergedInvoiceId !== null)) {
      throw new BadRequestException('Một số hoá đơn đã được gộp trước đó.');
    }
    const tenantIds = new Set(invoices.map(inv => inv.contract.tenantId));
    const periods    = new Set(invoices.map(inv => inv.period));
    if (tenantIds.size > 1) {
      throw new BadRequestException('Chỉ có thể gộp hoá đơn của cùng một người thuê.');
    }
    if (periods.size > 1) {
      throw new BadRequestException('Chỉ có thể gộp hoá đơn cùng một kỳ.');
    }

    const totalAmount = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const [tenantId]  = tenantIds;
    const [period]    = periods;
    const dueDate     = new Date(Math.max(...invoices.map(inv => inv.dueDate.getTime())));
    const roomLabel   = this.buildRoomLabel(invoices.map(inv => inv.room.roomNumber));

    const merged = await this.prisma.$transaction(async tx => {
      const mergedInvoice = await tx.mergedInvoice.create({
        data: { tenantId, period, totalAmount, dueDate, roomLabel },
      });
      const result = await tx.invoice.updateMany({
        where: { id: { in: invoiceIds }, mergedInvoiceId: null, status: { not: InvoiceStatus.PAID } },
        data:  { mergedInvoiceId: mergedInvoice.id },
      });
      if (result.count !== invoiceIds.length) {
        throw new BadRequestException('Một số hoá đơn đã được gộp hoặc thanh toán trong lúc xử lý — thử lại.');
      }
      return mergedInvoice;
    });

    return { mergedInvoiceId: merged.id };
  }

  private buildRoomLabel(roomNumbers: string[]): string {
    const parsed = roomNumbers.map(rn => {
      const m = rn.match(/^P-(\d+)$/);
      return m ? { num: parseInt(m[1], 10) } : null;
    });
    if (parsed.every(p => p !== null)) {
      const nums = parsed.map(p => p!.num).sort((a, b) => a - b);
      return `P-${nums.join('-')}`;
    }
    return [...roomNumbers].sort((a, b) => a.localeCompare(b, 'vi', { numeric: true })).join('-');
  }

  async getMergedInvoice(id: string) {
    const merged = await this.prisma.mergedInvoice.findUnique({
      where:   { id },
      include: {
        invoices: {
          select: {
            id: true, period: true, rentAmount: true, electricityAmount: true, waterAmount: true,
            garbageFee: true, otherFees: true, deduction: true, totalAmount: true,
            prevElec: true, currElec: true, prevWater: true, currWater: true,
            elecUnitPrice: true, waterUnitPrice: true, dueDate: true, referenceCode: true, status: true,
            room: { select: { roomNumber: true } },
          },
        },
      },
    });
    if (!merged) throw new NotFoundException('Không tìm thấy hoá đơn gộp.');
    return {
      ...merged,
      bankInfo: {
        bankName:          this.config.get<string>('LANDLORD_BANK_NAME') ?? null,
        bankAccountNumber: this.config.get<string>('LANDLORD_BANK_ACCOUNT_NUMBER') ?? null,
        bankAccountName:   this.config.get<string>('LANDLORD_BANK_ACCOUNT_NAME') ?? null,
      },
    };
  }

  async markMergedInvoicePaid(mergedInvoiceId: string, userId: string) {
    const merged = await this.prisma.mergedInvoice.findUnique({ where: { id: mergedInvoiceId } });
    if (!merged) throw new NotFoundException('Không tìm thấy hoá đơn gộp.');
    if (merged.status === InvoiceStatus.PAID) {
      throw new BadRequestException('Hoá đơn gộp này đã được đánh dấu thanh toán.');
    }

    const markedBy = await this.resolveUserDisplayName(userId);
    await this.prisma.$transaction([
      this.prisma.mergedInvoice.update({
        where: { id: mergedInvoiceId },
        data:  { status: InvoiceStatus.PAID, paidAt: new Date() },
      }),
      this.prisma.invoice.updateMany({
        where: { mergedInvoiceId },
        data:  { status: InvoiceStatus.PAID, paidAt: new Date(), markedBy },
      }),
    ]);
  }
}
