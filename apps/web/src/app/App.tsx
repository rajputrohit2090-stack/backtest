import { type ChangeEvent, type FormEvent, useState } from 'react';

type Rules = Record<string, unknown> & {
  userLanguage?: string;
  followUpQuestions?: string[];
  missingFields?: string[];
  strategyName?: string;
  description?: string;
  symbol?: string | null;
  timeframe?: string | null;
};
type SavedStrategy = { id: string; name: string; tags: string[]; symbol?: string; timeframe?: string };
type BacktestForm = {
  symbol: string;
  timeframe: string;
  fromDate: string;
  toDate: string;
  initialDeposit: string;
  currency: string;
  leverage: string;
  dateMode: string;
  forwardMode: string;
  forwardDate: string;
  delay: string;
  modelling: 'every_tick' | 'real_ticks' | 'open_prices' | 'one_minute_ohlc';
  profitInPips: boolean;
  spread: string;
  visualMode: boolean;
  optimization: boolean;
  lotSize: string;
  stopLossPoints: string;
  takeProfitPoints: string;
};

const apiBase = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api';
const defaultBacktest: BacktestForm = {
  symbol: 'XAUUSD',
  timeframe: 'M5',
  fromDate: '2026.01.01',
  toDate: '2026.06.28',
  initialDeposit: '10000',
  currency: 'USD',
  leverage: '1:100',
  dateMode: 'custom_period',
  forwardMode: 'no',
  forwardDate: '1970.01.01',
  delay: '1 ms',
  modelling: 'one_minute_ohlc',
  profitInPips: false,
  spread: 'current',
  visualMode: false,
  optimization: false,
  lotSize: '0.01',
  stopLossPoints: '300',
  takeProfitPoints: '600',
};

export function App() {
  const [prompt, setPrompt] = useState('EMA 210 ke upar buy lo');
  const [rules, setRules] = useState<Rules | null>(null);
  const [strategyId, setStrategyId] = useState('');
  const [search, setSearch] = useState('');
  const [saved, setSaved] = useState<SavedStrategy[]>([]);
  const [builderMessage, setBuilderMessage] = useState('Describe a strategy in Hindi, Hinglish, or English.');
  const [openAiStatus, setOpenAiStatus] = useState('OpenAI key status not checked yet.');
  const [backtest, setBacktest] = useState<BacktestForm>(defaultBacktest);
  const [backtestMessage, setBacktestMessage] = useState('Save a template, generate MQ5, then run a MetaTrader-style backtest setup.');

  const checkOpenAiStatus = async () => {
    const result = await fetch(`${apiBase}/strategy/ai/status`).then((response) => response.json());
    setOpenAiStatus(result.message);
  };

  const parsePrompt = async () => {
    const result = await fetch(`${apiBase}/strategy/ai/parse`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ prompt }),
    }).then((response) => response.json());
    setRules(result.rules);
    setBacktest((current) => ({
      ...current,
      symbol: result.rules?.symbol ?? current.symbol,
      timeframe: result.rules?.timeframe ?? current.timeframe,
    }));
    setBuilderMessage(result.complete ? 'Rules complete. Save as a reusable template.' : `AI needs: ${result.followUpQuestions.join(' ')}`);
  };

  const saveTemplate = async () => {
    if (!rules) return;
    const result = await fetch(`${apiBase}/strategy/save`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: rules.strategyName, description: rules.description, userLanguage: rules.userLanguage, rules }),
    }).then((response) => response.json());
    setStrategyId(result.strategy.id);
    setBuilderMessage('Strategy template saved. You can now generate MQ5 or prepare a backtest.');
  };

  const generateMq5 = async () => {
    if (!strategyId) return;
    await fetch(`${apiBase}/strategy/${strategyId}/generate-mq5`, { method: 'POST' }).then((response) => response.json());
    setBuilderMessage('MQ5 generated. Download it or compile in MetaEditor to create EX5.');
  };

  const downloadMq5 = () => {
    if (strategyId) window.open(`${apiBase}/strategy/${strategyId}/download-mq5`, '_blank');
  };

  const searchStrategies = async () => {
    const result = await fetch(`${apiBase}/strategy/search?q=${encodeURIComponent(search)}`).then((response) => response.json());
    setSaved(result.strategies);
    setBuilderMessage(result.enhanced ? `AI search expanded: ${result.enhanced.tags.join(', ')}` : 'Saved strategies loaded.');
  };

  const runBacktest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!strategyId) return;
    const result = await fetch(`${apiBase}/strategy/${strategyId}/backtest`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(backtest),
    }).then((response) => response.json());
    setBacktestMessage(result.message ?? 'Backtest request created.');
  };

  const updateBacktest = (key: keyof BacktestForm) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = event.target;
    const value = target instanceof HTMLInputElement && target.type === 'checkbox' ? target.checked : target.value;
    setBacktest((current) => ({ ...current, [key]: value }));
  };

  return (
    <main className="page-shell dashboard">
      <section className="connect-card builder" aria-labelledby="builder-title">
        <p className="eyebrow">AI Strategy Builder</p>
        <h1 id="builder-title">Strategy to MT5 Algo Code</h1>
        <p className="intro">Write a trading strategy in Hindi, Hinglish, or English. AI converts it into step-wise rules and executable MetaTrader 5 Expert Advisor source.</p>
        <div className="status"><strong>OpenAI API key</strong><span>{openAiStatus}</span></div>
        <button className="secondary" onClick={checkOpenAiStatus}>Check backend OpenAI key</button>

        <label>
          Strategy prompt
          <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} />
        </label>
        <div className="actions">
          <button onClick={parsePrompt}>Understand strategy</button>
          <button className="secondary" onClick={saveTemplate} disabled={!rules}>Save as Template</button>
          <button className="secondary" onClick={generateMq5} disabled={!strategyId}>Generate MQ5</button>
          <button className="secondary" onClick={downloadMq5} disabled={!strategyId}>Download MQ5/EX5</button>
        </div>
        <div className="status"><strong>Language auto-detect: {rules?.userLanguage ?? 'waiting'}</strong><span>{builderMessage}</span></div>
        <pre>{rules ? JSON.stringify(rules, null, 2) : 'Step-wise strategy form and preview rules will appear here.'}</pre>

        <label>
          AI search saved templates
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="EMA RSI XAUUSD scalping / RSI 30 cross kare" />
        </label>
        <button className="secondary" onClick={searchStrategies}>Search with AI</button>
        <div className="strategy-list">
          {saved.map((item) => (
            <article key={item.id} onClick={() => setStrategyId(item.id)}>
              <b>{item.name}</b>
              <span>{[item.symbol, item.timeframe, ...(item.tags ?? [])].filter(Boolean).join(' • ')}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="connect-card builder" aria-labelledby="backtest-title">
        <p className="eyebrow">Template Backtest</p>
        <h1 id="backtest-title">MetaTrader-style backtest fields</h1>
        <p className="intro">Select or save a strategy template, generate MQ5, then fill the same practical fields used for MT5 Strategy Tester.</p>
        <form className="grid-form" onSubmit={runBacktest}>
          <label>Expert<input value={strategyId ? 'Generated template EA' : 'Save template first'} readOnly /></label>
          <label>Symbol<input value={backtest.symbol} onChange={updateBacktest('symbol')} /></label>
          <label>Timeframe<input value={backtest.timeframe} onChange={updateBacktest('timeframe')} /></label>
          <label>Date<select value={backtest.dateMode} onChange={updateBacktest('dateMode')}><option value="custom_period">Custom period</option><option value="all_history">All history</option></select></label>
          <label>From date<input value={backtest.fromDate} onChange={updateBacktest('fromDate')} placeholder="YYYY.MM.DD" /></label>
          <label>To date<input value={backtest.toDate} onChange={updateBacktest('toDate')} placeholder="YYYY.MM.DD" /></label>
          <label>Forward<select value={backtest.forwardMode} onChange={updateBacktest('forwardMode')}><option value="no">No</option><option value="yes">Yes</option></select></label>
          <label>Forward date<input value={backtest.forwardDate} onChange={updateBacktest('forwardDate')} placeholder="YYYY.MM.DD" /></label>
          <label>Delays<input value={backtest.delay} onChange={updateBacktest('delay')} /></label>
          <label>Modelling<select value={backtest.modelling} onChange={updateBacktest('modelling')}><option value="one_minute_ohlc">1 minute OHLC</option><option value="every_tick">Every tick</option><option value="real_ticks">Every tick based on real ticks</option><option value="open_prices">Open prices only</option></select></label>
          <label>Deposit<input value={backtest.initialDeposit} onChange={updateBacktest('initialDeposit')} /></label>
          <label>Currency<input value={backtest.currency} onChange={updateBacktest('currency')} /></label>
          <label>Leverage<input value={backtest.leverage} onChange={updateBacktest('leverage')} /></label>
          <label>Optimization<select value={backtest.optimization ? 'enabled' : 'disabled'} onChange={(event) => setBacktest((current) => ({ ...current, optimization: event.target.value === 'enabled' }))}><option value="disabled">Disabled</option><option value="enabled">Enabled</option></select></label>
          <label>Spread<input value={backtest.spread} onChange={updateBacktest('spread')} /></label>
          <label className="checkbox"><input type="checkbox" checked={backtest.profitInPips} onChange={updateBacktest('profitInPips')} /> Profit in pips</label>
          <label className="checkbox"><input type="checkbox" checked={backtest.visualMode} onChange={updateBacktest('visualMode')} /> Visual mode</label>
          <label>Lot size<input value={backtest.lotSize} onChange={updateBacktest('lotSize')} /></label>
          <label>SL points<input value={backtest.stopLossPoints} onChange={updateBacktest('stopLossPoints')} /></label>
          <label>TP points<input value={backtest.takeProfitPoints} onChange={updateBacktest('takeProfitPoints')} /></label>
          <button disabled={!strategyId}>Prepare / Run Backtest</button>
        </form>
        <div className="status"><strong>Backtest status</strong><span>{backtestMessage}</span></div>
      </section>
    </main>
  );
}
