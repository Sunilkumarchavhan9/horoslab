[CmdletBinding(SupportsShouldProcess)]
param(
  [string]$Region = $(if ($env:AWS_DEFAULT_REGION) { $env:AWS_DEFAULT_REGION } else { "ap-south-1" }),
  [string]$Profile = $(if ($env:AWS_PROFILE) { $env:AWS_PROFILE } else { "epoch-deployer" }),
  [string]$Tag = $(if ($env:EPOCH_IMAGE_TAG) { $env:EPOCH_IMAGE_TAG } else { "latest" })
)

$ErrorActionPreference = "Stop"

function Invoke-Checked([string]$Command, [string[]]$Arguments) {
  & $Command @Arguments
  if ($LASTEXITCODE -ne 0) { throw "Command failed: $Command $($Arguments -join ' ')" }
}

if (-not $PSCmdlet.ShouldProcess("ECR epoch-backend and epoch-worker", "Build and push image tag $Tag")) { return }

docker info *> $null
if ($LASTEXITCODE -ne 0) { throw "Docker Engine is not running. Start Docker Desktop and run this script again." }

$identityJson = & aws sts get-caller-identity --region $Region --profile $Profile --no-cli-pager
if ($LASTEXITCODE -ne 0) { throw "AWS credentials are unavailable for profile $Profile in $Region." }
$identity = $identityJson | ConvertFrom-Json
$accountId = [string]$identity.Account
if ($accountId -notmatch '^\d{12}$') { throw "AWS caller identity did not return a valid account ID." }

$registry = "$accountId.dkr.ecr.$Region.amazonaws.com"
$repositories = @("epoch-backend", "epoch-worker")
foreach ($repository in $repositories) {
  & aws ecr describe-repositories --repository-names $repository --region $Region --profile $Profile --no-cli-pager *> $null
  if ($LASTEXITCODE -ne 0) { throw "ECR repository does not exist: $repository" }
}

$loginPassword = & aws ecr get-login-password --region $Region --profile $Profile --no-cli-pager
if ($LASTEXITCODE -ne 0) { throw "Unable to obtain the ECR login password." }
$loginPassword | docker login --username AWS --password-stdin $registry
if ($LASTEXITCODE -ne 0) { throw "Docker could not authenticate to $registry." }

$sourceTag = "epoch-build:$Tag"
Invoke-Checked "docker" @("build", "--pull", "-t", $sourceTag, ".")
foreach ($repository in $repositories) {
  $remoteTag = "$registry/$repository`:$Tag"
  Invoke-Checked "docker" @("tag", $sourceTag, $remoteTag)
  Invoke-Checked "docker" @("push", $remoteTag)
  Write-Host "Published $remoteTag"
}

Write-Host "Epoch images published successfully."
