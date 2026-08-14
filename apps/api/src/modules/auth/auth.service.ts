import { BadRequestException, UnauthorizedException, Injectable, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

const TOKEN_TTL_MS = 2 * 60 * 60 * 1000;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt:    JwtService,
  ) {}

  async login(dto: LoginDto): Promise<unknown> {
    const id = dto.identifier.trim().toLowerCase();
    const user = await this.prisma.user.findFirst({
      where: id.includes('@') ? { email: id } : { username: id },
    });
    if (!user || !user.isActive) throw new UnauthorizedException('Tên đăng nhập hoặc mật khẩu không đúng.');

    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Tên đăng nhập hoặc mật khẩu không đúng.');

    const expiresAt = new Date(Date.now() + TOKEN_TTL_MS).toISOString();
    return {
      user: {
        id:        user.id,
        email:     user.email,
        username:  user.username,
        fullName:  user.fullName,
        role:      user.role,
        phone:     user.phone,
        roomId:    user.roomId,
        createdAt: user.createdAt.toISOString(),
      },
      token: this.jwt.sign({ sub: user.id, role: user.role, roomId: user.roomId ?? undefined }),
      expiresAt,
      isAuthenticated: true,
      role: user.role,
    };
  }

  async changeOwnPassword(userId: string, role: string, dto: ChangePasswordDto): Promise<void> {
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('Mật khẩu mới và xác nhận mật khẩu không khớp.');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Không tìm thấy tài khoản.');

    if (role !== 'ADMIN') {
      if (!dto.oldPassword) throw new BadRequestException('Vui lòng nhập mật khẩu cũ.');
      const ok = await bcrypt.compare(dto.oldPassword, user.passwordHash);
      if (!ok) throw new BadRequestException('Mật khẩu cũ không đúng.');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  }
}
