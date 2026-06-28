# BackTest AI Desktop Bridge

Local Windows bridge for browser-to-desktop actions that a React app cannot do directly.

## Fix `No module named 'fastapi'`

Your screenshot shows Python is working, but the bridge dependencies are not installed yet. From PowerShell, run these commands:

```powershell
cd C:\Users\hii\Desktop\backtest\apps\desktop-bridge
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python bridge.py
```

If PowerShell blocks activation scripts, use CMD instead:

```cmd
cd C:\Users\hii\Desktop\backtest\apps\desktop-bridge
py -m venv .venv
.venv\Scripts\activate.bat
python -m pip install -r requirements.txt
python bridge.py
```

## One-command helpers

You can also double-click `start_bridge.bat`, or run one of these from `apps\desktop-bridge`:

```powershell
.\start_bridge.ps1
```

```cmd
start_bridge.bat
```

The helper creates `.venv`, installs `requirements.txt`, and starts the bridge.

Bridge URL: `http://localhost:8787`

## Endpoints

- `GET /health` checks bridge status.
- `GET /mt5/detect` searches common MetaTrader 5 install locations.
- `POST /mt5/template` saves `.mq5` template files.
- `POST /mt5/open` launches a selected MT5 terminal path.

The bridge must run on the user's Windows machine, not inside Docker, because Docker/browser code cannot directly launch installed desktop software.
