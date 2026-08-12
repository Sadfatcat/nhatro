import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { InvoiceStatus } from '@prisma/client';
import { Roles } from '../../common/auth/roles.decorator';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import { assertOwnRoomOrManagement } from '../../common/auth/assert-own-room';
import { RequestUser } from '../../common/auth/jwt-payload.interface';
import { ContractsService } from '../contracts/contracts.service';
import { InvoicesService } from './invoices.service';
import { GenerateInvoiceDto } from './dto/generate-invoice.dto';
import { MarkPaidDto } from './dto/mark-paid.dto';
import { BulkMarkPaidDto } from './dto/bulk-mark-paid.dto';

interface ApiResponse<T> { success: boolean; data: T | null; message: string; }
const ok = <T>(data: T, msg = 'Thành công'): ApiResponse<T> => ({ success: true, data, message: msg });

const MANAGEMENT = ['ADMIN', 'LANDLORD'];

@ApiTags('invoices')
@Controller('invoices')
export class InvoicesController {
  constructor(
    private readonly svc: InvoicesService,
    private readonly contracts: ContractsService,
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
  ): Promise<ApiResponse<unknown>> {
    let contractId: string | undefined;
    if (user.role === 'TENANT') {
      if (roomId) assertOwnRoomOrManagement(user, roomId);
      roomId = user.roomId ?? '__none__'; // no room assigned → must not see every invoice in the system

      // Accounts stay attached to the room across tenant turnover (password reset, not a new
      // account) — scope to the CURRENT active contract so an incoming tenant can't see the
      // previous occupant's invoice history for the same room.
      const contract = await this.contracts.findByRoom(roomId);
      contractId = contract?.id ?? '__none__';
    }
    return ok(await this.svc.findAll({ status, period, roomId, contractId }));
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: RequestUser): Promise<ApiResponse<unknown>> {
    const invoice = await this.svc.findOne(id);
    assertOwnRoomOrManagement(user, invoice.roomId);
    return ok(invoice);
  }

  @Roles(...MANAGEMENT)
  @Patch(':id/mark-paid')
  async markPaid(@Param('id') id: string, @Body() dto: MarkPaidDto): Promise<ApiResponse<unknown>> {
    return ok(await this.svc.markPaid(id, dto), 'Đã đánh dấu thanh toán.');
  }

  @Roles(...MANAGEMENT)
  @Patch('bulk-mark-paid')
  async bulkMarkPaid(@Body() dto: BulkMarkPaidDto): Promise<ApiResponse<unknown>> {
    return ok(await this.svc.bulkMarkPaid(dto), 'Đã đánh dấu thanh toán hàng loạt.');
  }

  @Roles(...MANAGEMENT)
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<ApiResponse<null>> {
    await this.svc.remove(id);
    return ok(null, 'Đã xoá hoá đơn.');
  }
}
