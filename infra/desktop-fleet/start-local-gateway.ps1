param(
  [string]$Port = "3011",
  [string]$ProviderToken = "dev-desktop-token",
  [string]$UbuntuHttpBaseUrl = "http://localhost:6090",
  [string]$UbuntuContainerHttpBaseUrl = "http://ubuntu-desktop-a:3000",
  [string]$UbuntuScreenshotUrl = "",
  [string]$WindowsHttpBaseUrl = "https://windows-gateway.example",
  [string]$WindowsInputUrl = "https://windows-gateway.example/sessions/{sessionId}/input",
  [string]$WindowsScreenshotUrl = "https://windows-gateway.example/sessions/{sessionId}/screenshot.png",
  [string]$WindowsWsUrl = "wss://windows-gateway.example/sessions/{sessionId}/ws",
  [switch]$RestartExisting
)

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$outLog = Join-Path $repoRoot "desktop-gateway-$Port.out.log"
$errLog = Join-Path $repoRoot "desktop-gateway-$Port.err.log"
$runDir = Join-Path $repoRoot ".memoryostm"
$runScript = Join-Path $runDir "desktop-gateway-local.ps1"
$resolvedUbuntuScreenshotUrl = if ($UbuntuScreenshotUrl.Trim()) { $UbuntuScreenshotUrl.Trim() } else { "$UbuntuHttpBaseUrl/sessions/{sessionId}/screenshot.png" }

function Get-ListeningProcessId([int]$LocalPort) {
  $connection = Get-NetTCPConnection -LocalPort $LocalPort -State Listen -ErrorAction SilentlyContinue |
    Select-Object -First 1
  if ($null -eq $connection) {
    return $null
  }
  return [int]$connection.OwningProcess
}

$existingPid = Get-ListeningProcessId ([int]$Port)
if ($null -ne $existingPid) {
  if (-not $RestartExisting) {
    $process = Get-Process -Id $existingPid -ErrorAction SilentlyContinue
    $processName = if ($null -ne $process) { $process.ProcessName } else { "unknown" }
    throw "Port $Port is already in use by PID $existingPid ($processName). Re-run with -RestartExisting to stop it before starting the MemoryOSTM desktop gateway."
  }
  Write-Host "Stopping existing process on port $Port (PID $existingPid) before starting desktop gateway..."
  Stop-Process -Id $existingPid -Force
  Start-Sleep -Milliseconds 700
}

$gatewayTargets = @(
  @{
    id = "ubuntu-vnc-a"
    label = "Ubuntu VNC A"
    osTypes = @("ubuntu")
    httpBaseUrl = $UbuntuHttpBaseUrl
    inputUrlTemplate = "$UbuntuHttpBaseUrl/input/{sessionId}"
    screenshotUrlTemplate = $resolvedUbuntuScreenshotUrl
    wsUrlTemplate = "ws://localhost:6080/websockify?token={sessionId}"
    healthy = $true
  },
  @{
    id = "windows-rdp-a"
    label = "Windows RDP A"
    osTypes = @("windows")
    httpBaseUrl = $WindowsHttpBaseUrl
    inputUrlTemplate = $WindowsInputUrl
    screenshotUrlTemplate = $WindowsScreenshotUrl
    wsUrlTemplate = $WindowsWsUrl
    healthy = $true
  }
) | ConvertTo-Json -Compress -Depth 8

$fleet = @(
  @{
    id = "ubuntu-vnc-a"
    label = "Ubuntu VNC A"
    osTypes = @("ubuntu")
    capacity = 30
    transportMode = "vnc"
    previewUrlTemplate = "http://localhost:$Port/desktop-gateway/sessions/{sessionId}/view?target=ubuntu-vnc-a&token={token}"
    controlUrlTemplate = "http://localhost:$Port/desktop-gateway/sessions/{sessionId}/view?target=ubuntu-vnc-a&token={token}"
    inputUrlTemplate = "http://localhost:$Port/desktop-gateway/sessions/{sessionId}/input?target=ubuntu-vnc-a&token={token}"
    screenshotUrlTemplate = "http://localhost:$Port/desktop-gateway/sessions/{sessionId}/screenshot?target=ubuntu-vnc-a&token={token}"
    wsUrlTemplate = "ws://localhost:6080/websockify?token={sessionId}"
  },
  @{
    id = "windows-rdp-a"
    label = "Windows RDP A"
    osTypes = @("windows")
    capacity = 20
    transportMode = "vnc"
    previewUrlTemplate = "http://localhost:$Port/desktop-gateway/sessions/{sessionId}/view?target=windows-rdp-a&token={token}"
    controlUrlTemplate = "http://localhost:$Port/desktop-gateway/sessions/{sessionId}/view?target=windows-rdp-a&token={token}"
    inputUrlTemplate = "http://localhost:$Port/desktop-gateway/sessions/{sessionId}/input?target=windows-rdp-a&token={token}"
    screenshotUrlTemplate = "http://localhost:$Port/desktop-gateway/sessions/{sessionId}/screenshot?target=windows-rdp-a&token={token}"
  }
) | ConvertTo-Json -Compress -Depth 8

$envBlock = @"
`$env:NODE_ENV='development'
`$env:PORT='$Port'
`$env:MEMORYOSTM_DESKTOP_PROVIDER='external'
`$env:MEMORYOSTM_DESKTOP_PROVIDER_BASE_URL='http://localhost:$Port/internal/desktop-provider'
`$env:MEMORYOSTM_DESKTOP_PROVIDER_TOKEN='$ProviderToken'
`$env:MEMORYOSTM_DESKTOP_BRIDGE_MODE='fleet'
`$env:MEMORYOSTM_DESKTOP_GATEWAY_TARGETS_JSON='$($gatewayTargets.Replace("'", "''"))'
`$env:MEMORYOSTM_DESKTOP_FLEET_JSON='$($fleet.Replace("'", "''"))'
node .\node_modules\tsx\dist\cli.mjs .\server\index.ts
"@

New-Item -ItemType Directory -Force -Path $runDir | Out-Null
Set-Content -LiteralPath $runScript -Value $envBlock -Encoding UTF8

Start-Process `
  -FilePath "powershell" `
  -ArgumentList @("-NoProfile", "-ExecutionPolicy", "Bypass", "-File", $runScript) `
  -WorkingDirectory $repoRoot `
  -RedirectStandardOutput $outLog `
  -RedirectStandardError $errLog `
  -WindowStyle Hidden

Write-Host "MemoryOSTM desktop gateway starting on http://localhost:$Port"
Write-Host "Logs:"
Write-Host "  $outLog"
Write-Host "  $errLog"
