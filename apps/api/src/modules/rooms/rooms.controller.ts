import { BadRequestException, Body, Controller, Get, Headers, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RoomsService } from './rooms.service';

interface ApiResponse<T> { success: boolean; data: T | null; message: string; }

function ok<T>(data: T, message = 'Thành công'): ApiResponse<T> {
  return { success: true, data, message };
}

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

@ApiTags('rooms')
@Controller('rooms')
export class RoomsController {
  constructor(private readonly rooms: RoomsService) {}

  @Get()
  async findAll(): Promise<ApiResponse<unknown>> {
    return ok(await this.rooms.findAll());
  }

  @Post()
  async create(@Body() body: { roomNumber: string; floor: number; price: number; status?: string }): Promise<ApiResponse<unknown>> {
    return ok(await this.rooms.create(body), 'Tạo phòng thành công');
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: { roomNumber?: string; floor?: number; price?: number; status?: string }): Promise<ApiResponse<unknown>> {
    return ok(await this.rooms.update(id, body), 'Cập nhật phòng thành công');
  }

  @Get(':id/account')
  async getAccount(@Param('id') id: string): Promise<ApiResponse<unknown>> {
    return ok(await this.rooms.getAccount(id));
  }

  @Patch(':id/password')
  async changePassword(
    @Param('id') id: string,
    @Body() body: { password: string },
    @Headers('authorization') auth: string,
  ): Promise<ApiResponse<null>> {
    requireManagement(auth);
    await this.rooms.changePassword(id, body.password);
    return ok(null, 'Đã đổi mật khẩu phòng thành công.');
  }
}
