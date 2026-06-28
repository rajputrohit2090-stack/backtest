import { type ChangeEvent, useState } from 'react';

type BridgeStatus = 'idle' | 'checking' | 'connected' | 'missing-mt5' | 'error';

type DetectResponse = {
  found: boolean;
  paths: string[];
  primary: string | null;
};

const defaultBridgeUrl = 'http://localhost:8787';

export function App() {
  const [bridgeUrl, setBridgeUrl] = useState(defaultBridgeUrl);
  const [terminalPath, setTerminalPath] = useState('');
  const [status, setStatus] = useState<BridgeStatus>('idle');
  const [message, setMessage] = useState('Start the desktop bridge, then connect to MetaTrader 5.');

  const connectToMeta5 = async () => {
    setStatus('checking');
    setMessage('Checking desktop bridge and MetaTrader 5 installation...');

    try {
      const health = await fetch(`${bridgeUrl}/health`);
      if (!health.ok) {
        throw new Error('Desktop bridge health check failed.');
      }

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

  return (
    <main className="page-shell">
      <section className="connect-card" aria-labelledby="connect-title">
        <p className="eyebrow">Step 1</p>
        <h1 id="connect-title">Connect to MetaTrader 5</h1>
        <p className="intro">
          Everything else has been removed for the fresh start. This screen only checks the local desktop bridge,
          detects MetaTrader 5, and can ask the bridge to open it.
        </p>

        <div className={`status ${status}`} role="status">
          <strong>{status === 'idle' ? 'Ready' : status.replace('-', ' ')}</strong>
          <span>{message}</span>
        </div>

        <label>
          Desktop bridge URL
          <input
            value={bridgeUrl}
            onChange={(event: ChangeEvent<HTMLInputElement>) => setBridgeUrl(event.target.value)}
            placeholder={defaultBridgeUrl}
          />
        </label>

        <label>
          MetaTrader 5 terminal path
          <input
            value={terminalPath}
            onChange={(event: ChangeEvent<HTMLInputElement>) => setTerminalPath(event.target.value)}
            placeholder="C:\\Program Files\\MetaTrader 5\\terminal64.exe"
          />
        </label>

        <div className="actions">
          <button onClick={connectToMeta5} disabled={status === 'checking'}>
            {status === 'checking' ? 'Checking...' : 'Connect to Meta5'}
          </button>
          <button className="secondary" onClick={openMeta5} disabled={status === 'checking'}>
            Open Meta5
          </button>
        </div>

        <ol className="notes">
          <li>Run the bridge locally: <code>python apps/desktop-bridge/bridge.py</code></li>
          <li>Click <b>Connect to Meta5</b> to detect the terminal.</li>
          <li>If auto-detect fails, paste the terminal path and click <b>Open Meta5</b>.</li>
        </ol>
      </section>
    </main>
  );
}
