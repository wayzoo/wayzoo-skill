# Wayzoo installer for Windows (PowerShell, native: no WSL, no Git Bash, no Bash).
# Usage:
#   .\install.ps1                  build dist\wayzoo.skill and show the Claude upload steps
#   .\install.ps1 --open           also open the folder in Explorer
#   .\install.ps1 --claude-code    install for Claude Code (%USERPROFILE%\.claude\skills\wayzoo)
# If scripts are blocked: powershell -ExecutionPolicy Bypass -File .\install.ps1
$ErrorActionPreference = "Stop"

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "Node.js 18+ is required. Install it with:  winget install OpenJS.NodeJS.LTS"
    Write-Host "or download it from https://nodejs.org, then open a new terminal and run this again."
    exit 1
}

& node (Join-Path $PSScriptRoot "install.mjs") @args
exit $LASTEXITCODE
