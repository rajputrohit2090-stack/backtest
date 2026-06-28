$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

if (-not (Test-Path ".venv\Scripts\python.exe")) {
    py -m venv .venv
}

& ".\.venv\Scripts\Activate.ps1"
python bridge.py
