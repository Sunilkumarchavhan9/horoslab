# Start MemoryOS IDE (Tauri). Frontend must be on http://localhost:3000 first.
# Run from repo: .\memoryos-ide\scripts\start-dev.ps1

$ErrorActionPreference = "Stop"
$ideRoot = Split-Path $PSScriptRoot -Parent
$frontendUrl = "http://localhost:3000"

try {
  $r = Invoke-WebRequest -Uri $frontendUrl -UseBasicParsing -TimeoutSec 3
  Write-Host "Frontend OK ($frontendUrl)" -ForegroundColor Green
} catch {
  Write-Host "Frontend not reachable at $frontendUrl" -ForegroundColor Yellow
  Write-Host "In another terminal run:" -ForegroundColor Yellow
  Write-Host "  cd memoryos-frontend" -ForegroundColor Cyan
  Write-Host "  npm run dev:all" -ForegroundColor Cyan
  Write-Host ""
  $cont = Read-Host "Continue anyway? (y/N)"
  if ($cont -notmatch '^[yY]') { exit 1 }
}

Set-Location $ideRoot
Write-Host "Starting MemoryOS IDE (first compile may take several minutes)..." -ForegroundColor Cyan
npm run dev
