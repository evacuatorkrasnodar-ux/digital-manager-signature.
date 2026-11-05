@echo off
setlocal EnableExtensions
chcp 65001 >nul
cd /d "%~dp0.."
echo.
echo SEYVEO - Document Reader Setup
echo ------------------------------
echo Installs a PDF text reader in a SEPARATE environment.
echo Does not change the Sayvi voice model, recordings or TTS.
echo Word, Excel and PowerPoint text extraction needs no package installation.
echo.
where py >nul 2>nul
if errorlevel 1 (
 echo Python 3.11 is required.
 pause
 exit /b 1
)
if not exist ".venv-seyveo-docs\Scripts\python.exe" (
 py -3.11 -m venv ".venv-seyveo-docs"
 if errorlevel 1 (
  echo Unable to create isolated document environment.
  pause
  exit /b 1
 )
)
set "DOCUMENT_PYTHON=.venv-seyveo-docs\Scripts\python.exe"
"%DOCUMENT_PYTHON%" -c "import pypdf" >nul 2>nul
if errorlevel 1 (
 echo PDF text extraction requires the third-party package pypdf.
 choice /C YN /M "Install pypdf in the separate document environment"
 if errorlevel 2 (
  echo Cancelled. Voice is unchanged.
  pause
  exit /b 0
 )
 "%DOCUMENT_PYTHON%" -m pip install "pypdf>=5,<7"
 if errorlevel 1 (
  echo Installation failed; Word and Excel may still work.
  pause
  exit /b 1
 )
)
echo.
echo Document reader ready for PDF, DOCX, XLSX and PPTX text.
echo Scanned PDFs require OCR, which is not included.
echo Restart SEYVEO local server if it is already running.
pause
endlocal
