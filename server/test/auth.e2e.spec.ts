import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { type App } from 'supertest/types';
import { DataSource, In } from 'typeorm';
import { UserEntity } from '../src/modules/user/user.entity';

async function createApp(): Promise<INestApplication<App>> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication<INestApplication<App>>();
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      disableErrorMessages: true,
      transform: true,
    }),
  );
  return app.init();
}

describe('Auth e2e', () => {
  let app: INestApplication<App>;
  let jwt: JwtService;

  const email = `user-${String(Date.now())}@mail.com`;
  const duplicateEmail = `user-dup-${String(Date.now())}@mail.com`;
  const password = 'test-password';

  let accessToken: string;
  let refreshToken: string;

  beforeAll(async () => {
    app = await createApp();
    jwt = app.get(JwtService);
  });

  afterAll(async () => {
    await app
      .get(DataSource)
      .getRepository(UserEntity)
      .delete({ email: In([email, duplicateEmail]) });
    await app.close();
  });

  describe('register', () => {
    it('Register user and return tokens', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email, password })
        .expect(201);

      expect(res.body).toEqual({
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
      });
    });

    it('Rejected duplicate email 409', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: duplicateEmail, password })
        .expect(201);

      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: duplicateEmail, password })
        .expect(409);
    });
  });

  describe('login', () => {
    it('Success login', async () => {
      const rs = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email, password })
        .expect(200);

      accessToken = rs.body.accessToken;
      refreshToken = rs.body.refreshToken;
    });

    it('Wrong password, 401 not BadRequest', async () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email, password: 'wrong-password' })
        .expect(401);
    });
  });

  describe('Protected routes', () => {
    it('Rejected if there is no Token', async () => {
      await request(app.getHttpServer()).get('/api/users/me').expect(401);
    });

    it('Check if user sign-in with wrong secret', async () => {
      const wrongToken = jwt.sign({ sub: 'someone', type: 'access' }, { secret: 'wrong-secret' });
      return request(app.getHttpServer())
        .get('/api/users/me')
        .set('Authorization', `Bearer ${wrongToken}`)
        .expect(401);
    });

    it('Reject as an expired Token', async () => {
      const expiredToken = jwt.sign({ sub: 'someone', type: 'access' }, { expiresIn: '-1s' });
      return request(app.getHttpServer())
        .get('/api/users/me')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);
    });

    it('Accept valid Token', async () => {
      return request(app.getHttpServer())
        .get('/api/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });
  });

  describe('refresh', () => {
    it('Issue new Token', async () => {
      const rs = await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(rs.body.refreshToken).toEqual(expect.any(String));

      await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(401);
    });
  });

  describe('Auth rate limit', () => {
    let app: INestApplication<App>;
    beforeAll(async () => {
      app = await createApp();
    });

    afterAll(async () => {
      await app.close();
    });

    it('Check limit', async () => {
      const attempts = (): request.Test =>
        request(app.getHttpServer()).post('/api/auth/login').send({
          email,
          password: 'wrong-password',
        });

      for (let i = 0; i < 5; i++) {
        await attempts().expect(401);
      }

      await attempts().expect(429);
    });
  });
});
