# BackTest AI Desktop Bridge

Local Windows bridge for browser-to-desktop actions that a React app cannot do directly.

## Run on Windows

```cmd
cd C:\Users\hii\Desktop\backtest\apps\desktop-bridge
py -m venv .venv
.venv\Scripts\activate
pip install fastapi uvicorn pydantic
python bridge.py
```

Bridge URL: `http://localhost:8787`

## Endpoints

- `GET /health` checks bridge status.
- `GET /mt5/detect` searches common MetaTrader 5 install locations.
- `POST /mt5/template` saves `.mq5` template files.
- `POST /mt5/open` launches a selected MT5 terminal path.

The bridge must run on the user's Windows machine, not inside Docker, because Docker/browser code cannot directly launch installed desktop software.
