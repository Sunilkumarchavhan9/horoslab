param(
  [string]$GatewayUrl = "http://localhost:3011",
  [string]$ProviderToken = "dev-desktop-token",
  [string]$ThreadId = "desktop-smoke-$([DateTimeOffset]::UtcNow.ToUnixTimeSeconds())",
  [string]$TargetId = "ubuntu-vnc-a",
  [string]$OsType = "ubuntu",
  [string]$ScreenshotPath = ".memoryostm\desktop-smoke-ubuntu.png",
  [switch]$SkipInput,
  [switch]$SkipStop
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Net.Http

function Join-Url([string]$Base, [string]$Path) {
  return "$($Base.TrimEnd('/'))/$($Path.TrimStart('/'))"
}

function Invoke-JsonRequest {
  param(
    [Parameter(Mandatory = $true)][string]$Method,
    [Parameter(Mandatory = $true)][string]$Uri,
    [object]$Body = $null,
    [hashtable]$Headers = @{}
  )

  $request = @{
    Method = $Method
    Uri = $Uri
    Headers = $Headers
    TimeoutSec = 20
  }
  if ($null -ne $Body) {
    $request.ContentType = "application/json"
    $request.Body = ($Body | ConvertTo-Json -Depth 12)
  }
  Invoke-RestMethod @request
}

function Invoke-StatusRequest {
  param(
    [Parameter(Mandatory = $true)][string]$Method,
    [Parameter(Mandatory = $true)][string]$Uri,
    [hashtable]$Headers = @{},
    [int]$TimeoutSeconds = 20
  )

  $client = [System.Net.Http.HttpClient]::new()
  try {
    $client.Timeout = [TimeSpan]::FromSeconds($TimeoutSeconds)
    $request = [System.Net.Http.HttpRequestMessage]::new([System.Net.Http.HttpMethod]::new($Method), $Uri)
    foreach ($header in $Headers.GetEnumerator()) {
      [void]$request.Headers.TryAddWithoutValidation([string]$header.Key, [string]$header.Value)
    }
    $response = $client.SendAsync($request).GetAwaiter().GetResult()
    return [int]$response.StatusCode
  } finally {
    if ($null -ne $request) {
      $request.Dispose()
    }
    $client.Dispose()
  }
}

function Save-BinaryRequest {
  param(
    [Parameter(Mandatory = $true)][string]$Uri,
    [Parameter(Mandatory = $true)][string]$Path,
    [hashtable]$Headers = @{},
    [int]$TimeoutSeconds = 30
  )

  $client = [System.Net.Http.HttpClient]::new()
  try {
    $client.Timeout = [TimeSpan]::FromSeconds($TimeoutSeconds)
    $request = [System.Net.Http.HttpRequestMessage]::new([System.Net.Http.HttpMethod]::Get, $Uri)
    foreach ($header in $Headers.GetEnumerator()) {
      [void]$request.Headers.TryAddWithoutValidation([string]$header.Key, [string]$header.Value)
    }
    $response = $client.SendAsync($request).GetAwaiter().GetResult()
    if (-not $response.IsSuccessStatusCode) {
      throw "Binary request failed with HTTP $([int]$response.StatusCode)."
    }
    $bytes = $response.Content.ReadAsByteArrayAsync().GetAwaiter().GetResult()
    $resolvedPath = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($Path)
    [System.IO.File]::WriteAllBytes($resolvedPath, $bytes)
  } finally {
    if ($null -ne $request) {
      $request.Dispose()
    }
    $client.Dispose()
  }
}

function Assert-Truthy([bool]$Condition, [string]$Message) {
  if (-not $Condition) {
    throw $Message
  }
}

function Wait-ForJsonRequest {
  param(
    [Parameter(Mandatory = $true)][string]$Method,
    [Parameter(Mandatory = $true)][string]$Uri,
    [hashtable]$Headers = @{},
    [int]$Attempts = 30,
    [int]$DelaySeconds = 2
  )

  $lastError = $null
  for ($attempt = 1; $attempt -le $Attempts; $attempt++) {
    try {
      return Invoke-JsonRequest -Method $Method -Uri $Uri -Headers $Headers
    } catch {
      $lastError = $_.Exception.Message
      if ($attempt -ge $Attempts) {
        break
      }
      Start-Sleep -Seconds $DelaySeconds
    }
  }

  throw "Request did not become available after $Attempts attempts: $Uri. Last error: $lastError"
}

function Assert-PngOrImageFile([string]$Path) {
  Assert-Truthy (Test-Path -LiteralPath $Path) "Screenshot file was not written: $Path"
  $bytes = [System.IO.File]::ReadAllBytes((Resolve-Path -LiteralPath $Path))
  Assert-Truthy ($bytes.Length -ge 8) "Screenshot file is too small to be a valid image."
  $pngMagic = @(137, 80, 78, 71, 13, 10, 26, 10)
  $isPng = $true
  for ($i = 0; $i -lt $pngMagic.Count; $i++) {
    if ($bytes[$i] -ne $pngMagic[$i]) {
      $isPng = $false
      break
    }
  }
  Assert-Truthy $isPng "Screenshot did not start with PNG bytes. The gateway may have returned HTML or an error page."
}

$headers = @{ Authorization = "Bearer $ProviderToken" }
$escapedTarget = [uri]::EscapeDataString($TargetId)

Write-Host "MemoryOSTM Ubuntu desktop smoke"
Write-Host "Gateway: $GatewayUrl"
Write-Host "Thread:  $ThreadId"

$gatewayHealth = Wait-ForJsonRequest -Method GET -Uri (Join-Url $GatewayUrl "/desktop-gateway/health")
if (-not [bool]$gatewayHealth.ok) {
  $targetCount = @($gatewayHealth.targets).Count
  throw "Desktop gateway is not healthy. targets=$targetCount. If this is localhost:3011, restart with: powershell -ExecutionPolicy Bypass -File infra/desktop-fleet/start-local-gateway.ps1 -RestartExisting"
}
Assert-Truthy (($gatewayHealth.targets | Where-Object { $_.id -eq $TargetId -and $_.hasHttpProxy -and $_.hasInputAdapter -and $_.hasScreenshotCapture }) -ne $null) "Gateway target '$TargetId' is missing proxy/input/screenshot support."
Write-Host "OK gateway health"

$providerHealth = Invoke-JsonRequest -Method GET -Uri (Join-Url $GatewayUrl "/internal/desktop-provider/desktop/health") -Headers $headers
Assert-Truthy ([bool]$providerHealth.ok) "Desktop provider is not healthy."
Assert-Truthy ($providerHealth.mode -eq "fleet") "Desktop provider is not running in fleet mode. mode=$($providerHealth.mode). Restart with: powershell -ExecutionPolicy Bypass -File infra/desktop-fleet/start-local-gateway.ps1 -RestartExisting"
Write-Host "OK provider health: mode=$($providerHealth.mode)"

$start = Invoke-JsonRequest `
  -Method POST `
  -Uri (Join-Url $GatewayUrl "/internal/desktop-provider/desktop/sessions/start") `
  -Headers $headers `
  -Body @{ threadId = $ThreadId; osType = $OsType }

$session = $start.session
Assert-Truthy ($null -ne $session) "Provider did not return a session."
Assert-Truthy ($session.state -eq "live") "Desktop session is not live. State: $($session.state)"
Assert-Truthy ($session.nodeId -eq $TargetId) "Expected node '$TargetId', got '$($session.nodeId)'."
Assert-Truthy (-not [string]::IsNullOrWhiteSpace($session.providerSessionId)) "Session is missing providerSessionId."
Assert-Truthy (-not [string]::IsNullOrWhiteSpace($session.sessionAuthToken)) "Session is missing sessionAuthToken."
Write-Host "OK session live: $($session.providerSessionId)"

$escapedSessionId = [uri]::EscapeDataString([string]$session.providerSessionId)
$escapedToken = [uri]::EscapeDataString([string]$session.sessionAuthToken)

$authorizeUrl = Join-Url $GatewayUrl "/desktop-gateway/sessions/$escapedSessionId/authorize?token=$escapedToken"
$authorizeStatus = Invoke-StatusRequest -Method GET -Uri $authorizeUrl -TimeoutSeconds 20
Assert-Truthy ($authorizeStatus -eq 204) "Gateway authorization failed with status $authorizeStatus."
Write-Host "OK gateway auth"

if (-not $SkipInput) {
  $inputUrl = Join-Url $GatewayUrl "/desktop-gateway/sessions/$escapedSessionId/input?target=$escapedTarget&token=$escapedToken"
  $input = Invoke-JsonRequest `
    -Method POST `
    -Uri $inputUrl `
    -Body @{ event = @{ type = "mouse_move"; x = 320; y = 240 } }
  Assert-Truthy ([bool]$input.accepted) "Desktop input was rejected: $($input.message)"
  Write-Host "OK input accepted"
}

$screenshotDir = Split-Path -Parent $ScreenshotPath
if (-not [string]::IsNullOrWhiteSpace($screenshotDir)) {
  New-Item -ItemType Directory -Force -Path $screenshotDir | Out-Null
}

$screenshotUrl = Join-Url $GatewayUrl "/desktop-gateway/sessions/$escapedSessionId/screenshot?target=$escapedTarget&token=$escapedToken"
Save-BinaryRequest -Uri $screenshotUrl -Path $ScreenshotPath -TimeoutSeconds 30
Assert-PngOrImageFile $ScreenshotPath
Write-Host "OK screenshot captured: $ScreenshotPath"

if (-not $SkipStop) {
  $stop = Invoke-JsonRequest `
    -Method POST `
    -Uri (Join-Url $GatewayUrl "/internal/desktop-provider/desktop/sessions/stop") `
    -Headers $headers `
    -Body @{ threadId = $ThreadId; osType = $OsType }
  Assert-Truthy (($stop.session.state -eq "idle") -or ($stop.session.state -eq "stale")) "Desktop session did not stop cleanly. State: $($stop.session.state)"
  Write-Host "OK session stopped"
}

Write-Host "MemoryOSTM Ubuntu desktop smoke passed."
