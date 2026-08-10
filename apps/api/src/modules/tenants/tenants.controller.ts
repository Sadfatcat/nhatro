import { BadRequestException, Body, Controller, Delete, Get, Headers, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';

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

@ApiTags('tenants')
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenants: TenantsService) {}

  @Post()
  async create(
    @Body() dto: CreateTenantDto,
    @Headers('authorization') auth: string,
  ): Promise<ApiResponse<unknown>> {
    requireManagement(auth);
    return ok(await this.tenants.create(dto), 'Đã thêm người thuê mới.');
  }

  @Get()
  async findAll(@Headers('authorization') auth: string): Promise<ApiResponse<unknown>> {
    requireManagement(auth);
    return ok(await this.tenants.findAll());
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Headers('authorization') auth: string,
  ): Promise<ApiResponse<unknown>> {
    requireManagement(auth);
    return ok(await this.tenants.findOne(id));
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTenantDto,
    @Headers('authorization') auth: string,
  ): Promise<ApiResponse<unknown>> {
    requireManagement(auth);
    return ok(await this.tenants.update(id, dto), 'Đã cập nhật thông tin người thuê.');
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Headers('authorization') auth: string,
  ): Promise<ApiResponse<null>> {
    requireManagement(auth);
    await this.tenants.remove(id);
    return ok(null, 'Đã xoá người thuê.');
  }
}
