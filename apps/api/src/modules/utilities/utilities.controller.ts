import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/auth/roles.decorator';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import { assertOwnRoomOrManagement } from '../../common/auth/assert-own-room';
import { RequestUser } from '../../common/auth/jwt-payload.interface';
import { SetClosingListDto } from './dto/set-closing-list.dto';
import { UtilitiesService } from './utilities.service';
import { ApiResponse, ok } from '../../common/api-response';
import { MANAGEMENT_ROLES } from '../../common/auth/roles.constants';

@ApiTags('utilities')
@Controller('utilities')
export class UtilitiesController {
  constructor(private readonly svc: UtilitiesService) {}

  @Roles(...MANAGEMENT_ROLES)
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

  @Roles(...MANAGEMENT_ROLES)
  @Post(':roomId/record')
  async record(
    @Param('roomId') roomId: string,
    @Body() body: { currElec: number; currWater: number; billingMonth?: string },
    @CurrentUser() user: RequestUser,
  ): Promise<ApiResponse<unknown>> {
    return ok(await this.svc.record(roomId, body, user.role), 'Đã chốt số điện nước thành công.');
  }

  @Roles(...MANAGEMENT_ROLES)
  @Patch('closing-list')
  async setClosingList(@Body() body: SetClosingListDto): Promise<ApiResponse<unknown>> {
    return ok(await this.svc.setClosingList(body.roomIds, body.add), 'Đã cập nhật danh sách phòng cần chốt.');
  }
}
