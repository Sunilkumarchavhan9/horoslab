param([switch]$InstallPythonPackages)
$ErrorActionPreference = 'Stop'
$distro = 'Ubuntu-22.04'
wsl -d $distro -- sudo apt-get update
wsl -d $distro -- sudo apt-get install -y python3-pip python3-venv
wsl -d $distro -- bash -lc "python3 -m venv ~/.epoch-venv"
if ($InstallPythonPackages) {
  wsl -d $distro -- bash -lc "source ~/.epoch-venv/bin/activate && python -m pip install --upgrade pip && python -m pip install safetensors onnxruntime diffusers transformers peft"
  Write-Output 'Installed Python format validators. vLLM/SGLang/TensorRT-LLM remain Docker GPU images because they require CUDA-specific Linux builds.'
}
Write-Output 'WSL runtime base is ready. Use .\scripts\epoch-runtime-infra.ps1 check to verify Docker GPU passthrough.'
