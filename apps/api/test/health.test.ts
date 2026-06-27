import { expect, it } from 'vitest';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/test';
process.env.REDIS_URL = 'redis://localhost:6379';

it('registers the health route', async () => {
  const { buildApp } = await import('../src/app.js');
  const app = await buildApp();
  app.prisma.$queryRaw = async () => 1 as never;
  app.redis.ping = async () => 'PONG';
  const response = await app.inject({ method: 'GET', url: '/api/health' });
  expect(response.statusCode).toBe(200);
  expect(response.json()).toMatchObject({ status: 'ok', service: 'api' });
  await app.close();
});
