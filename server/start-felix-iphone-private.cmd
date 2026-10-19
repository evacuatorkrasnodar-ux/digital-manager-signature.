@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
 echo Node.js 22+ required.
 pause
 exit /b 1
)
echo.
echo SEYVEO iPhone PRIVATE gateway - owner only.
echo Use Tailscale Serve, NEVER Funnel.
echo First start server\start-real-seyveo.cmd in another window.
echo.
set /p "SEYVEO_TAILNET_HOST=Exact computer.tailnet.ts.net host: "
set /p "SEYVEO_TAILNET_OWNER=Your Tailscale login (usually email): "
set "SEYVEO_IPHONE_GATEWAY_PORT=8791"
echo Gateway will bind ONLY to 127.0.0.1:8791.
echo Configure Tailscale Serve yourself AFTER this is running.
node "%~dp0iphone-private-gateway.mjs"
echo Gateway stopped.
pause
