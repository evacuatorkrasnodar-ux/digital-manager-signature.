@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo SEYVEO - включение утвержденного голоса в живом чате
echo Оригинальные записи не изменяются.
echo.
py -3.11 "%~dp0approved_voice.py"
echo.
pause
