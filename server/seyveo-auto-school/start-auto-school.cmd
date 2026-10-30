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
echo SEYVEO AUTO SCHOOL - teacher, student and examiner
echo Qwen3 8B teacher - Qwen3 4B student
echo 8 synthetic exams, with answers and explanations
echo On a CPU, each exam may take time; keep this window open.
echo.
node "server\seyveo-auto-school\run.mjs" --count=8
if errorlevel 1 (
 echo.
 echo A school error occurred. The previous report was not reopened.
 goto finish
)
if exist "%LOCALAPPDATA%\SEYVEO\auto-school\last-session.html" (
 echo.
 echo Opening the SEYVEO school diary...
 start "" "%LOCALAPPDATA%\SEYVEO\auto-school\last-session.html"
)
:finish
echo.
pause
