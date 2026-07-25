@echo off
setlocal
cd /d "%~dp0"

title Apex OS Launcher
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0ApexOS.ps1"
set "EXIT_CODE=%ERRORLEVEL%"

echo.
pause
exit /b %EXIT_CODE%
