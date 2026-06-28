import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { z } from 'zod';
import { config } from '../config.js';

export const backtestConfigSchema = z.object({
  symbol: z.string().min(1),
  timeframe: z.string().min(1),
  fromDate: z.string().regex(/^\d{4}\.\d{2}\.\d{2}$/),
  toDate: z.string().regex(/^\d{4}\.\d{2}\.\d{2}$/),
  initialDeposit: z.coerce.number().positive().default(10000),
  currency: z.string().min(3).max(6).default('USD'),
  leverage: z.string().min(1).default('1:100'),
  dateMode: z.string().default('custom_period'),
  forwardMode: z.string().default('no'),
  forwardDate: z.string().regex(/^\d{4}\.\d{2}\.\d{2}$/).optional(),
  delay: z.string().default('1 ms'),
  modelling: z.enum(['every_tick', 'real_ticks', 'open_prices', 'one_minute_ohlc']).default('one_minute_ohlc'),
  profitInPips: z.boolean().default(false),
  spread: z.string().default('current'),
  visualMode: z.boolean().default(false),
  optimization: z.boolean().default(false),
  lotSize: z.coerce.number().positive().default(0.01),
  stopLossPoints: z.coerce.number().int().positive().default(300),
  takeProfitPoints: z.coerce.number().int().positive().default(600),
});

export type BacktestConfig = z.infer<typeof backtestConfigSchema>;

export async function createBacktestFiles(strategyId: string, expertName: string, backtest: BacktestConfig) {
  const root = path.resolve(config.GENERATED_STRATEGY_DIR, strategyId, 'backtests');
  if (!root.startsWith(path.resolve(config.GENERATED_STRATEGY_DIR))) throw new Error('Invalid backtest path');
  await mkdir(root, { recursive: true });
  const reportPath = path.join(root, `report-${Date.now()}.html`);
  const iniFilePath = path.join(root, `tester-${Date.now()}.ini`);
  const model = backtest.modelling === 'real_ticks' ? 4 : backtest.modelling === 'open_prices' ? 1 : backtest.modelling === 'one_minute_ohlc' ? 2 : 0;
  const content = [
    '[Tester]',
    `Expert=${expertName}`,
    `Symbol=${backtest.symbol}`,
    `Period=${backtest.timeframe}`,
    `FromDate=${backtest.fromDate}`,
    `ToDate=${backtest.toDate}`,
    `ForwardMode=${backtest.forwardMode}`,
    `ForwardDate=${backtest.forwardDate ?? ''}`,
    `Delay=${backtest.delay}`,
    `Model=${model}`,
    `ProfitInPips=${backtest.profitInPips ? 1 : 0}`,
    `Spread=${backtest.spread}`,
    `Deposit=${backtest.initialDeposit}`,
    `Currency=${backtest.currency}`,
    `Leverage=${backtest.leverage}`,
    `ExecutionMode=0`,
    `Optimization=${backtest.optimization ? 1 : 0}`,
    `Visual=${backtest.visualMode ? 1 : 0}`,
    `Report=${reportPath}`,
    'ReplaceReport=1',
    'ShutdownTerminal=1',
    '',
    '[Inputs]',
    `LotSize=${backtest.lotSize}`,
    `StopLossPoints=${backtest.stopLossPoints}`,
    `TakeProfitPoints=${backtest.takeProfitPoints}`,
  ].join('\n');
  await writeFile(iniFilePath, content);
  return { iniFilePath, reportPath };
}

export async function runMt5Backtest(iniFilePath: string) {
  if (!config.MT5_TERMINAL_PATH) {
    return { status: 'CONFIG_READY', message: 'Backtest configuration generated. Configure MT5_TERMINAL_PATH to run MetaTrader 5 Strategy Tester on the server.' };
  }
  return new Promise<{ status: string; message: string }>((resolve) => {
    const child = spawn(config.MT5_TERMINAL_PATH!, [`/config:${iniFilePath}`], { shell: false, timeout: 120000 });
    let output = '';
    child.stdout.on('data', (data) => output += data);
    child.stderr.on('data', (data) => output += data);
    child.on('close', (code) => resolve({ status: code === 0 ? 'COMPLETED' : 'FAILED', message: output || `MetaTrader 5 exited with ${code}` }));
    child.on('error', () => resolve({ status: 'FAILED', message: 'MetaTrader 5 terminal could not be started. Check MT5_TERMINAL_PATH.' }));
  });
}
