from __future__ import annotations

import os
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

APP_NAME = "BackTest AI Desktop Bridge"
DEFAULT_PORT = int(os.getenv("BACKTEST_BRIDGE_PORT", "8787"))

app = FastAPI(title=APP_NAME, version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class TemplateRequest(BaseModel):
    name: str = Field(default="BackTestAI_Strategy")
    code: str
    directory: Optional[str] = None


class OpenRequest(BaseModel):
    terminal_path: Optional[str] = None


def common_mt5_paths() -> list[Path]:
    roots = [
        os.getenv("PROGRAMFILES"),
        os.getenv("PROGRAMFILES(X86)"),
        str(Path.home() / "AppData" / "Roaming" / "MetaQuotes" / "Terminal"),
    ]
    candidates: list[Path] = []
    for root in [Path(r) for r in roots if r]:
        candidates.extend(root.glob("**/terminal64.exe"))
        candidates.extend(root.glob("**/terminal.exe"))
    candidates.extend([
        Path("C:/Program Files/MetaTrader 5/terminal64.exe"),
        Path("C:/Program Files/MetaTrader 5/terminal.exe"),
        Path("C:/Program Files (x86)/MetaTrader 5/terminal64.exe"),
    ])
    seen: set[str] = set()
    out: list[Path] = []
    for path in candidates:
        key = str(path).lower()
        if key not in seen and path.exists():
            seen.add(key)
            out.append(path)
    return out


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": APP_NAME, "time": datetime.now(timezone.utc).isoformat()}


@app.get("/mt5/detect")
def detect_mt5() -> dict[str, object]:
    paths = [str(path) for path in common_mt5_paths()]
    return {"found": bool(paths), "paths": paths, "primary": paths[0] if paths else None}


@app.post("/mt5/template")
def save_template(payload: TemplateRequest) -> dict[str, str]:
    safe_name = "".join(ch for ch in payload.name if ch.isalnum() or ch in ("_", "-", " ")).strip() or "BackTestAI_Strategy"
    directory = Path(payload.directory) if payload.directory else Path.home() / "Documents" / "BackTestAI" / "MT5" / "Experts"
    directory.mkdir(parents=True, exist_ok=True)
    file_path = directory / f"{safe_name.replace(' ', '_')}.mq5"
    file_path.write_text(payload.code, encoding="utf-8")
    return {"status": "saved", "path": str(file_path)}


@app.post("/mt5/open")
def open_mt5(payload: OpenRequest) -> dict[str, str]:
    detected = common_mt5_paths()
    terminal = Path(payload.terminal_path) if payload.terminal_path else (detected[0] if detected else None)
    if terminal is None or not terminal.exists():
        raise HTTPException(status_code=404, detail="MetaTrader terminal not found")
    subprocess.Popen([str(terminal)], cwd=str(terminal.parent))
    return {"status": "opened", "path": str(terminal)}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=DEFAULT_PORT)
