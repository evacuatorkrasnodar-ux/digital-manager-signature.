@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo SEYVEO - отдельная проверка эталонного голоса.
echo Оригиналы не изменяются. Приложение не меняется.
echo.
py -3.11 "%~dp0compare-approved-voice.py"
if errorlevel 1 (
 echo.
 echo Ошибка теста. Сфотографируй это окно и пришли в чат.
) else (
 echo.
 echo Ищи новый WAV в %%LOCALAPPDATA%%\SEYVEO\voice-school
)
pause
