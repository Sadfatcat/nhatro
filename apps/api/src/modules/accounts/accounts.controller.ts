import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AccountsService } from './accounts.service';
import { CreateLandlordAccountDto } from './dto/create-landlord-account.dto';

@ApiTags('accounts')
@Controller('accounts')
export class AccountsController {
  constructor(private readonly accounts: AccountsService) {}

  @Get()
  list(): Promise<unknown> {
    return this.accounts.listAccounts();
  }

  @Post('landlords')
  createLandlordAccount(@Body() dto: CreateLandlordAccountDto): Promise<unknown> {
    return this.accounts.createLandlordAccount(dto);
  }

  @Patch('users/:userId/role')
  async changeUserRole(
    @Param('userId') userId: string,
    @Body() body: { role: 'LANDLORD' | 'ADMIN' },
  ): Promise<unknown> {
    await this.accounts.changeUserRole(userId, body.role);
    return { success: true, data: null, message: 'Đã cập nhật vai trò thành công.' };
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
