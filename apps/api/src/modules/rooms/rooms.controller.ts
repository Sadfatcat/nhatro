import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RoomsService } from './rooms.service';

interface ApiResponse<T> { success: boolean; data: T | null; message: string; }

function ok<T>(data: T, message = 'Thành công'): ApiResponse<T> {
  return { success: true, data, message };
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

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<ApiResponse<null>> {
    await this.rooms.remove(id);
    return ok(null, 'Xoá phòng thành công');
  }
}
