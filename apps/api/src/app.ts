import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import helmet from '@fastify/helmet';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { config } from './config.js';
import { prismaPlugin } from './plugins/prisma.js';
import { redisPlugin } from './plugins/redis.js';
import { healthRoutes } from './routes/health.js';
import { authPlugin } from './auth/hooks.js';
import { authRoutes } from './routes/auth.js';
import { userRoutes } from './routes/users.js';

export async function buildApp() {
  const app = Fastify({ logger: { level: config.NODE_ENV === 'test' ? 'silent' : 'info' } });
  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(cors, { origin: config.CORS_ORIGIN, credentials: true });
  await app.register(rateLimit, { max: config.RATE_LIMIT_MAX, timeWindow: config.RATE_LIMIT_WINDOW });
  await app.register(swagger, { openapi: { info: { title: 'BackTest AI API', version: '0.1.0' } } });
  await app.register(swaggerUi, { routePrefix: '/docs' });
  await app.register(prismaPlugin);
  await app.register(redisPlugin);
  await app.register(authPlugin);
  await app.register(healthRoutes, { prefix: '/api' });
  await app.register(authRoutes, { prefix: '/api' });
  await app.register(userRoutes, { prefix: '/api' });
  return app;
}
