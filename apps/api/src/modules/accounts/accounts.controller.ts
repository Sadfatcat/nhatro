import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AccountsService } from './accounts.service';
import { CreateLandlordAccountDto } from './dto/create-landlord-account.dto';
import { CreateRoomAccountDto } from './dto/create-room-account.dto';

@ApiTags('accounts')
@Controller('accounts')
export class AccountsController {
  constructor(private readonly accounts: AccountsService) {}

  @Get()
  list(): Promise<unknown> {
    return this.accounts.listAccounts();
  }

  @Post('rooms')
  createRoomAccount(@Body() dto: CreateRoomAccountDto): Promise<unknown> {
    return this.accounts.createRoomAccount(dto);
  }

  @Post('landlords')
  createLandlordAccount(@Body() dto: CreateLandlordAccountDto): Promise<unknown> {
    return this.accounts.createLandlordAccount(dto);
  }

  @Get('rooms/:roomId/credentials')
  getRoomCredentials(@Param('roomId') roomId: string): Promise<unknown> {
    return this.accounts.getRoomCredentials(roomId);
  }

  @Patch('rooms/:roomId/password')
  changeRoomPassword(
    @Param('roomId') roomId: string,
    @Body() body: { password: string },
  ): Promise<unknown> {
    return this.accounts.changeRoomPassword(roomId, body.password);
  }

  @Patch('rooms/:roomId/price')
  updateRoomPrice(
    @Param('roomId') roomId: string,
    @Body() body: { price: number },
  ): Promise<unknown> {
    return this.accounts.updateRoomPrice(roomId, body.price);
  }

  @Patch('rooms/:roomId/status')
  updateRoomStatus(
    @Param('roomId') roomId: string,
    @Body() body: { status: string },
  ): Promise<unknown> {
    return this.accounts.updateRoomStatus(roomId, body.status);
  }

  @Patch('rooms/:roomId/tenant-info')
  updateTenantInfo(
    @Param('roomId') roomId: string,
    @Body() body: { fullName?: string; phone?: string; dateOfBirth?: string | null; hometown?: string | null; nationalId?: string | null },
  ): Promise<unknown> {
    return this.accounts.updateTenantInfo(roomId, body);
  }

  @Delete('tenants/:tenantId')
  async deleteTenant(@Param('tenantId') tenantId: string): Promise<unknown> {
    await this.accounts.deleteTenant(tenantId);
    return { success: true, data: null, message: 'Đã xoá tài khoản người thuê.' };
  }

  @Patch('users/:userId/password')
  async changePassword(
    @Param('userId') userId: string,
    @Body() body: { password: string },
  ): Promise<unknown> {
    await this.accounts.changePassword(userId, body.password);
    return { success: true, data: null, message: 'Đã đổi mật khẩu thành công.' };
  }
}
