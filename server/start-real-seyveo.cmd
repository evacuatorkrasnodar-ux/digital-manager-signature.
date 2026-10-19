@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
 echo Node.js required: https://nodejs.org/
 pause
 exit /b 1
)
set "SEYVEO_ENABLE_LOCAL=1"
set "SEYVEO_ENABLE_CLOUD=0"
set "SEYVEO_LOCAL_MODEL=qwen3:4b-instruct"
echo.
echo SEYVEO approved Home with local Ollama.
echo Open http://127.0.0.1:8790/
echo Keep this window open. Ctrl+C to stop.
echo.
node "%~dp0real-app-local.mjs"
pause
