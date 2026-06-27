import { expect, it } from 'vitest';
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/test';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.JWT_SECRET = 'test-secret-with-more-than-thirty-two-characters';
it('exposes authentication routes', async () => {
  const { buildApp } = await import('../src/app.js');
  const app = await buildApp();
  const routes = app.printRoutes();
  expect(routes).toContain('/api/auth/register');
  expect(routes).toContain('/api/auth/login');
  expect(routes).toContain('/api/users/me');
  await app.close();
});
