import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateTenantDto } from './dto/update-tenant.dto';

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const tenants = await this.prisma.tenant.findMany({ orderBy: { fullName: 'asc' } });

    const contracts = await this.prisma.contract.findMany({
      where:   { status: 'ACTIVE', tenantId: { in: tenants.map(t => t.id) } },
      orderBy: { startDate: 'desc' },
      include: { room: { select: { id: true, roomNumber: true, price: true } } },
    });
    const roomByTenantId = new Map(contracts.map(c => [c.tenantId, c.room]));

    return tenants.map(t => {
      const room = roomByTenantId.get(t.id) ?? null;
      return {
        tenantId: t.id,
        fullName: t.fullName,
        phone:    t.phone,
        room:     room ? { roomId: room.id, roomNumber: room.roomNumber, price: room.price } : null,
      };
    });
  }

  async findOne(id: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) throw new NotFoundException('Không tìm thấy người thuê.');
    return tenant;
  }

  async update(id: string, dto: UpdateTenantDto) {
    await this.findOne(id);
    return this.prisma.tenant.update({
      where: { id },
      data: {
        fullName:             dto.fullName,
        phone:                dto.phone,
        dateOfBirth:          dto.dateOfBirth !== undefined ? (dto.dateOfBirth ? new Date(dto.dateOfBirth) : null) : undefined,
        hometown:             dto.hometown,
        nationalId:           dto.nationalId,
        tenantIdDate:         dto.tenantIdDate,
        nationalIdIssuePlace: dto.nationalIdIssuePlace,
      },
    });
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
