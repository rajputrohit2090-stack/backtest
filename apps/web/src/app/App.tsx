import { type ChangeEvent, useState } from 'react';

type BridgeStatus = 'idle' | 'checking' | 'connected' | 'missing-mt5' | 'error';
type DetectResponse = { found: boolean; paths: string[]; primary: string | null };
type Rules = Record<string, unknown> & { userLanguage?: string; followUpQuestions?: string[]; missingFields?: string[]; strategyName?: string; description?: string };
const defaultBridgeUrl = 'http://localhost:8787';
const apiBase = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api';

export function App() {
  const [bridgeUrl, setBridgeUrl] = useState(defaultBridgeUrl);
  const [terminalPath, setTerminalPath] = useState('');
  const [status, setStatus] = useState<BridgeStatus>('idle');
  const [message, setMessage] = useState('Start the desktop bridge, then connect to MetaTrader 5.');
  const [prompt, setPrompt] = useState('EMA 210 ke upar buy lo');
  const [rules, setRules] = useState<Rules | null>(null);
  const [strategyId, setStrategyId] = useState('');
  const [search, setSearch] = useState('');
  const [saved, setSaved] = useState<Array<{ id: string; name: string; tags: string[]; symbol?: string; timeframe?: string }>>([]);
  const [builderMessage, setBuilderMessage] = useState('Describe a strategy in Hindi, Hinglish, or English.');

  const connectToMeta5 = async () => {
    setStatus('checking'); setMessage('Checking desktop bridge and MetaTrader 5 installation...');
    try { const health = await fetch(`${bridgeUrl}/health`); if (!health.ok) throw new Error(); const detected = await fetch(`${bridgeUrl}/mt5/detect`).then((r) => r.json()) as DetectResponse; if (detected.primary) { setTerminalPath(detected.primary); setStatus('connected'); setMessage('Desktop bridge connected and MetaTrader 5 was detected.'); return; } setStatus('missing-mt5'); setMessage('Desktop bridge connected, but MetaTrader 5 was not detected. Paste terminal64.exe path below.'); } catch { setStatus('error'); setMessage('Desktop bridge is not reachable. Run apps/desktop-bridge/bridge.py and try again.'); }
  };
  const openMeta5 = async () => {
    setStatus('checking'); setMessage('Sending MetaTrader 5 open request...');
    try { const response = await fetch(`${bridgeUrl}/mt5/open`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ terminal_path: terminalPath || undefined }) }); if (!response.ok) { setStatus('missing-mt5'); setMessage('MetaTrader 5 could not be opened. Detect it or paste the terminal path first.'); return; } const result = await response.json() as { path: string }; setTerminalPath(result.path); setStatus('connected'); setMessage('MetaTrader 5 launch request sent successfully.'); } catch { setStatus('error'); setMessage('Desktop bridge is not reachable. Run apps/desktop-bridge/bridge.py and try again.'); }
  };
  const parsePrompt = async () => { const result = await fetch(`${apiBase}/strategy/ai/parse`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ prompt }) }).then((r) => r.json()); setRules(result.rules); setBuilderMessage(result.complete ? 'Rules complete. Save as a reusable template.' : `AI needs: ${result.followUpQuestions.join(' ')}`); };
  const saveTemplate = async () => { if (!rules) return; const result = await fetch(`${apiBase}/strategy/save`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: rules.strategyName, description: rules.description, userLanguage: rules.userLanguage, rules }) }).then((r) => r.json()); setStrategyId(result.strategy.id); setBuilderMessage('Strategy template saved.'); };
  const generateMq5 = async () => { if (!strategyId) return; await fetch(`${apiBase}/strategy/${strategyId}/generate-mq5`, { method: 'POST' }).then((r) => r.json()); setBuilderMessage('MQ5 generated. Download it or compile in MetaEditor to create EX5.'); };
  const downloadMq5 = () => { if (strategyId) window.open(`${apiBase}/strategy/${strategyId}/download-mq5`, '_blank'); };
  const searchStrategies = async () => { const result = await fetch(`${apiBase}/strategy/search?q=${encodeURIComponent(search)}`).then((r) => r.json()); setSaved(result.strategies); };

  return <main className="page-shell dashboard">
    <section className="connect-card" aria-labelledby="connect-title"><p className="eyebrow">MT5 Connection</p><h1 id="connect-title">Connect to MetaTrader 5</h1><div className={`status ${status}`} role="status"><strong>{status === 'idle' ? 'Ready' : status.replace('-', ' ')}</strong><span>{message}</span></div><label>Desktop bridge URL<input value={bridgeUrl} onChange={(e: ChangeEvent<HTMLInputElement>) => setBridgeUrl(e.target.value)} /></label><label>MetaTrader 5 terminal path<input value={terminalPath} onChange={(e) => setTerminalPath(e.target.value)} placeholder="C:\Program Files\MetaTrader 5\terminal64.exe" /></label><div className="actions"><button onClick={connectToMeta5} disabled={status === 'checking'}>Connect to Meta5</button><button className="secondary" onClick={openMeta5} disabled={status === 'checking'}>Open Meta5</button></div></section>
    <section className="connect-card builder" aria-labelledby="builder-title"><p className="eyebrow">AI Strategy Builder</p><h1 id="builder-title">Build MT5 Expert Advisors</h1><p className="intro">Supports Hindi, Hinglish, and English prompts such as “EMA 210 ke upar buy lo”, “RSI 30 cross kare to buy”, and “Create XAUUSD M5 scalping strategy”.</p><label>Strategy prompt<textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} /></label><div className="actions"><button onClick={parsePrompt}>Understand strategy</button><button className="secondary" onClick={saveTemplate} disabled={!rules}>Save as Template</button><button className="secondary" onClick={generateMq5} disabled={!strategyId}>Generate MQ5</button><button className="secondary" onClick={downloadMq5} disabled={!strategyId}>Download MQ5/EX5</button></div><div className="status"><strong>Language auto-detect: {rules?.userLanguage ?? 'waiting'}</strong><span>{builderMessage}</span></div><pre>{rules ? JSON.stringify(rules, null, 2) : 'Step-wise strategy form and preview rules will appear here.'}</pre><label>Search saved strategies<input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="EMA RSI XAUUSD scalping" /></label><button className="secondary" onClick={searchStrategies}>Search</button><div className="strategy-list">{saved.map((item) => <article key={item.id}><b>{item.name}</b><span>{[item.symbol, item.timeframe, ...(item.tags ?? [])].filter(Boolean).join(' • ')}</span></article>)}</div></section>
  </main>;
}
