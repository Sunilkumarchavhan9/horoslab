[CmdletBinding(SupportsShouldProcess)]
param(
  [string]$Region = $(if ($env:AWS_DEFAULT_REGION) { $env:AWS_DEFAULT_REGION } else { "ap-south-1" }),
  [string]$Profile = $(if ($env:AWS_PROFILE) { $env:AWS_PROFILE } else { "epoch-deployer" }),
  [ValidateSet("dev", "staging", "production")]
  [string]$Environment = "production"
)

$ErrorActionPreference = "Stop"
$aws = @("--region", $Region, "--profile", $Profile, "--no-cli-pager")

function Invoke-AwsJson([string[]]$Arguments) {
  $raw = & aws @Arguments
  if ($LASTEXITCODE -ne 0) { throw "AWS CLI command failed: aws $($Arguments -join ' ')" }
  if (-not $raw) { return $null }
  return ($raw -join "`n" | ConvertFrom-Json)
}

function Test-AwsCommand([string[]]$Arguments) {
  $previous = $ErrorActionPreference
  try {
    $ErrorActionPreference = "Continue"
    & aws @Arguments 2>$null | Out-Null
    return ($LASTEXITCODE -eq 0)
  } finally { $ErrorActionPreference = $previous }
}

if (-not $PSCmdlet.ShouldProcess("AWS account", "Bootstrap Epoch $Environment foundation in $Region")) { return }

$identity = Invoke-AwsJson (@("sts", "get-caller-identity") + $aws)
$accountId = [string]$identity.Account
if ($accountId -notmatch "^\d{12}$") { throw "Unable to resolve a valid AWS account ID" }

$repositories = @("epoch-backend", "epoch-frontend", "epoch-worker")
foreach ($repository in $repositories) {
  if (Test-AwsCommand (@("ecr", "describe-repositories", "--repository-names", $repository) + $aws)) { Write-Host "ECR exists: $repository"; continue }
  Invoke-AwsJson (@("ecr", "create-repository", "--repository-name", $repository, "--image-scanning-configuration", "scanOnPush=true", "--encryption-configuration", "encryptionType=AES256") + $aws) | Out-Null
  Write-Host "ECR created: $repository"
}

$bucket = "epoch-artifacts-$accountId-$Region"
if (-not (Test-AwsCommand (@("s3api", "head-bucket", "--bucket", $bucket) + $aws))) {
  if ($Region -eq "us-east-1") { & aws s3api create-bucket --bucket $bucket @aws | Out-Null }
  else { & aws s3api create-bucket --bucket $bucket --create-bucket-configuration LocationConstraint=$Region @aws | Out-Null }
  if ($LASTEXITCODE -ne 0) { throw "Failed to create S3 bucket $bucket" }
  Write-Host "S3 created: $bucket"
} else { Write-Host "S3 exists: $bucket" }
Invoke-AwsJson (@("s3api", "put-public-access-block", "--bucket", $bucket, "--public-access-block-configuration", "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true") + $aws) | Out-Null
$encryptionFile = Join-Path ([System.IO.Path]::GetTempPath()) "epoch-s3-encryption-$PID.json"
@'
{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}
'@ | Set-Content -LiteralPath $encryptionFile -Encoding ascii
try { Invoke-AwsJson (@("s3api", "put-bucket-encryption", "--bucket", $bucket, "--server-side-encryption-configuration", "file://$encryptionFile") + $aws) | Out-Null }
finally { Remove-Item -LiteralPath $encryptionFile -Force -ErrorAction SilentlyContinue }
Write-Host "S3 security configured: $bucket"

$queues = @("epoch-$Environment-missions", "epoch-$Environment-runtime", "epoch-$Environment-dead-letter")
foreach ($queue in $queues) {
  if (Test-AwsCommand (@("sqs", "get-queue-url", "--queue-name", $queue) + $aws)) { Write-Host "SQS exists: $queue"; continue }
  & aws sqs create-queue --queue-name $queue --attributes VisibilityTimeout=900,MessageRetentionPeriod=1209600 @aws | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "Failed to create SQS queue $queue" }
  Write-Host "SQS created: $queue"
}

$logGroups = @("/epoch/$Environment/api", "/epoch/$Environment/worker")
foreach ($logGroup in $logGroups) {
  $groups = Invoke-AwsJson (@("logs", "describe-log-groups", "--log-group-name-prefix", $logGroup) + $aws)
  if ($groups.logGroups | Where-Object { $_.logGroupName -eq $logGroup }) { Write-Host "CloudWatch exists: $logGroup"; continue }
  & aws logs create-log-group --log-group-name $logGroup @aws | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "Failed to create CloudWatch log group $logGroup" }
  & aws logs put-retention-policy --log-group-name $logGroup --retention-in-days 30 @aws | Out-Null
  Write-Host "CloudWatch created: $logGroup"
}

Write-Host "Epoch AWS foundation bootstrap complete for account $accountId in $Region ($Environment)."
