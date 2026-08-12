import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/auth/roles.decorator';
import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';

interface ApiResponse<T> { success: boolean; data: T | null; message: string; }
const ok = <T>(data: T, msg = 'Thành công'): ApiResponse<T> => ({ success: true, data, message: msg });

const MANAGEMENT = ['ADMIN', 'LANDLORD'];

@Roles(...MANAGEMENT)
@ApiTags('tenants')
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenants: TenantsService) {}

  @Post()
  async create(@Body() dto: CreateTenantDto): Promise<ApiResponse<unknown>> {
    return ok(await this.tenants.create(dto), 'Đã thêm người thuê mới.');
  }

  @Get()
  async findAll(): Promise<ApiResponse<unknown>> {
    return ok(await this.tenants.findAll());
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ApiResponse<unknown>> {
    return ok(await this.tenants.findOne(id));
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateTenantDto): Promise<ApiResponse<unknown>> {
    return ok(await this.tenants.update(id, dto), 'Đã cập nhật thông tin người thuê.');
  }

  @Roles('ADMIN')
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<ApiResponse<null>> {
    await this.tenants.remove(id);
    return ok(null, 'Đã xoá người thuê.');
  }
}
