import { Body, Controller, Delete, forwardRef, Get, Inject, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { InvoiceStatus } from '@prisma/client';
import { Roles } from '../../common/auth/roles.decorator';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import { assertOwnRoomOrManagement } from '../../common/auth/assert-own-room';
import { RequestUser } from '../../common/auth/jwt-payload.interface';
import { ContractsService } from '../contracts/contracts.service';
import { NotificationsService } from '../notifications/notifications.service';
import { InvoicesService } from './invoices.service';
import { GenerateInvoiceDto } from './dto/generate-invoice.dto';
import { BulkMarkPaidDto } from './dto/bulk-mark-paid.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { MergeInvoicesDto } from './dto/merge-invoices.dto';

interface ApiResponse<T> { success: boolean; data: T | null; message: string; }
const ok = <T>(data: T, msg = 'Thành công'): ApiResponse<T> => ({ success: true, data, message: msg });

const MANAGEMENT = ['ADMIN', 'LANDLORD'];

@ApiTags('invoices')
@Controller('invoices')
export class InvoicesController {
  constructor(
    private readonly svc: InvoicesService,
    private readonly contracts: ContractsService,
    @Inject(forwardRef(() => NotificationsService))
    private readonly notifications: NotificationsService,
  ) {}

  @Roles(...MANAGEMENT)
  @Post('generate')
  async generate(@Body() dto: GenerateInvoiceDto): Promise<ApiResponse<unknown>> {
    return ok(await this.svc.generate(dto), 'Đã sinh hoá đơn.');
  }

  @Get()
  async findAll(
    @CurrentUser() user: RequestUser,
    @Query('status') status?: InvoiceStatus,
    @Query('period') period?: string,
    @Query('roomId') roomId?: string,
    @Query('roomIds') roomIdsCsv?: string,
    @Query('notified') notifiedRaw?: string,
    @Query('page') pageRaw?: string,
    @Query('pageSize') pageSizeRaw?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortDir') sortDir?: string,
  ): Promise<ApiResponse<unknown>> {
    let contractId: string | undefined;
    let roomIds = roomIdsCsv ? roomIdsCsv.split(',').filter(Boolean) : undefined;
    if (user.role === 'TENANT') {
      if (roomId) assertOwnRoomOrManagement(user, roomId);
      roomId = user.roomId ?? '__none__'; // no room assigned → must not see every invoice in the system
      roomIds = undefined; // tenant can never multi-select other rooms

      // Accounts stay attached to the room across tenant turnover (password reset, not a new
      // account) — scope to the CURRENT active contract so an incoming tenant can't see the
      // previous occupant's invoice history for the same room.
      const contract = await this.contracts.findByRoom(roomId);
      contractId = contract?.id ?? '__none__';
    }
    const notified = notifiedRaw === undefined ? undefined : notifiedRaw === 'true';
    const page     = pageRaw ? parseInt(pageRaw, 10) : undefined;
    const pageSize = pageSizeRaw ? parseInt(pageSizeRaw, 10) : undefined;
    if (page !== undefined) {
      return ok(await this.svc.findAllCombined({
        status, period, roomId, roomIds, contractId, notified, page, pageSize,
        sortBy, sortDir: sortDir === 'desc' ? 'desc' : sortDir === 'asc' ? 'asc' : undefined,
      }));
    }
    return ok(await this.svc.findAll({ status, period, roomId, roomIds, contractId, notified, page, pageSize }));
  }

  @Roles(...MANAGEMENT)
  @Get('stats/dashboard')
  async dashboardStats(): Promise<ApiResponse<unknown>> {
    return ok(await this.svc.getDashboardStats());
  }

  @Roles('ADMIN')
  @Get('merge-suggestions')
  async mergeSuggestions(@Query('period') period: string): Promise<ApiResponse<unknown>> {
    return ok(await this.svc.getMergeSuggestions(period));
  }

  @Roles('ADMIN')
  @Post('merge')
  async merge(@Body() dto: MergeInvoicesDto): Promise<ApiResponse<unknown>> {
    return ok(await this.svc.mergeInvoices(dto.invoiceIds), 'Đã gộp hoá đơn.');
  }

  @Roles(...MANAGEMENT)
  @Get('merged/:id')
  async getMerged(@Param('id') id: string): Promise<ApiResponse<unknown>> {
    return ok(await this.svc.getMergedInvoice(id));
  }

  @Roles(...MANAGEMENT)
  @Post('merged/:id/notify')
  async notifyMerged(@Param('id') id: string): Promise<ApiResponse<unknown>> {
    const result = await this.notifications.sendMergedInvoice(id);
    return ok(result, result.success ? 'Đã gửi thông báo.' : (result.reason ?? 'Gửi thông báo thất bại.'));
  }

  @Roles(...MANAGEMENT)
  @Patch('merged/:id/pay')
  async markMergedPaid(@Param('id') id: string, @CurrentUser() user: RequestUser): Promise<ApiResponse<unknown>> {
    return ok(await this.svc.markMergedInvoicePaid(id, user.id), 'Đã đánh dấu thanh toán hoá đơn gộp.');
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: RequestUser): Promise<ApiResponse<unknown>> {
    const invoice = await this.svc.findOne(id);
    assertOwnRoomOrManagement(user, invoice.roomId);
    return ok(invoice);
  }

  @Roles(...MANAGEMENT)
  @Patch('bulk-mark-paid')
  async bulkMarkPaid(@Body() dto: BulkMarkPaidDto, @CurrentUser() user: RequestUser): Promise<ApiResponse<unknown>> {
    return ok(await this.svc.bulkMarkPaid(dto, user.id), 'Đã đánh dấu thanh toán hàng loạt.');
  }

  @Roles(...MANAGEMENT)
  @Patch(':id/mark-paid')
  async markPaid(@Param('id') id: string, @CurrentUser() user: RequestUser): Promise<ApiResponse<unknown>> {
    return ok(await this.svc.markPaid(id, user.id), 'Đã đánh dấu thanh toán.');
  }

  @Roles(...MANAGEMENT)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateInvoiceDto, @CurrentUser() user: RequestUser): Promise<ApiResponse<unknown>> {
    return ok(await this.svc.update(id, dto, user.id), 'Đã cập nhật hoá đơn.');
  }

  @Roles(...MANAGEMENT)
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<ApiResponse<null>> {
    await this.svc.remove(id);
    return ok(null, 'Đã xoá hoá đơn.');
  }
}
