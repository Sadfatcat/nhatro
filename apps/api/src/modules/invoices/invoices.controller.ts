import { BadRequestException, Body, Controller, Get, Headers, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { InvoiceStatus } from '@prisma/client';
import { InvoicesService } from './invoices.service';
import { GenerateInvoiceDto } from './dto/generate-invoice.dto';
import { MarkPaidDto } from './dto/mark-paid.dto';
import { BulkMarkPaidDto } from './dto/bulk-mark-paid.dto';

interface ApiResponse<T> { success: boolean; data: T | null; message: string; }
const ok = <T>(data: T, msg = 'Thành công'): ApiResponse<T> => ({ success: true, data, message: msg });

function roleFromToken(auth?: string): string | null {
  if (!auth?.startsWith('Bearer ')) return null;
  const m = auth.slice(7).match(/^db-token-(\w+)-\d+$/);
  return m ? m[1].toUpperCase() : null;
}

function requireManagement(auth: string | undefined): void {
  const role = roleFromToken(auth);
  if (!role || role === 'TENANT' || role === 'GUEST') {
    throw new BadRequestException('Bạn không có quyền thực hiện thao tác này.');
  }
}

function requireAuth(auth: string | undefined): void {
  if (!roleFromToken(auth)) {
    throw new BadRequestException('Chưa xác thực.');
  }
}

@ApiTags('invoices')
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly svc: InvoicesService) {}

  @Post('generate')
  async generate(
    @Body() dto: GenerateInvoiceDto,
    @Headers('authorization') auth: string,
  ): Promise<ApiResponse<unknown>> {
    requireManagement(auth);
    return ok(await this.svc.generate(dto), 'Đã sinh hoá đơn.');
  }

  @Get()
  async findAll(
    @Headers('authorization') auth: string,
    @Query('status') status?: InvoiceStatus,
    @Query('period') period?: string,
    @Query('roomId') roomId?: string,
  ): Promise<ApiResponse<unknown>> {
    requireAuth(auth);
    return ok(await this.svc.findAll({ status, period, roomId }));
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Headers('authorization') auth: string,
  ): Promise<ApiResponse<unknown>> {
    requireAuth(auth);
    return ok(await this.svc.findOne(id));
  }

  @Patch(':id/mark-paid')
  async markPaid(
    @Param('id') id: string,
    @Body() dto: MarkPaidDto,
    @Headers('authorization') auth: string,
  ): Promise<ApiResponse<unknown>> {
    requireManagement(auth);
    return ok(await this.svc.markPaid(id, dto), 'Đã đánh dấu thanh toán.');
  }

  @Patch('bulk-mark-paid')
  async bulkMarkPaid(
    @Body() dto: BulkMarkPaidDto,
    @Headers('authorization') auth: string,
  ): Promise<ApiResponse<unknown>> {
    requireManagement(auth);
    return ok(await this.svc.bulkMarkPaid(dto), 'Đã đánh dấu thanh toán hàng loạt.');
  }
}
