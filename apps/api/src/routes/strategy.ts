import { createReadStream } from 'node:fs';
import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { parseStrategyWithOpenAI } from '../strategy/openai.js';
import { saveStrategySchema } from '../strategy/types.js';
import { compileMql5, generateMql5Source, writeStrategyFolder } from '../strategy/mql5.js';

const parseBody = z.object({ prompt: z.string().min(1) });
const idParams = z.object({ id: z.string().min(1) });

export const strategyRoutes: FastifyPluginAsync = async (app) => {
  app.post('/strategy/ai/parse', async (request) => {
    const { prompt } = parseBody.parse(request.body);
    const rules = await parseStrategyWithOpenAI(prompt);
    return { rules, complete: rules.missingFields.length === 0, followUpQuestions: rules.followUpQuestions };
  });

  app.post('/strategy/save', async (request) => {
    const body = saveStrategySchema.parse(request.body);
    const searchText = [body.name, body.description, body.rules.symbol, body.rules.timeframe, ...body.rules.indicators, ...body.rules.tags, JSON.stringify(body.rules)].filter(Boolean).join(' ').toLowerCase();
    const strategy = await app.prisma.aiStrategyTemplate.create({ data: { name: body.name, description: body.description, userLanguage: body.userLanguage, symbol: body.rules.symbol, timeframe: body.rules.timeframe, indicators: body.rules.indicators, tags: body.rules.tags, rules: body.rules, generatedMql5: body.generatedMql5, isComplete: body.rules.missingFields.length === 0, searchText } });
    await app.prisma.aiStrategyStep.createMany({ data: Object.entries(body.rules).map(([stepKey, stepValue]) => ({ strategyId: strategy.id, stepKey, stepValue: stepValue as object })) });
    return { strategy };
  });

  app.get('/strategy/search', async (request) => {
    const q = String((request.query as { q?: string }).q ?? '').toLowerCase();
    const strategies = await app.prisma.aiStrategyTemplate.findMany({ where: q ? { searchText: { contains: q, mode: 'insensitive' } } : {}, orderBy: { updatedAt: 'desc' }, take: 50 });
    return { strategies };
  });

  app.get('/strategy/:id', async (request) => {
    const { id } = idParams.parse(request.params);
    return { strategy: await app.prisma.aiStrategyTemplate.findUniqueOrThrow({ where: { id }, include: { steps: true } }) };
  });

  app.post('/strategy/:id/generate-mq5', async (request) => {
    const { id } = idParams.parse(request.params);
    const strategy = await app.prisma.aiStrategyTemplate.findUniqueOrThrow({ where: { id } });
    const source = generateMql5Source(strategy.id, strategy.rules as never);
    const { mq5Path } = await writeStrategyFolder(strategy.id, strategy.rules as never, source);
    const updated = await app.prisma.aiStrategyTemplate.update({ where: { id }, data: { generatedMql5: source, mq5FilePath: mq5Path } });
    return { strategy: updated, mq5Path, source };
  });

  app.get('/strategy/:id/download-mq5', async (request, reply) => {
    const { id } = idParams.parse(request.params);
    const strategy = await app.prisma.aiStrategyTemplate.findUniqueOrThrow({ where: { id } });
    const mq5Path = strategy.mq5FilePath ?? (await writeStrategyFolder(strategy.id, strategy.rules as never, generateMql5Source(strategy.id, strategy.rules as never))).mq5Path;
    return reply.header('content-type', 'text/plain').header('content-disposition', `attachment; filename=\"${strategy.name.replace(/[^a-z0-9_-]/gi, '_')}.mq5\"`).send(createReadStream(mq5Path));
  });

  app.post('/strategy/:id/compile', async (request) => {
    const { id } = idParams.parse(request.params);
    const strategy = await app.prisma.aiStrategyTemplate.findUniqueOrThrow({ where: { id } });
    const mq5Path = strategy.mq5FilePath ?? (await writeStrategyFolder(strategy.id, strategy.rules as never, generateMql5Source(strategy.id, strategy.rules as never))).mq5Path;
    const result = await compileMql5(mq5Path);
    await app.prisma.aiStrategyTemplate.update({ where: { id }, data: { compileMessage: result.message, ex5FilePath: result.ex5Path } });
    return result;
  });

  app.post('/strategy/:id/deploy-mt5', async (request) => {
    idParams.parse(request.params);
    return { deployed: false, message: 'Deploy hook is ready to use the existing MT5 bridge/connection module when server-side deployment is configured.' };
  });
};
