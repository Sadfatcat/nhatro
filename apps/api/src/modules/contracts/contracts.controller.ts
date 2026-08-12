import {
  BadRequestException, Body, Controller, Delete, Get,
  Param, Patch, Post, Res, UploadedFile, UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { Roles } from '../../common/auth/roles.decorator';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import { assertOwnRoomOrManagement } from '../../common/auth/assert-own-room';
import { RequestUser } from '../../common/auth/jwt-payload.interface';
import { ContractsService } from './contracts.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';

interface ApiResponse<T> { success: boolean; data: T | null; message: string; }
const ok = <T>(data: T, msg = 'Thành công'): ApiResponse<T> => ({ success: true, data, message: msg });

const MANAGEMENT = ['ADMIN', 'LANDLORD'];

@ApiTags('contracts')
@Controller('contracts')
export class ContractsController {
  constructor(private readonly svc: ContractsService) {}

  @Roles(...MANAGEMENT)
  @Get()
  async findAll(): Promise<ApiResponse<unknown>> {
    return ok(await this.svc.findAll());
  }

  @Get('room/:roomId')
  async findByRoom(
    @Param('roomId') roomId: string,
    @CurrentUser() user: RequestUser,
  ): Promise<ApiResponse<unknown>> {
    assertOwnRoomOrManagement(user, roomId);
    return ok(await this.svc.findByRoom(roomId));
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: RequestUser): Promise<ApiResponse<unknown>> {
    const contract = await this.svc.findOne(id);
    assertOwnRoomOrManagement(user, contract.room.roomId);
    return ok(contract);
  }

  @Roles(...MANAGEMENT)
  @Post('preview')
  async preview(@Body() dto: CreateContractDto): Promise<ApiResponse<unknown>> {
    return ok(await this.svc.preview(dto), 'Xem trước hợp đồng thành công.');
  }

  @Roles(...MANAGEMENT)
  @Post()
  async create(@Body() dto: CreateContractDto): Promise<ApiResponse<unknown>> {
    return ok(await this.svc.create(dto), 'Đã tạo hợp đồng thành công.');
  }

  @Roles('ADMIN')
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateContractDto): Promise<ApiResponse<unknown>> {
    return ok(await this.svc.update(id, dto), 'Đã cập nhật hợp đồng.');
  }

  @Roles('ADMIN')
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<ApiResponse<unknown>> {
    return ok(await this.svc.remove(id), 'Đã xoá hợp đồng.');
  }

  @Get(':id/download')
  async download(@Param('id') id: string, @CurrentUser() user: RequestUser, @Res() res: Response): Promise<void> {
    const contract = await this.svc.findOne(id);
    assertOwnRoomOrManagement(user, contract.room.roomId);
    const { buffer, filename } = await this.svc.getFile(id);
    res.set({
      'Content-Type':        'application/pdf',
      'Content-Disposition': `inline; filename="${encodeURIComponent(filename)}"`,
      'Content-Length':      String(buffer.length),
      'X-Frame-Options':     'SAMEORIGIN',
    });
    res.end(buffer);
  }

  @Roles(...MANAGEMENT)
  @Post(':id/upload')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  async upload(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ApiResponse<unknown>> {
    if (!file) throw new BadRequestException('Chưa chọn tệp.');
    return ok(await this.svc.replaceFile(id, file), 'Đã cập nhật tệp hợp đồng.');
  }
}
