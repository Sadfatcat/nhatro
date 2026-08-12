import { Test } from '@nestjs/testing';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from '../../../apps/api/src/modules/auth/auth.service';
import { PrismaService } from '../../../apps/api/src/prisma/prisma.service';

const JWT_SECRET = 'test-secret-for-auth-service-spec';

describe('AuthService.login', () => {
  let service: AuthService;
  let jwt: JwtService;
  const findFirst = jest.fn();

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [JwtModule.register({ secret: JWT_SECRET, signOptions: { expiresIn: '2h' } })],
      providers: [
        AuthService,
        { provide: PrismaService, useValue: { user: { findFirst } } },
      ],
    }).compile();

    service = module.get(AuthService);
    jwt     = module.get(JwtService);
  });

  it('throws UnauthorizedException when no user matches the identifier', async () => {
    findFirst.mockResolvedValue(null);
    await expect(service.login({ identifier: 'ghost@nhatro.vn', password: 'anything123' }))
      .rejects.toThrow(UnauthorizedException);
  });

  it('throws UnauthorizedException when the user is deactivated', async () => {
    findFirst.mockResolvedValue({ id: '1', isActive: false, passwordHash: await bcrypt.hash('correct1', 10), role: 'ADMIN' });
    await expect(service.login({ identifier: 'x@nhatro.vn', password: 'correct1' }))
      .rejects.toThrow(UnauthorizedException);
  });

  it('throws UnauthorizedException on a wrong password, without leaking whether the account exists', async () => {
    findFirst.mockResolvedValue({ id: '1', isActive: true, passwordHash: await bcrypt.hash('correct1', 10), role: 'ADMIN' });
    await expect(service.login({ identifier: 'x@nhatro.vn', password: 'wrongpass' }))
      .rejects.toThrow(UnauthorizedException);
  });

  it('routes identifiers containing "@" to the email column, others to username', async () => {
    findFirst.mockResolvedValue(null);
    await service.login({ identifier: 'Foo@Bar.com', password: 'whatever1' }).catch(() => {});
    expect(findFirst).toHaveBeenCalledWith({ where: { email: 'foo@bar.com' } });

    findFirst.mockClear();
    await service.login({ identifier: 'PlainUser', password: 'whatever1' }).catch(() => {});
    expect(findFirst).toHaveBeenCalledWith({ where: { username: 'plainuser' } });
  });

  it('returns a JWT whose payload carries the real user id and role — not an inspectable/forgeable string', async () => {
    const user = {
      id: 'user-123', isActive: true, role: 'LANDLORD',
      passwordHash: await bcrypt.hash('correct1', 10),
      email: 'landlord@nhatro.vn', username: 'landlord1', fullName: 'Landlord One',
      phone: null, roomId: null, createdAt: new Date('2026-01-01'),
    };
    findFirst.mockResolvedValue(user);

    const result: any = await service.login({ identifier: 'landlord@nhatro.vn', password: 'correct1' });

    expect(result.role).toBe('LANDLORD');
    expect(result.user.id).toBe('user-123');
    // The token must not be a plain "role-in-plaintext" string — it has to be a real, signature-verifiable JWT.
    expect(result.token.split('.')).toHaveLength(3);
    const payload = jwt.verify(result.token);
    expect(payload).toMatchObject({ sub: 'user-123', role: 'LANDLORD' });
  });

  it('produces a token that fails verification once tampered with', async () => {
    findFirst.mockResolvedValue({
      id: 'user-1', isActive: true, role: 'ADMIN',
      passwordHash: await bcrypt.hash('correct1', 10),
      email: 'a@nhatro.vn', username: 'a', fullName: 'A', phone: null, roomId: null, createdAt: new Date(),
    });
    const result: any = await service.login({ identifier: 'a@nhatro.vn', password: 'correct1' });
    expect(() => jwt.verify(result.token + 'x')).toThrow();
  });
});
