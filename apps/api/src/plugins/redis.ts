import fp from 'fastify-plugin';
import type { FastifyPluginAsync } from 'fastify';
import { Redis } from 'ioredis';
import { config } from '../config.js';

declare module 'fastify' {
  interface FastifyInstance {
    redis: Redis;
  }
}

const plugin: FastifyPluginAsync = async (app) => {
  const redis = new Redis(config.REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: 1 });
  redis.on('error', (error) => app.log.warn({ error }, 'Redis connection issue'));
  app.decorate('redis', redis);
  app.addHook('onClose', async () => redis.quit());
};

export const redisPlugin = fp(plugin);
