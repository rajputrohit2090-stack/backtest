# BackTest AI Desktop Bridge

Local Windows bridge for browser-to-desktop actions that a React app cannot do directly.

## Run on Windows

This bridge now uses only the Python standard library, so FastAPI, Pydantic, Uvicorn, Rust, and Cargo are not required. From PowerShell, run these commands:

```powershell
cd C:\Users\hii\Desktop\backtest\apps\desktop-bridge
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python bridge.py
```

If PowerShell blocks activation scripts, use CMD instead:

```cmd
cd C:\Users\hii\Desktop\backtest\apps\desktop-bridge
py -m venv .venv
.venv\Scripts\activate.bat
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

The helper creates `.venv` and starts the bridge. No Python package install is required.

Bridge URL: `http://localhost:8787`

## Endpoints

- `GET /health` checks bridge status.
- `GET /mt5/detect` searches common MetaTrader 5 install locations.
- `POST /mt5/template` saves `.mq5` template files.
- `POST /mt5/open` launches a selected MT5 terminal path.

The bridge must run on the user's Windows machine, not inside Docker, because Docker/browser code cannot directly launch installed desktop software.
