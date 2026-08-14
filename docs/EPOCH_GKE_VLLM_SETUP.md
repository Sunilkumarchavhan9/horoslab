# Epoch GKE + vLLM backend setup

Epoch exposes these authenticated backend routes:

- `POST /api/epoch-runtime/workspaces/:workspaceId/gke/vllm/deploy`
- `POST /api/epoch-runtime/workspaces/:workspaceId/gke/vllm/status`
- `POST /api/epoch-runtime/workspaces/:workspaceId/gke/vllm/rollback`

The adapter uses the local `kubectl` context and fails closed unless this is configured:

```powershell
$env:EPOCH_GKE_KUBECTL_ENABLED = "true"
$env:EPOCH_GKE_KUBECTL_CONTEXT = "gke_<project>_<region>_<cluster>"
$env:EPOCH_GKE_NAMESPACE = "epoch"
```

Configure the cluster locally without putting credentials in application code:

```powershell
gcloud auth login
gcloud container clusters get-credentials <cluster> --region <region> --project <project>
kubectl config current-context
```

Example deployment payload:

```json
{
  "name": "llama-8b",
  "model": "meta-llama/Llama-3.1-8B-Instruct",
  "image": "vllm/vllm-openai@sha256:<pinned-digest>",
  "version": "hf-commit-sha",
  "gpuCount": 1,
  "gpuType": "nvidia-l4",
  "replicas": 1
}
```

The generated workload uses GPU resource limits, readiness/liveness probes, a read-only root filesystem, dropped Linux capabilities, and a ClusterIP service. Rollback uses Kubernetes deployment revision history and waits for the rollback rollout to complete.
