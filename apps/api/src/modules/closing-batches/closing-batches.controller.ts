import { Controller, Get, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiResponse, ok } from '../../common/api-response';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import { RequestUser } from '../../common/auth/jwt-payload.interface';
import { Roles } from '../../common/auth/roles.decorator';
import { MANAGEMENT_ROLES } from '../../common/auth/roles.constants';
import { ClosingBatchesService } from './closing-batches.service';

@Roles(...MANAGEMENT_ROLES)
@ApiTags('closing-batches')
@Controller('closing-batches')
export class ClosingBatchesController {
  constructor(private readonly svc: ClosingBatchesService) {}

  @Post()
  async complete(@CurrentUser() user: RequestUser): Promise<ApiResponse<unknown>> {
    return ok(await this.svc.complete(user.id), 'Đã hoàn tất chốt.');
  }

  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('period') period?: string,
  ): Promise<ApiResponse<unknown>> {
    return ok(await this.svc.findAll(Number(page), Number(pageSize), period));
  }
}
