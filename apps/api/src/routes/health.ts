import type { FastifyPluginAsync } from 'fastify';
import { createHealthResponse } from '@backtest-ai/shared';

export const healthRoutes: FastifyPluginAsync = async (app) => {
  app.get('/health', {
    schema: {
      tags: ['system'],
      response: { 200: { type: 'object', additionalProperties: true } },
    },
  }, async () => {
    const dependencies: Record<string, 'ok' | 'degraded'> = { database: 'ok', redis: 'ok' };
    try { await app.prisma.$queryRaw`SELECT 1`; } catch { dependencies.database = 'degraded'; }
    try { if (app.redis.status === 'wait') await app.redis.connect(); await app.redis.ping(); } catch { dependencies.redis = 'degraded'; }
    return createHealthResponse('api', dependencies);
  });
};
