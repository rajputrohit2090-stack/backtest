import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
const graphSchema = z.object({ nodes: z.array(z.unknown()), edges: z.array(z.unknown()), version: z.number().int().positive().default(1) });
const saveSchema = z.object({ name: z.string().min(1).max(120), description: z.string().max(500).optional(), graph: graphSchema });
export const strategyRoutes: FastifyPluginAsync = async (app) => {
  app.get('/strategies/:id', { schema: { tags: ['strategies'], params: { type: 'object', required: ['id'], properties: { id: { type: 'string' } } } } }, async (request, reply) => {
    const { id } = request.params as { id: string }; const strategy = await app.prisma.strategy.findUnique({ where: { id } });
    if (!strategy) return reply.code(404).send({ message: 'Strategy not found' }); return strategy;
  });
  app.post('/strategies', { schema: { tags: ['strategies'] } }, async (request, reply) => {
    const input = saveSchema.parse(request.body); const strategy = await app.prisma.$transaction(async (tx) => { const created = await tx.strategy.create({ data: { name: input.name, description: input.description, graph: input.graph } }); await tx.strategyVersion.create({ data: { strategyId: created.id, version: input.graph.version, graph: input.graph } }); return created; });
    return reply.code(201).send(strategy);
  });
  app.put('/strategies/:id', { schema: { tags: ['strategies'] } }, async (request, reply) => {
    const { id } = request.params as { id: string }; const input = saveSchema.parse(request.body); const strategy = await app.prisma.strategy.update({ where: { id }, data: { name: input.name, description: input.description, graph: input.graph } }).catch(() => null);
    if (!strategy) return reply.code(404).send({ message: 'Strategy not found' }); await app.prisma.strategyVersion.upsert({ where: { strategyId_version: { strategyId: id, version: input.graph.version } }, update: { graph: input.graph }, create: { strategyId: id, version: input.graph.version, graph: input.graph } }); return strategy;
  });
};
