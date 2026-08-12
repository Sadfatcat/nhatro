import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/auth/roles.decorator';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import { assertOwnRoomOrManagement } from '../../common/auth/assert-own-room';
import { RequestUser } from '../../common/auth/jwt-payload.interface';
import { UtilitiesService } from './utilities.service';

interface ApiResponse<T> { success: boolean; data: T | null; message: string; }
const ok = <T>(data: T, msg = 'Thành công'): ApiResponse<T> => ({ success: true, data, message: msg });

const MANAGEMENT = ['ADMIN', 'LANDLORD'];

@ApiTags('utilities')
@Controller('utilities')
export class UtilitiesController {
  constructor(private readonly svc: UtilitiesService) {}

  @Roles(...MANAGEMENT)
  @Get()
  async findAll(): Promise<ApiResponse<unknown>> {
    return ok(await this.svc.findAll());
  }

  @Get(':roomId/history')
  async history(
    @Param('roomId') roomId: string,
    @CurrentUser() user: RequestUser,
    @Query('months') months?: string,
  ): Promise<ApiResponse<unknown>> {
    assertOwnRoomOrManagement(user, roomId);
    return ok(await this.svc.history(roomId, months ? Number(months) : 6));
  }

  @Get(':roomId')
  async findByRoom(
    @Param('roomId') roomId: string,
    @CurrentUser() user: RequestUser,
    @Query('month') month?: string,
  ): Promise<ApiResponse<unknown>> {
    assertOwnRoomOrManagement(user, roomId);
    return ok(await this.svc.findByRoom(roomId, month));
  }

  @Roles(...MANAGEMENT)
  @Post(':roomId/record')
  async record(
    @Param('roomId') roomId: string,
    @Body() body: { currElec: number; currWater: number; billingMonth?: string },
    @CurrentUser() user: RequestUser,
  ): Promise<ApiResponse<unknown>> {
    return ok(await this.svc.record(roomId, body, user.role), 'Đã chốt số điện nước thành công.');
  }

  @Roles(...MANAGEMENT)
  @Patch('bulk/billing-day')
  async setBillingDayBulk(
    @Body() body: { roomIds: string[]; billingDay: number },
  ): Promise<ApiResponse<unknown>> {
    return ok(await this.svc.setBillingDayBulk(body.roomIds, body.billingDay), 'Đã cập nhật ngày chốt.');
  }

  @Roles(...MANAGEMENT)
  @Patch(':roomId/billing-day')
  async setBillingDay(
    @Param('roomId') roomId: string,
    @Body() body: { billingDay: number },
  ): Promise<ApiResponse<unknown>> {
    return ok(await this.svc.setBillingDay(roomId, body.billingDay), 'Đã cập nhật ngày chốt.');
  }
}
