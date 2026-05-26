# Installs Visual Studio 2022 Build Tools with the C++ workload required by Rust/Tauri on Windows.
# Run in an elevated PowerShell if winget prompts for admin approval.
#
# After install: close all terminals, open a new one, then:
#   cd memoryos-ide
#   npm run dev

$ErrorActionPreference = "Stop"

Write-Host "Installing Visual Studio 2022 Build Tools (C++ workload)..." -ForegroundColor Cyan
Write-Host "This downloads several GB and can take 15–30 minutes." -ForegroundColor Yellow

winget install Microsoft.VisualStudio.2022.BuildTools `
  --accept-package-agreements `
  --accept-source-agreements `
  --override "--wait --passive --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended"

if ($LASTEXITCODE -ne 0) {
  Write-Host ""
  Write-Host "winget install failed (exit $LASTEXITCODE)." -ForegroundColor Red
  Write-Host "Install manually: https://visualstudio.microsoft.com/visual-cpp-build-tools/" -ForegroundColor Yellow
  Write-Host "Select workload: Desktop development with C++" -ForegroundColor Yellow
  exit $LASTEXITCODE
}

Write-Host ""
Write-Host "Verifying link.exe..." -ForegroundColor Cyan
$link = Get-ChildItem -Path "${env:ProgramFiles(x86)}\Microsoft Visual Studio\2022\BuildTools\VC\Tools\MSVC" `
  -Filter link.exe -Recurse -ErrorAction SilentlyContinue |
  Select-Object -First 1

if ($link) {
  Write-Host "Found: $($link.FullName)" -ForegroundColor Green
} else {
  Write-Host "link.exe not found yet — reboot or open a new terminal, then run: cargo --version && npm run dev" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Next: close this terminal, open a new PowerShell, then npm run dev in memoryos-ide." -ForegroundColor Green
