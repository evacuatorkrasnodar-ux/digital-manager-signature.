@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
title SEYVEO - local vocal separation
set "ASR_PYTHON=.venv-seyveo-asr\Scripts\python.exe"
if not exist "%ASR_PYTHON%" (
 echo Сначала запусти install-note-transcription.cmd
 goto failed
)
echo Устанавливаю дополнительную модель отделения вокала. Нужен интернет только для установки.
"%ASR_PYTHON%" -m pip install torch==2.8.0 torchaudio==2.8.0 --index-url https://download.pytorch.org/whl/cpu
if errorlevel 1 goto failed
"%ASR_PYTHON%" -c "import os,torch; from torchaudio.pipelines import HDEMUCS_HIGH_MUSDB_PLUS; p=r'.venv-seyveo-asr\seyveo-vocals.pt'; m=HDEMUCS_HIGH_MUSDB_PLUS.get_model(); torch.save(m.state_dict(),p+'.tmp'); os.replace(p+'.tmp',p)"
if errorlevel 1 goto failed
echo Готово. Перезапусти локальный сервер SEYVEO. Песни остаются на устройстве.
pause
exit /b 0
:failed
echo Не удалось установить модель вокала. Обычное распознавание остаётся доступным.
pause
exit /b 1
