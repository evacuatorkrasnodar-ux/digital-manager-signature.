@echo off
setlocal EnableExtensions DisableDelayedExpansion
chcp 65001 >nul
cd /d "%~dp0"
set "OLLAMA_HOST=127.0.0.1:11434"
set "SEYVEO_ENABLE_LOCAL=1"
set "SEYVEO_ENABLE_CLOUD=0"
set "SEYVEO_ENABLE_PAPER_AI=1"
set "SEYVEO_PAPER_MODEL=qwen2.5vl:3b"
set "SEYVEO_LOCAL_MODEL=qwen3:4b-instruct"
set "SEYVEO_LOCAL_THREADS=8"

echo.
echo SEYVEO Paper - локальное рисование Сэйви
echo Все запросы к модели остаются на этом ПК.
echo.
where node >nul 2>nul
if errorlevel 1 (
 echo Нужен Node.js. Установка: https://nodejs.org/
 goto :failure
)
where ollama >nul 2>nul
if errorlevel 1 (
 echo Нужна Ollama для Windows: https://ollama.com/download/windows
 echo Установи Ollama и повторно запусти этот файл.
 goto :failure
)

node "%~dp0check-paper-model.mjs"
set "PAPER_CHECK=%ERRORLEVEL%"
if "%PAPER_CHECK%"=="0" goto :start_server
if "%PAPER_CHECK%"=="2" goto :download_model
if "%PAPER_CHECK%"=="3" (
 echo Запусти приложение Ollama в Windows и повтори запуск.
 echo Никакого внешнего сервера и платной модели не подключаем.
 goto :failure
)
echo Проверь локальную конфигурацию модели.
goto :failure

:download_model
echo.
echo Модель qwen2.5vl:3b займёт около 3.2 ГБ плюс служебные файлы.
echo Скачивать только после твоего подтверждения.
choice /C YN /M "Скачать модель рисования на этот ПК"
if errorlevel 2 goto :cancelled
ollama pull qwen2.5vl:3b
if errorlevel 1 (
 echo Не удалось скачать модель. Личные листы не изменены.
 goto :failure
)
node "%~dp0check-paper-model.mjs"
if errorlevel 1 goto :failure

:start_server
echo.
echo Модель готова. Открой http://127.0.0.1:8790/
echo Блокнот - Настройки - Действия - Попросить Сэйви.
echo Оставь это окно открытым. Завершить: Ctrl+C.
echo.
node "%~dp0real-app-local.mjs"
if errorlevel 1 goto :failure
goto :end

:cancelled
echo Скачивание отменено. Ничего не загружено.
goto :end

:failure
echo.
echo Сэйви не запускала удалённый ИИ и ничего не изменила в Блокноте.
pause
:end
endlocal
