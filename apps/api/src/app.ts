import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import helmet from '@fastify/helmet';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { ZodError } from 'zod';
import { config } from './config.js';
import { prismaPlugin } from './plugins/prisma.js';
import { redisPlugin } from './plugins/redis.js';
import { healthRoutes } from './routes/health.js';
import { authPlugin } from './auth/hooks.js';
import { authRoutes } from './routes/auth.js';
import { userRoutes } from './routes/users.js';
import { strategyRoutes } from './routes/strategy.js';

export async function buildApp() {
  const app = Fastify({ logger: { level: config.NODE_ENV === 'test' ? 'silent' : 'info' } });
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof ZodError) {
      return reply.code(400).send({
        message: error.issues[0]?.message ?? 'Invalid request',
        issues: error.issues,
      });
    }
    request.log.error(error);
    const normalized = error as { statusCode?: number; message?: string };
    return reply.code(normalized.statusCode ?? 500).send({ message: normalized.message ?? 'Internal Server Error' });
  });
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
  await app.register(strategyRoutes, { prefix: '/api' });
  return app;
}
