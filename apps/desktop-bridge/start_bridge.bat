@echo off
setlocal
cd /d "%~dp0"

if not exist .venv\Scripts\python.exe (
  py -m venv .venv
)

call .venv\Scripts\activate.bat
python bridge.py
