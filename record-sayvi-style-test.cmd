@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"
title SEYVEO - Sayvi Voice Style Test
echo SEYVEO - Short live-style voice test
echo.
py -3.11 "server\seyveo-voice-school\record_style_test.py"
echo.
if errorlevel 1 (
    echo The test was not completed. Read the message above.
) else (
    echo Test complete. Listen to the WAV in Downloads.
)
pause
