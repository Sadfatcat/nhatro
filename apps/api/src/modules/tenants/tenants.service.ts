import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTenantDto) {
    if (dto.nationalId) {
      const duplicate = await this.prisma.tenant.findFirst({ where: { nationalId: dto.nationalId } });
      if (duplicate) {
        throw new ConflictException(`Đã tồn tại người thuê trùng CCCD: ${duplicate.fullName}`);
      }
    }
    try {
      return await this.prisma.tenant.create({
        data: {
          fullName:             dto.fullName,
          phone:                dto.phone,
          email:                dto.email,
          dateOfBirth:          dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
          hometown:             dto.hometown,
          nationalId:           dto.nationalId,
          tenantIdDate:         dto.tenantIdDate,
          nationalIdIssuePlace: dto.nationalIdIssuePlace,
        },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('CCCD này đã được sử dụng bởi người thuê khác.');
      }
      throw err;
    }
  }

  async findAll() {
    const tenants = await this.prisma.tenant.findMany({ orderBy: { fullName: 'asc' } });

    const contracts = await this.prisma.contract.findMany({
      where:   { status: 'ACTIVE', tenantId: { in: tenants.map(t => t.id) } },
      orderBy: { startDate: 'desc' },
      include: { room: { select: { id: true, roomNumber: true, price: true } } },
    });
    const roomsByTenantId = new Map<string, { roomId: string; roomNumber: string; price: number }[]>();
    for (const c of contracts) {
      const rooms = roomsByTenantId.get(c.tenantId) ?? [];
      rooms.push({ roomId: c.room.id, roomNumber: c.room.roomNumber, price: c.room.price });
      roomsByTenantId.set(c.tenantId, rooms);
    }

    return tenants.map(t => ({
      tenantId: t.id,
      fullName: t.fullName,
      phone:    t.phone,
      rooms:    roomsByTenantId.get(t.id) ?? [],
    }));
  }

  async findOne(id: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) throw new NotFoundException('Không tìm thấy người thuê.');
    return tenant;
  }

  async update(id: string, dto: UpdateTenantDto) {
    await this.findOne(id);
    try {
      return await this.prisma.tenant.update({
        where: { id },
        data: {
          fullName:             dto.fullName,
          phone:                dto.phone,
          email:                dto.email,
          dateOfBirth:          dto.dateOfBirth !== undefined ? (dto.dateOfBirth ? new Date(dto.dateOfBirth) : null) : undefined,
          hometown:             dto.hometown,
          nationalId:           dto.nationalId,
          tenantIdDate:         dto.tenantIdDate,
          nationalIdIssuePlace: dto.nationalIdIssuePlace,
        },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('CCCD này đã được sử dụng bởi người thuê khác.');
      }
      throw err;
    }
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    const linkedContract = await this.prisma.contract.findFirst({ where: { tenantId: id } });
    if (linkedContract) {
      throw new BadRequestException('Người thuê này còn hợp đồng liên kết — kết thúc hợp đồng trước khi xoá.');
    }
    await this.prisma.tenant.delete({ where: { id } });
  }
}
