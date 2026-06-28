import { type ChangeEvent, type FormEvent, useState } from 'react';

type BridgeStatus = 'idle' | 'checking' | 'connected' | 'missing-mt5' | 'error';
type DetectResponse = { found: boolean; paths: string[]; primary: string | null };
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
  executionModel: 'every_tick' | 'real_ticks' | 'open_prices';
  spread: string;
  lotSize: string;
  stopLossPoints: string;
  takeProfitPoints: string;
};

const defaultBridgeUrl = 'http://localhost:8787';
const apiBase = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api';
const defaultBacktest: BacktestForm = {
  symbol: 'XAUUSD',
  timeframe: 'M5',
  fromDate: '2026.01.01',
  toDate: '2026.06.28',
  initialDeposit: '10000',
  currency: 'USD',
  leverage: '1:100',
  executionModel: 'every_tick',
  spread: 'current',
  lotSize: '0.01',
  stopLossPoints: '300',
  takeProfitPoints: '600',
};

export function App() {
  const [bridgeUrl, setBridgeUrl] = useState(defaultBridgeUrl);
  const [terminalPath, setTerminalPath] = useState('');
  const [status, setStatus] = useState<BridgeStatus>('idle');
  const [message, setMessage] = useState('Start the desktop bridge, then connect to MetaTrader 5.');
  const [prompt, setPrompt] = useState('EMA 210 ke upar buy lo');
  const [rules, setRules] = useState<Rules | null>(null);
  const [strategyId, setStrategyId] = useState('');
  const [search, setSearch] = useState('');
  const [saved, setSaved] = useState<SavedStrategy[]>([]);
  const [builderMessage, setBuilderMessage] = useState('Describe a strategy in Hindi, Hinglish, or English.');
  const [openAiStatus, setOpenAiStatus] = useState('OpenAI key status not checked yet.');
  const [backtest, setBacktest] = useState<BacktestForm>(defaultBacktest);
  const [backtestMessage, setBacktestMessage] = useState('Save a template, generate MQ5, then run a MetaTrader-style backtest setup.');

  const connectToMeta5 = async () => {
    setStatus('checking');
    setMessage('Checking desktop bridge and MetaTrader 5 installation...');
    try {
      const health = await fetch(`${bridgeUrl}/health`);
      if (!health.ok) throw new Error('Desktop bridge health check failed.');
      const detected = (await fetch(`${bridgeUrl}/mt5/detect`).then((response) => response.json())) as DetectResponse;
      if (detected.primary) {
        setTerminalPath(detected.primary);
        setStatus('connected');
        setMessage('Desktop bridge connected and MetaTrader 5 was detected.');
        return;
      }
      setStatus('missing-mt5');
      setMessage('Desktop bridge connected, but MetaTrader 5 was not detected. Paste terminal64.exe path below.');
    } catch {
      setStatus('error');
      setMessage('Desktop bridge is not reachable. Run apps/desktop-bridge/bridge.py and try again.');
    }
  };
  const openMeta5 = async () => {
    setStatus('checking');
    setMessage('Sending MetaTrader 5 open request...');
    try {
      const response = await fetch(`${bridgeUrl}/mt5/open`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ terminal_path: terminalPath || undefined }),
      });
      if (!response.ok) {
        setStatus('missing-mt5');
        setMessage('MetaTrader 5 could not be opened. Detect it or paste the terminal path first.');
        return;
      }
      const result = (await response.json()) as { path: string };
      setTerminalPath(result.path);
      setStatus('connected');
      setMessage('MetaTrader 5 launch request sent successfully.');
    } catch {
      setStatus('error');
      setMessage('Desktop bridge is not reachable. Run apps/desktop-bridge/bridge.py and try again.');
    }
  };

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
    setBacktest((current) => ({ ...current, [key]: event.target.value }));
  };

  return (
    <main className="page-shell dashboard">
      <section className="connect-card" aria-labelledby="connect-title">
        <p className="eyebrow">MT5 Connection</p>
        <h1 id="connect-title">Connect to MetaTrader 5</h1>
        <div className={`status ${status}`} role="status">
          <strong>{status === 'idle' ? 'Ready' : status.replace('-', ' ')}</strong>
          <span>{message}</span>
        </div>
        <label>
          Desktop bridge URL
          <input value={bridgeUrl} onChange={(event) => setBridgeUrl(event.target.value)} />
        </label>
        <label>
          MetaTrader 5 terminal path
          <input value={terminalPath} onChange={(event) => setTerminalPath(event.target.value)} placeholder={String.raw`C:\Program Files\MetaTrader 5\terminal64.exe`} />
        </label>
        <div className="actions">
          <button onClick={connectToMeta5} disabled={status === 'checking'}>Connect to Meta5</button>
          <button className="secondary" onClick={openMeta5} disabled={status === 'checking'}>Open Meta5</button>
        </div>
      </section>

      <section className="connect-card builder" aria-labelledby="builder-title">
        <p className="eyebrow">AI Strategy Builder</p>
        <h1 id="builder-title">Build MT5 Expert Advisors</h1>
        <p className="intro">Add `OPENAI_API_KEY` on the backend server. The key is never typed into or exposed by this frontend.</p>
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
          <label>Symbol<input value={backtest.symbol} onChange={updateBacktest('symbol')} /></label>
          <label>Timeframe<input value={backtest.timeframe} onChange={updateBacktest('timeframe')} /></label>
          <label>From date<input value={backtest.fromDate} onChange={updateBacktest('fromDate')} placeholder="YYYY.MM.DD" /></label>
          <label>To date<input value={backtest.toDate} onChange={updateBacktest('toDate')} placeholder="YYYY.MM.DD" /></label>
          <label>Initial deposit<input value={backtest.initialDeposit} onChange={updateBacktest('initialDeposit')} /></label>
          <label>Currency<input value={backtest.currency} onChange={updateBacktest('currency')} /></label>
          <label>Leverage<input value={backtest.leverage} onChange={updateBacktest('leverage')} /></label>
          <label>Execution model<select value={backtest.executionModel} onChange={updateBacktest('executionModel')}><option value="every_tick">Every tick</option><option value="real_ticks">Real ticks</option><option value="open_prices">Open prices only</option></select></label>
          <label>Spread<input value={backtest.spread} onChange={updateBacktest('spread')} /></label>
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
