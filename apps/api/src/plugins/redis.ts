import fp from 'fastify-plugin';
import Redis from 'ioredis';
import { config } from '../config.js';
declare module 'fastify' { interface FastifyInstance { redis: Redis } }
export const redisPlugin = fp(async (app) => { const redis = new Redis(config.redisUrl, { lazyConnect: true, maxRetriesPerRequest: 1 }); redis.on('error', (error) => app.log.warn({ error }, 'Redis unavailable')); try { await redis.connect(); } catch (error) { app.log.warn({ error }, 'Continuing without Redis connection'); } app.decorate('redis', redis); app.addHook('onClose', async () => redis.quit()); });
