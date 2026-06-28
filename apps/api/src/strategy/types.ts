import { z } from 'zod';

export const strategyRulesSchema = z.object({
  strategyName: z.string().min(1),
  description: z.string().min(1),
  userLanguage: z.enum(['hi', 'hinglish', 'en']),
  symbol: z.string().nullable(),
  timeframe: z.string().nullable(),
  entryCondition: z.string().nullable(),
  exitCondition: z.string().nullable(),
  stopLoss: z.string().nullable(),
  takeProfit: z.string().nullable(),
  lotSize: z.string().nullable(),
  riskManagement: z.string().nullable(),
  filters: z.array(z.string()).default([]),
  indicators: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  missingFields: z.array(z.string()).default([]),
  followUpQuestions: z.array(z.string()).default([]),
});

export type StrategyRules = z.infer<typeof strategyRulesSchema>;

export const saveStrategySchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  userLanguage: z.enum(['hi', 'hinglish', 'en']),
  rules: strategyRulesSchema,
  generatedMql5: z.string().optional(),
});
