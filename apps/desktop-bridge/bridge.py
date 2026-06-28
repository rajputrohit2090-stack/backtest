from __future__ import annotations

import json
import os
import subprocess
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

APP_NAME = "BackTest AI Desktop Bridge"
DEFAULT_PORT = int(os.getenv("BACKTEST_BRIDGE_PORT", "8787"))
ALLOWED_ORIGINS = {"http://localhost:5173", "http://127.0.0.1:5173"}


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


def safe_template_name(name: str) -> str:
    safe_name = "".join(ch for ch in name if ch.isalnum() or ch in ("_", "-", " ")).strip()
    return safe_name or "BackTestAI_Strategy"


class BridgeHandler(BaseHTTPRequestHandler):
    server_version = "BackTestAIBridge/0.1"

    def end_headers(self) -> None:
        origin = self.headers.get("Origin")
        if origin in ALLOWED_ORIGINS:
            self.send_header("Access-Control-Allow-Origin", origin)
        else:
            self.send_header("Access-Control-Allow-Origin", "http://localhost:5173")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "content-type")
        self.send_header("Access-Control-Allow-Credentials", "true")
        super().end_headers()

    def do_OPTIONS(self) -> None:
        self.send_response(204)
        self.end_headers()

    def do_GET(self) -> None:
        path = urlparse(self.path).path
        if path == "/health":
            self.send_json({"status": "ok", "service": APP_NAME, "time": datetime.now(timezone.utc).isoformat()})
            return
        if path == "/mt5/detect":
            paths = [str(path) for path in common_mt5_paths()]
            self.send_json({"found": bool(paths), "paths": paths, "primary": paths[0] if paths else None})
            return
        self.send_json({"detail": "Not found"}, status=404)

    def do_POST(self) -> None:
        path = urlparse(self.path).path
        if path == "/mt5/open":
            self.open_mt5()
            return
        if path == "/mt5/template":
            self.save_template()
            return
        self.send_json({"detail": "Not found"}, status=404)

    def read_json(self) -> dict[str, Any]:
        content_length = int(self.headers.get("Content-Length", "0") or "0")
        if content_length <= 0:
            return {}
        raw_body = self.rfile.read(content_length).decode("utf-8")
        data = json.loads(raw_body)
        return data if isinstance(data, dict) else {}

    def send_json(self, payload: dict[str, Any], status: int = 200) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def open_mt5(self) -> None:
        payload = self.read_json()
        terminal_path = payload.get("terminal_path")
        detected = common_mt5_paths()
        terminal = Path(terminal_path) if isinstance(terminal_path, str) and terminal_path else (detected[0] if detected else None)
        if terminal is None or not terminal.exists():
            self.send_json({"detail": "MetaTrader terminal not found"}, status=404)
            return
        subprocess.Popen([str(terminal)], cwd=str(terminal.parent))
        self.send_json({"status": "opened", "path": str(terminal)})

    def save_template(self) -> None:
        payload = self.read_json()
        name = payload.get("name") if isinstance(payload.get("name"), str) else "BackTestAI_Strategy"
        code = payload.get("code") if isinstance(payload.get("code"), str) else ""
        directory_value = payload.get("directory")
        directory = Path(directory_value) if isinstance(directory_value, str) and directory_value else Path.home() / "Documents" / "BackTestAI" / "MT5" / "Experts"
        directory.mkdir(parents=True, exist_ok=True)
        file_path = directory / f"{safe_template_name(name).replace(' ', '_')}.mq5"
        file_path.write_text(code, encoding="utf-8")
        self.send_json({"status": "saved", "path": str(file_path)})

    def log_message(self, format: str, *args: Any) -> None:
        print(f"[{datetime.now(timezone.utc).isoformat()}] {self.address_string()} - {format % args}")


def run() -> None:
    server = ThreadingHTTPServer(("127.0.0.1", DEFAULT_PORT), BridgeHandler)
    print(f"{APP_NAME} running at http://127.0.0.1:{DEFAULT_PORT}")
    print("Press Ctrl+C to stop.")
    server.serve_forever()


if __name__ == "__main__":
    run()
