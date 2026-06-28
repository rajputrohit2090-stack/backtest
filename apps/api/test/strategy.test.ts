import { describe, expect, it } from 'vitest';
import { heuristicParse } from '../src/strategy/openai.js';
import { compileMql5, generateMql5Source, validateMql5Source } from '../src/strategy/mql5.js';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/test';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.GENERATED_STRATEGY_DIR = 'tmp/generated-strategies-test';

describe('AI strategy parsing', () => {
  it('parses Hindi prompts', () => {
    const rules = heuristicParse('RSI 30 क्रॉस करे तो buy');
    expect(rules.userLanguage).toBe('hi');
    expect(rules.indicators).toContain('RSI');
  });

  it('parses Hinglish prompts', () => {
    const rules = heuristicParse('EMA 210 ke upar buy lo');
    expect(rules.userLanguage).toBe('hinglish');
    expect(rules.indicators).toContain('EMA');
  });

  it('parses English prompts', () => {
    const rules = heuristicParse('Create XAUUSD M5 scalping strategy');
    expect(rules.userLanguage).toBe('en');
    expect(rules.symbol).toBe('XAUUSD');
    expect(rules.timeframe).toBe('M5');
  });
});

describe('MQ5 generation', () => {
  const rules = heuristicParse('Create XAUUSD M5 scalping strategy with RSI');
  it('generates a safe MQ5 file body with MagicNumber', () => {
    const source = generateMql5Source('strategy-test', rules);
    validateMql5Source(source);
    expect(source).toContain('input long MagicNumber');
    expect(source).toContain('POSITION_MAGIC');
  });

  it('returns clear compiler unavailable case', async () => {
    delete process.env.METAEDITOR_PATH;
    const result = await compileMql5('/tmp/example.mq5');
    expect(result.compiled).toBe(false);
    expect(result.message).toContain('Please compile it in MetaEditor');
  });
});
