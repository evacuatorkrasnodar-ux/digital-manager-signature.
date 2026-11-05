@echo off
setlocal EnableExtensions
chcp 65001 >nul
cd /d "%~dp0.."
echo.
echo SEYVEO - Russian stress laboratory
echo ----------------------------------
echo This is an optional pronunciation analysis only.
echo Approved voice model, recording and TTS remain unchanged.
echo.
where py >nul 2>nul
if errorlevel 1 (
  echo Python launcher py not found. Python 3.11 is required.
  pause
  exit /b 1
)
if not exist ".venv-ru-stress\Scripts\python.exe" (
  echo Creating a separate Python environment...
  py -3.11 -m venv .venv-ru-stress
  if errorlevel 1 (
    echo Could not create a separate Python 3.11 environment.
    pause
    exit /b 1
  )
)
set "PYTHON=.venv-ru-stress\Scripts\python.exe"
echo.
"%PYTHON%" -c "import ruaccent" >nul 2>nul
if errorlevel 1 (
  echo RUAccent is not installed in the isolated language environment.
  echo The next step downloads a third-party package and model assets.
  echo It will NOT install anything in the approved SEYVEO voice environment.
  choice /C YN /M "Install RUAccent in this separate environment"
  if errorlevel 2 (
    echo Cancelled. Voice is untouched.
    pause
    exit /b 0
  )
  "%PYTHON%" -m pip install ruaccent
  if errorlevel 1 (
    echo RUAccent installation failed. Voice is untouched.
    pause
    exit /b 1
  )
)
echo.
echo Running phrase stress analysis on CPU...
echo The first run may download external RUAccent model files.
"%PYTHON%" "server\russian-stress-batch.py" --output "stress-report.jsonl"
if errorlevel 1 (
  echo Stress analysis failed. See the message above.
  pause
  exit /b 1
)
echo.
echo Report saved in stress-report.jsonl
echo Send its text to the SEYVEO development chat for evaluation.
echo This report does NOT change how Sayvi speaks.
pause
endlocal
