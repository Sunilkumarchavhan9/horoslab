param([ValidateSet('check','vllm','sglang','tei','down')] [string]$Action = 'check')
$ErrorActionPreference = 'Stop'
$compose = Join-Path $PSScriptRoot '..\infra\epoch-runtime\docker-compose.yml'
if ($Action -eq 'check') { docker info | Out-Null; docker run --rm --gpus all nvidia/cuda:12.6.3-base-ubuntu22.04 nvidia-smi --query-gpu=name,memory.total,memory.free --format=csv,noheader,nounits; exit 0 }
if ($Action -eq 'down') { docker compose -f $compose --profile vllm --profile sglang --profile tei down; exit 0 }
$env:EPOCH_RUNTIME_VLLM_ENDPOINT = 'http://127.0.0.1:8000/'
$env:EPOCH_RUNTIME_SGLANG_ENDPOINT = 'http://127.0.0.1:30000/'
$env:EPOCH_RUNTIME_TEI_ENDPOINT = 'http://127.0.0.1:8080/'
docker compose -f $compose --profile $Action up -d
Write-Output "Started $Action. Set the matching EPOCH_RUNTIME_*_ENDPOINT in the backend process and run npm run epoch:runtime:matrix-smoke."
