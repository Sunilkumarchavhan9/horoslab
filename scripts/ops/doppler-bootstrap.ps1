param(
  [string]$Project = "memoryos-",
  [string]$BackendConfig = "prd_backend_prod",
  [string]$FrontendConfig = "prd_frontend_prod",
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

function Config-Exists([string]$project, [string]$config) {
  $result = doppler configs get $config --project $project --json 2>$null
  return $LASTEXITCODE -eq 0 -and $result
}

Write-Host "== MemoryOS Doppler bootstrap ==" -ForegroundColor Cyan
Write-Host "Project: $Project"
Write-Host "Backend config: $BackendConfig"
Write-Host "Frontend config: $FrontendConfig"

Write-Host "`n1) Validate project/configs..." -ForegroundColor Yellow
if (-not (doppler projects get $Project --json 2>$null)) {
  Write-Warning "Project '$Project' not found in Doppler."
  Write-Host "Create it first, then re-run:"
  Write-Host "  doppler projects create $Project"
  exit 1
}

if (-not (Config-Exists $Project $BackendConfig)) {
  Write-Warning "Backend config '$BackendConfig' not found in project '$Project'."
  Write-Host "Create it first, then re-run:"
  Write-Host "  doppler configs create $BackendConfig --project $Project --environment prd"
  exit 1
}

if (-not (Config-Exists $Project $FrontendConfig)) {
  Write-Warning "Frontend config '$FrontendConfig' not found in project '$Project'."
  Write-Host "Create it first, then re-run:"
  Write-Host "  doppler configs create $FrontendConfig --project $Project --environment prd"
  exit 1
}

if (Test-Path $BackendEnvFile) {
  Write-Host "`n2) Import backend template keys into Doppler config '$BackendConfig'..." -ForegroundColor Green
  doppler secrets upload $BackendEnvFile --project $Project --config $BackendConfig
} else {
  Write-Warning "Backend env file not found: $BackendEnvFile"
}

if (Test-Path $FrontendEnvFile) {
  Write-Host "`n3) Import frontend template keys into Doppler config '$FrontendConfig'..." -ForegroundColor Green
  doppler secrets upload $FrontendEnvFile --project $Project --config $FrontendConfig
} else {
  Write-Warning "Frontend env file not found: $FrontendEnvFile"
}

Write-Host "`n4) Validate observability env in current shell:" -ForegroundColor Yellow
Write-Host "   doppler run --project $Project --config $BackendConfig -- npm run ops:check:observability:backend"
Write-Host "   doppler run --project $Project --config $FrontendConfig -- npm run ops:check:observability:frontend"

Write-Host "`nDone. Fill real secret values in Doppler dashboard before prod deploy." -ForegroundColor Cyan
