import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '../../../apps/api/src/common/auth/auth.guard';

const SECRET = 'test-secret-for-auth-guard-spec';

function fakeContext(headers: Record<string, string>, isPublic = false): ExecutionContext {
  const req: any = { headers };
  return {
    switchToHttp: () => ({ getRequest: () => req }),
    getHandler:   () => (isPublic ? { __isPublic: true } : {}),
    getClass:     () => ({}),
  } as unknown as ExecutionContext;
}

describe('AuthGuard', () => {
  const jwt = new JwtService({ secret: SECRET, signOptions: { expiresIn: '2h' } });
  const reflector = new Reflector();
  let guard: AuthGuard;

  beforeEach(() => {
    guard = new AuthGuard(jwt, reflector);
  });

  it('rejects a request with no Authorization header', () => {
    expect(() => guard.canActivate(fakeContext({}))).toThrow(UnauthorizedException);
  });

  it('rejects a header that is not a Bearer token', () => {
    expect(() => guard.canActivate(fakeContext({ authorization: 'Basic abc123' }))).toThrow(UnauthorizedException);
  });

  it('rejects the old forgeable "db-token-<role>-<ts>" format entirely — it is not valid JWT syntax', () => {
    expect(() => guard.canActivate(fakeContext({ authorization: 'Bearer db-token-admin-999999' })))
      .toThrow(UnauthorizedException);
  });

  it('rejects a token signed with a different secret (forged)', () => {
    const forged = new JwtService({ secret: 'attacker-secret' }).sign({ sub: 'x', role: 'ADMIN' });
    expect(() => guard.canActivate(fakeContext({ authorization: `Bearer ${forged}` })))
      .toThrow(UnauthorizedException);
  });

  it('rejects an expired token', () => {
    const expired = jwt.sign({ sub: 'x', role: 'ADMIN' }, { expiresIn: '-1s' });
    expect(() => guard.canActivate(fakeContext({ authorization: `Bearer ${expired}` })))
      .toThrow(UnauthorizedException);
  });

  it('accepts a valid token and attaches { id, role } onto req.user', () => {
    const token = jwt.sign({ sub: 'user-42', role: 'LANDLORD' });
    const ctx = fakeContext({ authorization: `Bearer ${token}` });
    expect(guard.canActivate(ctx)).toBe(true);
    const req = (ctx.switchToHttp().getRequest as any)();
    expect(req.user).toEqual({ id: 'user-42', role: 'LANDLORD' });
  });

  it('bypasses verification entirely when the route is marked @Public()', () => {
    const spy = jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
    expect(guard.canActivate(fakeContext({}))).toBe(true);
    spy.mockRestore();
  });
});
