import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UtilitiesService } from './utilities.service';

interface ApiResponse<T> { success: boolean; data: T | null; message: string; }
const ok = <T>(data: T, msg = 'Thành công'): ApiResponse<T> => ({ success: true, data, message: msg });

@ApiTags('utilities')
@Controller('utilities')
export class UtilitiesController {
  constructor(private readonly svc: UtilitiesService) {}

  @Get()
  async findAll(): Promise<ApiResponse<unknown>> {
    return ok(await this.svc.findAll());
  }

  @Get(':roomId')
  async findByRoom(@Param('roomId') roomId: string): Promise<ApiResponse<unknown>> {
    return ok(await this.svc.findByRoom(roomId));
  }

  @Post(':roomId/record')
  async record(
    @Param('roomId') roomId: string,
    @Body() body: { prevElec: number; currElec: number; prevWater: number; currWater: number },
  ): Promise<ApiResponse<unknown>> {
    return ok(await this.svc.record(roomId, body), 'Đã chốt số điện nước thành công.');
  }

  @Patch(':roomId/billing-day')
  async setBillingDay(
    @Param('roomId') roomId: string,
    @Body() body: { billingDay: number },
  ): Promise<ApiResponse<unknown>> {
    return ok(await this.svc.setBillingDay(roomId, body.billingDay), 'Đã cập nhật ngày chốt.');
  }
}
