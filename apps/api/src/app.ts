import Fastify from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { config } from './config.js';
import { prismaPlugin } from './plugins/prisma.js';
import { redisPlugin } from './plugins/redis.js';
import { healthRoutes } from './routes/health.js';
import { strategyRoutes } from './routes/strategies.js';
export async function buildApp() { const app = Fastify({ logger: true }); await app.register(cors, { origin: config.corsOrigin }); await app.register(swagger, { openapi: { info: { title: 'BackTest AI API', version: '0.1.0' } } }); await app.register(swaggerUi, { routePrefix: '/docs' }); await app.register(prismaPlugin); await app.register(redisPlugin); await app.register(healthRoutes, { prefix: '/api' }); await app.register(strategyRoutes, { prefix: '/api' }); return app; }
