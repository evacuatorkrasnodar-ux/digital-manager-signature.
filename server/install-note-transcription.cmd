@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
title SEYVEO - local notebook voice recognition

echo.
echo SEYVEO - распознавание сохранённых записей
echo Установка локального Whisper. Записи не отправляются в интернет.
echo Понадобятся Python, интернет для скачивания модели и свободное место.
echo.

if not exist ".venv-seyveo-asr\Scripts\python.exe" (
  where py >nul 2>nul
  if errorlevel 1 (
    echo Нужен Python 3.11. Установи его с https://www.python.org/downloads/
    goto failed
  )
  py -3.11 -m venv ".venv-seyveo-asr"
  if errorlevel 1 (
    echo Не удалось создать отдельную среду Python для распознавания.
    goto failed
  )
)

set "ASR_PYTHON=.venv-seyveo-asr\Scripts\python.exe"
"%ASR_PYTHON%" -m pip install "faster-whisper>=1.1,<2"
if errorlevel 1 (
  echo Ошибка установки faster-whisper. Проверь интернет и Python.
  goto failed
)

echo.
echo Скачиваю модель small для русского языка. Это может занять несколько минут.
"%ASR_PYTHON%" -c "from faster_whisper import WhisperModel; WhisperModel('small', device='cpu', compute_type='int8')"
if errorlevel 1 (
  echo Не удалось подготовить модель. Попробуй запустить установщик ещё раз.
  goto failed
)

echo.
echo Готово! Перезапусти SEYVEO через свой обычный ярлык.
echo Открой заметку, нажми В текст на записи, затем Распознать запись.
pause
exit /b 0

:failed
echo.
echo SEYVEO не изменён. Попробуй снова после исправления ошибки выше.
pause
exit /b 1
