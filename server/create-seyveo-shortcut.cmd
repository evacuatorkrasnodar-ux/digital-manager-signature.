@echo off
chcp 65001 >nul
setlocal

rem Create ONE real Windows shortcut; never copy server files to Desktop.
set "SEYVEO_TARGET=%~dp0start-real-seyveo.cmd"
set "SEYVEO_WORK_DIR=%~dp0"

if not exist "%~dp0real-app-local.mjs" (
 echo This installer must be run from the SEYVEO project's server folder.
 pause
 exit /b 1
)

where powershell >nul 2>nul
if errorlevel 1 (
 echo Windows PowerShell is required to create the shortcut.
 pause
 exit /b 1
)

powershell -NoProfile -Command "$ErrorActionPreference='Stop'; $desktop=[Environment]::GetFolderPath('Desktop'); $shortcut=(New-Object -ComObject WScript.Shell).CreateShortcut((Join-Path $desktop 'SEYVEO.lnk')); $shortcut.TargetPath=$env:SEYVEO_TARGET; $shortcut.WorkingDirectory=$env:SEYVEO_WORK_DIR; $shortcut.Description='SEYVEO - local assistant'; $shortcut.Save(); Write-Output ('SEYVEO shortcut: ' + (Join-Path $desktop 'SEYVEO.lnk'))"
if errorlevel 1 (
 echo Failed to create the shortcut. Check Desktop folder permissions.
 pause
 exit /b 1
)

echo.
echo Done. Use the single SEYVEO shortcut on your Desktop.
echo Old copied .cmd files are not needed; this installer does not delete them.
pause
