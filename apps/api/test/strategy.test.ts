import { describe, expect, it } from 'vitest';
import { heuristicParse } from '../src/strategy/openai.js';
import { compileMql5, generateMql5Source, validateMql5Source } from '../src/strategy/mql5.js';
import { backtestConfigSchema, runMt5Backtest } from '../src/strategy/backtest.js';

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
    expect(source).toContain('CopyBuffer');
  });

  it('returns clear compiler unavailable case', async () => {
    delete process.env.METAEDITOR_PATH;
    const result = await compileMql5('/tmp/example.mq5');
    expect(result.compiled).toBe(false);
    expect(result.message).toContain('Please compile it in MetaEditor');
  });
});


describe('template backtesting', () => {
  it('validates MetaTrader-style backtest fields', () => {
    const config = backtestConfigSchema.parse({ symbol: 'XAUUSD', timeframe: 'M5', fromDate: '2026.01.01', toDate: '2026.06.28' });
    expect(config.initialDeposit).toBe(10000);
    expect(config.modelling).toBe('one_minute_ohlc');
  });

  it('returns a configuration-ready message when MT5 terminal is unavailable', async () => {
    delete process.env.MT5_TERMINAL_PATH;
    const result = await runMt5Backtest('/tmp/tester.ini');
    expect(result.status).toBe('CONFIG_READY');
    expect(result.message).toContain('MT5_TERMINAL_PATH');
  });
});
