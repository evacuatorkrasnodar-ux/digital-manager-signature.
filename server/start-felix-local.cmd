@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
 echo Node.js is not installed. Please install Node.js 22 LTS or later.
 echo Official site: https://nodejs.org/
 pause
 exit /b 1
)
set "SEYVEO_ENABLE_LOCAL=1"
set "SEYVEO_ENABLE_CLOUD=0"
set "SEYVEO_LOCAL_MODEL=qwen3:4b-instruct"
node "%~dp0chat-local.mjs"
pause
