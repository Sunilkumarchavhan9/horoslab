param(
  [string]$Owner,
  [string]$Repo,
  [string]$Branch = "main",
  [string]$RequiredCheck = "quality"
)

$ErrorActionPreference = "Stop"

function Resolve-RepoFromGitRemote {
  $origin = git remote get-url origin 2>$null
  if (-not $origin) {
    throw "Could not read git remote 'origin'."
  }

  if ($origin -match "github\.com[:/](?<owner>[^/]+)/(?<repo>[^/.]+)(\.git)?$") {
    return @{
      Owner = $Matches.owner
      Repo  = $Matches.repo
    }
  }

  throw "Could not parse owner/repo from origin remote: $origin"
}

function Invoke-GitHubApi {
  param(
    [ValidateSet("GET", "PUT", "PATCH")]
    [string]$Method,
    [string]$Uri,
    [object]$Body
  )

  $token = $env:GITHUB_TOKEN
  if (-not $token) {
    $token = $env:GH_TOKEN
  }
  if (-not $token) {
    throw "Missing GitHub token. Set GITHUB_TOKEN (or GH_TOKEN) with repo admin permission."
  }

  $headers = @{
    Authorization           = "Bearer $token"
    Accept                  = "application/vnd.github+json"
    "X-GitHub-Api-Version"  = "2022-11-28"
  }

  if ($null -eq $Body) {
    return Invoke-RestMethod -Method $Method -Uri $Uri -Headers $headers
  }

  $json = $Body | ConvertTo-Json -Depth 20
  return Invoke-RestMethod -Method $Method -Uri $Uri -Headers $headers -ContentType "application/json" -Body $json
}

if (-not $Owner -or -not $Repo) {
  $resolved = Resolve-RepoFromGitRemote
  if (-not $Owner) { $Owner = $resolved.Owner }
  if (-not $Repo) { $Repo = $resolved.Repo }
}

$apiBase = "https://api.github.com/repos/$Owner/$Repo/branches/$Branch"

Write-Host "Applying branch protection for $Owner/$Repo on '$Branch'..."
Write-Host "Required status check: $RequiredCheck"

try {
  $requiredChecksBody = @{
    strict = $true
    checks = @(
      @{
        context = $RequiredCheck
      }
    )
  }

  Invoke-GitHubApi -Method "PATCH" -Uri "$apiBase/protection/required_status_checks" -Body $requiredChecksBody | Out-Null
  Write-Host "Updated required status checks on existing branch protection."
}
catch {
  Write-Host "No existing protection detected or patch failed. Creating baseline protection..."

  $fullProtectionBody = @{
    required_status_checks = @{
      strict = $true
      checks = @(
        @{
          context = $RequiredCheck
        }
      )
    }
    enforce_admins = $true
    required_pull_request_reviews = $null
    restrictions = $null
    required_conversation_resolution = $true
    allow_force_pushes = $false
    allow_deletions = $false
    block_creations = $false
    required_linear_history = $false
    lock_branch = $false
    allow_fork_syncing = $true
  }

  Invoke-GitHubApi -Method "PUT" -Uri "$apiBase/protection" -Body $fullProtectionBody | Out-Null
  Write-Host "Created baseline branch protection and required '$RequiredCheck' check."
}

Write-Host "Done."

