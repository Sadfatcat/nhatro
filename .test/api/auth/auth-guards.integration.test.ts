import { Test } from '@nestjs/testing';
import { Controller, Get, INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as request from 'supertest';
import { AuthCommonModule } from '../../../apps/api/src/common/auth/auth-common.module';
import { Public } from '../../../apps/api/src/common/auth/public.decorator';
import { Roles } from '../../../apps/api/src/common/auth/roles.decorator';

@Controller('test')
class DummyController {
  @Public()
  @Get('public')
  publicRoute() { return { ok: true }; }

  @Get('any-authenticated')
  anyAuthenticated() { return { ok: true }; }

  @Roles('ADMIN')
  @Get('admin-only')
  adminOnly() { return { ok: true }; }
}

// Exercises the REAL wiring — APP_GUARD registration, Reflector metadata resolution,
// decorator behavior — through actual HTTP requests, not just the guard classes in isolation.
describe('AuthGuard + RolesGuard wiring (integration)', () => {
  let app: INestApplication;
  let jwt: JwtService;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'integration-test-secret';
    const moduleRef = await Test.createTestingModule({
      imports:     [ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }), AuthCommonModule],
      controllers: [DummyController],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
    jwt = moduleRef.get(JwtService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('@Public() route works with no Authorization header', async () => {
    await request(app.getHttpServer()).get('/test/public').expect(200);
  });

  it('a normal route rejects with 401 when no token is sent', async () => {
    await request(app.getHttpServer()).get('/test/any-authenticated').expect(401);
  });

  it('a normal route (no @Roles()) accepts ANY authenticated role', async () => {
    const token = jwt.sign({ sub: 'u1', role: 'TENANT' });
    await request(app.getHttpServer())
      .get('/test/any-authenticated')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });

  it('an @Roles("ADMIN") route rejects a valid but insufficient role with 403', async () => {
    const token = jwt.sign({ sub: 'u1', role: 'LANDLORD' });
    await request(app.getHttpServer())
      .get('/test/admin-only')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
  });

  it('an @Roles("ADMIN") route accepts ADMIN', async () => {
    const token = jwt.sign({ sub: 'u1', role: 'ADMIN' });
    await request(app.getHttpServer())
      .get('/test/admin-only')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });

  it('rejects the old forgeable "db-token-admin-<ts>" format on a protected route', async () => {
    await request(app.getHttpServer())
      .get('/test/admin-only')
      .set('Authorization', 'Bearer db-token-admin-999999')
      .expect(401);
  });
});
