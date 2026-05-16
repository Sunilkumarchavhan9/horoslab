param(
  [string]$Project = "memoryos",
  [string]$BackendConfig = "backend_prod",
  [string]$FrontendConfig = "frontend_prod",
  [string]$BackendEnvFile = ".env.backend.example",
  [string]$FrontendEnvFile = "memoryos-frontend/.env.frontend.example"
)

$ErrorActionPreference = "Stop"

function Require-Command($name) {
  if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
    throw "Missing required command: $name"
  }
}

Require-Command "doppler"

Write-Host "== MemoryOS Doppler bootstrap ==" -ForegroundColor Cyan
Write-Host "Project: $Project"
Write-Host "Backend config: $BackendConfig"
Write-Host "Frontend config: $FrontendConfig"

Write-Host "`n1) Ensure project/configs exist (run manually if first time):" -ForegroundColor Yellow
Write-Host "   doppler projects create $Project"
Write-Host "   doppler configs create dev --project $Project"
Write-Host "   doppler configs create staging --project $Project"
Write-Host "   doppler configs create prod --project $Project"
Write-Host "   doppler configs create $BackendConfig --project $Project"
Write-Host "   doppler configs create $FrontendConfig --project $Project"

if (Test-Path $BackendEnvFile) {
  Write-Host "`n2) Import backend template keys into Doppler config '$BackendConfig'..." -ForegroundColor Green
  doppler secrets upload $BackendEnvFile --project $Project --config $BackendConfig --no-interactive
} else {
  Write-Warning "Backend env file not found: $BackendEnvFile"
}

if (Test-Path $FrontendEnvFile) {
  Write-Host "`n3) Import frontend template keys into Doppler config '$FrontendConfig'..." -ForegroundColor Green
  doppler secrets upload $FrontendEnvFile --project $Project --config $FrontendConfig --no-interactive
} else {
  Write-Warning "Frontend env file not found: $FrontendEnvFile"
}

Write-Host "`n4) Validate observability env in current shell:" -ForegroundColor Yellow
Write-Host "   npm run ops:check:observability"

Write-Host "`nDone. Fill real secret values in Doppler dashboard before prod deploy." -ForegroundColor Cyan
