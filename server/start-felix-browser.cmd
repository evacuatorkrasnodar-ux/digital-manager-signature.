@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
 echo Node.js is not installed.
 pause
 exit /b 1
)
set "SEYVEO_ENABLE_LOCAL=1"
set "SEYVEO_ENABLE_CLOUD=0"
set "SEYVEO_LOCAL_MODEL=qwen3:4b-instruct"
echo.
echo SEYVEO Felix in the browser
echo When the server starts, open http://127.0.0.1:8788/
echo Close this window to stop the local page.
echo.
node "%~dp0browser-local.mjs"
pause
