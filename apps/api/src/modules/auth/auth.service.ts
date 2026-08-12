import { UnauthorizedException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';

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
}
