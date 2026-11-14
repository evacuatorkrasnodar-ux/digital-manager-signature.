@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"
title SEYVEO - Sayvi Project Introduction
echo SEYVEO - Recording the full Sayvi project introduction
echo.
py -3.11 "server\seyveo-voice-school\record_project_intro.py"
echo.
if errorlevel 1 (
    echo The recording was not completed. Read the error above.
) else (
    echo Recording complete. Check your Downloads folder.
)
pause
