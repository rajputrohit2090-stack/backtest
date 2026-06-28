import { config } from '../config.js';
import { strategyRulesSchema, type StrategyRules } from './types.js';

const jsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['strategyName','description','userLanguage','symbol','timeframe','entryCondition','exitCondition','stopLoss','takeProfit','lotSize','riskManagement','filters','indicators','tags','missingFields','followUpQuestions'],
  properties: {
    strategyName: { type: 'string' }, description: { type: 'string' }, userLanguage: { type: 'string', enum: ['hi','hinglish','en'] },
    symbol: { anyOf: [{ type: 'string' }, { type: 'null' }] }, timeframe: { anyOf: [{ type: 'string' }, { type: 'null' }] },
    entryCondition: { anyOf: [{ type: 'string' }, { type: 'null' }] }, exitCondition: { anyOf: [{ type: 'string' }, { type: 'null' }] },
    stopLoss: { anyOf: [{ type: 'string' }, { type: 'null' }] }, takeProfit: { anyOf: [{ type: 'string' }, { type: 'null' }] },
    lotSize: { anyOf: [{ type: 'string' }, { type: 'null' }] }, riskManagement: { anyOf: [{ type: 'string' }, { type: 'null' }] },
    filters: { type: 'array', items: { type: 'string' } }, indicators: { type: 'array', items: { type: 'string' } }, tags: { type: 'array', items: { type: 'string' } },
    missingFields: { type: 'array', items: { type: 'string' } }, followUpQuestions: { type: 'array', items: { type: 'string' } },
  },
};

export async function parseStrategyWithOpenAI(prompt: string): Promise<StrategyRules> {
  if (!config.OPENAI_API_KEY) {
    return heuristicParse(prompt);
  }
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { authorization: `Bearer ${config.OPENAI_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-5.5',
      input: [{ role: 'system', content: 'Convert Hindi, Hinglish, or English trading strategy ideas into executable rule JSON. Ask concise follow-up questions for missing fields.' }, { role: 'user', content: prompt }],
      text: { format: { type: 'json_schema', name: 'strategy_rules', strict: true, schema: jsonSchema } },
    }),
  });
  if (!response.ok) throw new Error(`OpenAI Responses API failed with ${response.status}`);
  const data = await response.json() as { output_text?: string; output?: Array<{ content?: Array<{ text?: string }> }> };
  const text = data.output_text ?? data.output?.flatMap((o) => o.content ?? []).map((c) => c.text ?? '').join('') ?? '';
  return strategyRulesSchema.parse(JSON.parse(text));
}

export function heuristicParse(prompt: string): StrategyRules {
  const p = prompt.toLowerCase();
  const indicators = ['EMA','RSI','SMA','MACD'].filter((i) => p.includes(i.toLowerCase()));
  const symbol = (prompt.match(/\b(XAUUSD|EURUSD|GBPUSD|USDJPY|BTCUSD)\b/i)?.[1] ?? null)?.toUpperCase() ?? null;
  const timeframe = (prompt.match(/\b(M1|M5|M15|M30|H1|H4|D1)\b/i)?.[1] ?? null)?.toUpperCase() ?? null;
  const userLanguage = /[\u0900-\u097F]/.test(prompt) ? 'hi' : /\b(ke|kare|upar|niche|lo|jab|agar)\b/i.test(prompt) ? 'hinglish' : 'en';
  const tags = [...new Set([...indicators, symbol, p.includes('scalp') ? 'scalping' : '', p.includes('martingale') ? 'martingale' : '', p.includes('trend') ? 'trend-following' : ''].filter(Boolean))] as string[];
  const missingFields = ['symbol','timeframe','exitCondition','stopLoss','takeProfit','lotSize','riskManagement'].filter((f) => (f === 'symbol' && symbol === null) || (f === 'timeframe' && timeframe === null) || !['symbol','timeframe'].includes(f));
  return { strategyName: prompt.slice(0, 60) || 'AI Strategy', description: prompt, userLanguage, symbol, timeframe, entryCondition: prompt, exitCondition: null, stopLoss: null, takeProfit: null, lotSize: null, riskManagement: null, filters: [], indicators, tags, missingFields, followUpQuestions: missingFields.map((f) => `Please provide ${f}.`) };
}
