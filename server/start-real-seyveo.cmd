@echo off
chcp 65001 >nul
cd /d "%~dp0"
if not exist "%~dp0real-app-local.mjs" (
 echo.
 echo ERROR: This file was copied away from the SEYVEO project.
 echo Open the project folder and run server\create-seyveo-shortcut.cmd once.
 echo The new desktop shortcut will point to the correct server location.
 echo.
 pause
 exit /b 1
)
where node >nul 2>nul
if errorlevel 1 (
 echo Node.js required: https://nodejs.org/
 pause
 exit /b 1
)
set "SEYVEO_ENABLE_LOCAL=1"
set "SEYVEO_ENABLE_CLOUD=0"
set "SEYVEO_LOCAL_MODEL=qwen3:4b-instruct"
set "SEYVEO_LOCAL_THREADS=8"
echo.
echo SEYVEO approved Home with local Ollama.
echo Open http://127.0.0.1:8790/
echo Keep this window open. Ctrl+C to stop.
echo.
start "" /min powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 3; Start-Process 'http://127.0.0.1:8790/'"
node "%~dp0real-app-local.mjs"
pause
