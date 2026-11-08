@echo off
rem Wayzoo CLI for Windows. Usage: wayzoo setup|build|deps|doctor [args]
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 18+ is required. Install it with: winget install OpenJS.NodeJS.LTS
  exit /b 1
)
node "%~dp0skills\wayzoo\scripts\wayzoo.mjs" %*
exit /b %ERRORLEVEL%
