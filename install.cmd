@echo off
rem Wayzoo installer for Windows (double-click friendly, no PowerShell policy issues, no WSL).
rem Usage: install.cmd [--open] [--claude-code] [--doctor]
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 18+ is required. Install it with: winget install OpenJS.NodeJS.LTS
  echo or download it from https://nodejs.org, then open a new terminal and run this again.
  if "%~1"=="" pause
  exit /b 1
)
node "%~dp0install.mjs" %*
set CODE=%ERRORLEVEL%
if "%~1"=="" pause
exit /b %CODE%
