@echo off
chcp 65001 >nul
cd /d "%~dp0.."
where node >nul 2>nul
if errorlevel 1 (
 echo Node.js is not installed or not in PATH.
 echo Install Node.js LTS from https://nodejs.org/ and retry.
 pause
 exit /b 1
)
node "server\check-seyveo-pc.mjs"
echo.
echo This was a read-only check; no network ports were opened.
pause
