import { type INestApplication } from '@nestjs/common';
import { type App } from 'supertest/types';
import request from 'supertest';
import { randomUUID } from 'crypto';

export interface TestUser {
  email: string;
  accessToken: string;
  refreshToken: string;
}

export async function createUser(app: INestApplication<App>): Promise<TestUser> {
  const email = `user-${randomUUID()}@gmail.com`;
  const password = 'test-password';

  // expect(201) here, so a failed sign-up fails at the source instead of as a 401 later.
  const res = await request(app.getHttpServer())
    .post('/api/auth/register')
    .send({ email, password })
    .expect(201);

  return {
    email,
    accessToken: res.body.accessToken,
    refreshToken: res.body.refreshToken,
  };
}
