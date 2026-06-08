import {
  BadRequestException, Body, Controller, Delete, Get,
  Headers, Param, Patch, Post, Query, Res, UploadedFile, UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { ContractsService } from './contracts.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';

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

function requireAdmin(auth: string | undefined): void {
  if (roleFromToken(auth) !== 'ADMIN') {
    throw new BadRequestException('Bạn không có quyền thực hiện thao tác này.');
  }
}

@ApiTags('contracts')
@Controller('contracts')
export class ContractsController {
  constructor(private readonly svc: ContractsService) {}

  @Get()
  async findAll(): Promise<ApiResponse<unknown>> {
    return ok(await this.svc.findAll());
  }

  @Get('room/:roomId')
  async findByRoom(@Param('roomId') roomId: string): Promise<ApiResponse<unknown>> {
    return ok(await this.svc.findByRoom(roomId));
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ApiResponse<unknown>> {
    return ok(await this.svc.findOne(id));
  }

  @Post('preview')
  async preview(
    @Body() dto: CreateContractDto,
    @Headers('authorization') auth: string,
  ): Promise<ApiResponse<unknown>> {
    requireManagement(auth);
    return ok(await this.svc.preview(dto), 'Xem trước hợp đồng thành công.');
  }

  @Post()
  async create(
    @Body() dto: CreateContractDto,
    @Headers('authorization') auth: string,
  ): Promise<ApiResponse<unknown>> {
    requireManagement(auth);
    return ok(await this.svc.create(dto), 'Đã tạo hợp đồng thành công.');
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateContractDto,
    @Headers('authorization') auth: string,
  ): Promise<ApiResponse<unknown>> {
    requireAdmin(auth);
    return ok(await this.svc.update(id, dto), 'Đã cập nhật hợp đồng.');
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Headers('authorization') auth: string,
  ): Promise<ApiResponse<unknown>> {
    requireManagement(auth);
    return ok(await this.svc.remove(id), 'Đã xoá hợp đồng.');
  }

  @Get(':id/download')
  async download(
    @Param('id') id: string,
    @Query('token') queryToken: string | undefined,
    @Headers('authorization') authHeader: string | undefined,
    @Res() res: Response,
  ): Promise<void> {
    const token = authHeader?.replace('Bearer ', '') ?? queryToken;
    if (!token) throw new BadRequestException('Chưa xác thực.');
    const { buffer, filename } = await this.svc.getFile(id);
    res.set({
      'Content-Type':        'application/pdf',
      'Content-Disposition': `inline; filename="${encodeURIComponent(filename)}"`,
      'Content-Length':      String(buffer.length),
      'X-Frame-Options':     'SAMEORIGIN',
    });
    res.end(buffer);
  }

  @Post(':id/upload')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  async upload(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Headers('authorization') auth: string,
  ): Promise<ApiResponse<unknown>> {
    requireManagement(auth);
    if (!file) throw new BadRequestException('Chưa chọn tệp.');
    return ok(await this.svc.replaceFile(id, file), 'Đã cập nhật tệp hợp đồng.');
  }
}
