import fp from 'fastify-plugin';
import type { FastifyPluginAsync } from 'fastify';
import { PrismaClient } from '@prisma/client';

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

const plugin: FastifyPluginAsync = async (app) => {
  const prisma = new PrismaClient({ log: ['error', 'warn'] });
  app.decorate('prisma', prisma);
  app.addHook('onClose', async () => prisma.$disconnect());
};

export const prismaPlugin = fp(plugin);
