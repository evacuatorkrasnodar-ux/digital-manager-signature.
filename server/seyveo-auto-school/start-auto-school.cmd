@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0..\.."
where node >nul 2>nul
if errorlevel 1 (
 echo Node.js is not installed or not in PATH.
 pause
 exit /b 1
)
echo.
echo SEYVEO AUTO SCHOOL - local teacher, student and examiner
echo Model teacher: qwen3:8b ; student: qwen3:4b-instruct
echo.
node "server\seyveo-auto-school\run.mjs" --count=2
echo.
echo Training dataset (experimental) is stored in LOCALAPPDATA\SEYVEO\auto-school
pause
