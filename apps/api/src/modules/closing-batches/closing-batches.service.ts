import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { currentBillingPeriod } from '../../common/billing-period';
import { PrismaService } from '../../prisma/prisma.service';
import { InvoicesService } from '../invoices/invoices.service';

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE     = 50;

@Injectable()
export class ClosingBatchesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly invoices: InvoicesService,
  ) {}

  /** Turns every room in the closing list into one permanent batch and empties the list. */
  async complete(closedBy: string) {
    const period = currentBillingPeriod();
    const rooms  = await this.prisma.room.findMany({
      where:  { inClosingList: true },
      select: { id: true, roomNumber: true, utilityRecords: { where: { billingMonth: period }, select: { id: true } } },
    });
    if (rooms.length === 0) throw new BadRequestException('Danh sách phòng cần chốt đang trống.');

    const roomsWithoutReading = rooms
      .filter(r => r.utilityRecords.length === 0)
      .map(r => r.roomNumber)
      .sort((a, b) => a.localeCompare(b, 'vi', { numeric: true }));
    if (roomsWithoutReading.length > 0) {
      throw new BadRequestException(`Chưa chốt số điện nước kỳ ${period} cho phòng: ${roomsWithoutReading.join(', ')}.`);
    }

    const roomIds           = rooms.map(r => r.id);
    const invoiceIdByRoomId = await this.findOrCreateInvoiceIdByRoomId(roomIds, period);

    return this.prisma.$transaction(async tx => {
      const { count } = await tx.room.updateMany({
        where: { id: { in: roomIds }, inClosingList: true },
        data:  { inClosingList: false },
      });
      if (count !== roomIds.length) throw new ConflictException('Danh sách phòng cần chốt vừa thay đổi, vui lòng thử lại.');

      return tx.closingBatch.create({
        data: {
          period,
          closedBy,
          items: { create: roomIds.map(roomId => ({ roomId, invoiceId: invoiceIdByRoomId.get(roomId) ?? null })) },
        },
        include: { items: true },
      });
    });
  }

  async findAll(page?: number, pageSize?: number, period?: string) {
    const take = Math.min(Math.max(pageSize || DEFAULT_PAGE_SIZE, 1), MAX_PAGE_SIZE);
    const skip = (Math.max(page || 1, 1) - 1) * take;
    const where = period ? { period } : {};

    const [total, batches] = await Promise.all([
      this.prisma.closingBatch.count({ where }),
      this.prisma.closingBatch.findMany({
        where,
        orderBy: { closedAt: 'desc' },
        skip,
        take,
        include: {
          items: {
            include: {
              room: { select: { roomNumber: true } },
              invoice: {
                select: {
                  id: true, status: true, totalAmount: true, dueDate: true, mergedInvoiceId: true,
                  contract:         { select: { tenant: { select: { fullName: true } } } },
                  notificationLogs: { orderBy: { sentAt: 'desc' }, select: { success: true, reason: true } },
                },
              },
            },
          },
        },
      }),
    ]);

    const items = batches.map(batch => ({
      id:       batch.id,
      period:   batch.period,
      closedAt: batch.closedAt,
      rooms:    batch.items
        .map(({ roomId, room, invoice }) => {
          const logs = invoice?.notificationLogs ?? [];
          const sent = logs.some(log => log.success);
          return {
            roomId,
            roomNumber:      room.roomNumber,
            tenantName:      invoice?.contract.tenant.fullName ?? null,
            invoiceId:       invoice?.id ?? null,
            invoiceStatus:   invoice?.status ?? null,
            totalAmount:     invoice?.totalAmount ?? null,
            dueDate:         invoice?.dueDate ?? null,
            mergedInvoiceId: invoice?.mergedInvoiceId ?? null,
            sent,
            lastFailReason:  sent ? null : logs.find(log => !log.success)?.reason ?? null,
          };
        })
        .sort((a, b) => a.roomNumber.localeCompare(b.roomNumber, 'vi', { numeric: true })),
    }));

    return { items, total };
  }

  /** Invoices are normally created by the `utility.recorded` event; sync here covers any not created yet. */
  private async findOrCreateInvoiceIdByRoomId(roomIds: string[], period: string): Promise<Map<string, string>> {
    const findExisting = () => this.prisma.invoice.findMany({ where: { roomId: { in: roomIds }, period }, select: { id: true, roomId: true } });

    const existing = await findExisting();
    const roomIdsWithoutInvoice = roomIds.filter(id => !existing.some(inv => inv.roomId === id));
    if (roomIdsWithoutInvoice.length === 0) return new Map(existing.map(inv => [inv.roomId, inv.id]));

    for (const roomId of roomIdsWithoutInvoice) await this.invoices.syncInvoiceForPeriod(roomId, period);
    return new Map((await findExisting()).map(inv => [inv.roomId, inv.id]));
  }
}
