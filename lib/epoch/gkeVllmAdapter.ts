import { spawn } from "node:child_process";
import { createHash } from "node:crypto";

export type GkeVllmDeploymentInput = {
  name: string;
  model: string;
  image?: string;
  namespace?: string;
  gpuCount?: number;
  gpuType?: string;
  replicas?: number;
  port?: number;
  version: string;
};

export class GkeVllmAdapterError extends Error {
  constructor(message: string, public readonly code = "GKE_VLLM_FAILED") { super(message); this.name = "GkeVllmAdapterError"; }
}

function safeName(value: string) {
  const name = value.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "").slice(0,  fiftyFive());
  if (!name) throw new GkeVllmAdapterError("Deployment name is required", "INVALID_DEPLOYMENT_NAME");
  return name;
}
function fiftyFive() { return 55; }
function configured() { return process.env.EPOCH_GKE_KUBECTL_ENABLED?.trim().toLowerCase() === "true"; }
function namespace(value?: string) { const result = safeName(value || process.env.EPOCH_GKE_NAMESPACE || "epoch"); return result; }
function context() { const value = process.env.EPOCH_GKE_KUBECTL_CONTEXT?.trim(); return value || undefined; }

export function buildGkeVllmManifest(input: GkeVllmDeploymentInput) {
  const name = safeName(input.name); const ns = namespace(input.namespace); const model = input.model.trim();
  if (!model || model.length > 300) throw new GkeVllmAdapterError("Model is required", "INVALID_MODEL");
  const gpuCount = Math.max(1, Math.min(8, Math.floor(input.gpuCount ?? 1)));
  const replicas = Math.max(1, Math.min(20, Math.floor(input.replicas ?? 1)));
  const port = Math.max(1024, Math.min(65535, Math.floor(input.port ?? 8000)));
  const image = input.image?.trim() || process.env.EPOCH_GKE_VLLM_IMAGE?.trim();
  if (!image) throw new GkeVllmAdapterError("A pinned vLLM image must be provided", "VLLM_IMAGE_REQUIRED");
  const gpuType = input.gpuType?.trim();
  const selector = gpuType ? `\n        cloud.google.com/gke-accelerator: ${gpuType}` : "";
  return `apiVersion: v1
kind: Namespace
metadata:
  name: ${ns}
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${name}
  namespace: ${ns}
  labels:
    app.kubernetes.io/name: ${name}
    app.kubernetes.io/managed-by: epoch
    epoch.io/version: ${input.version}
spec:
  replicas: ${replicas}
  strategy:
    type: RollingUpdate
  selector:
    matchLabels:
      app.kubernetes.io/name: ${name}
  template:
    metadata:
      labels:
        app.kubernetes.io/name: ${name}
        app.kubernetes.io/managed-by: epoch
        epoch.io/version: ${input.version}
    spec:
      terminationGracePeriodSeconds: 60
      containers:
        - name: vllm
          image: ${image}
          imagePullPolicy: IfNotPresent
          args: ["--model", "${model}", "--host", "0.0.0.0", "--port", "${port}"]
          ports:
            - name: http
              containerPort: ${port}
          readinessProbe:
            httpGet: { path: /health, port: http }
            initialDelaySeconds: 30
            periodSeconds: 10
          livenessProbe:
            httpGet: { path: /health, port: http }
            initialDelaySeconds: 60
            periodSeconds: 20
          resources:
            requests:
              nvidia.com/gpu: "${gpuCount}"
            limits:
              nvidia.com/gpu: "${gpuCount}"
          securityContext:
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
            capabilities: { drop: ["ALL"] }
      nodeSelector:${selector || " {}"}
---
apiVersion: v1
kind: Service
metadata:
  name: ${name}
  namespace: ${ns}
  labels:
    app.kubernetes.io/name: ${name}
    app.kubernetes.io/managed-by: epoch
spec:
  selector:
    app.kubernetes.io/name: ${name}
  ports:
    - name: http
      port: ${port}
      targetPort: http
  type: ClusterIP
`;
}

function runKubectl(args: string[], input?: string) {
  if (!configured()) return Promise.reject(new GkeVllmAdapterError("GKE kubectl adapter is disabled; set EPOCH_GKE_KUBECTL_ENABLED=true", "GKE_NOT_CONFIGURED"));
  const contextArg = context() ? ["--context", context() as string] : [];
  return new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
    const child = spawn("kubectl", [...contextArg, ...args], { windowsHide: true, stdio: ["pipe", "pipe", "pipe"] });
    let stdout = ""; let stderr = "";
    child.stdout.on("data", (chunk: Buffer) => { stdout = `${stdout}${chunk.toString("utf8")}`.slice(0, 500_000); });
    child.stderr.on("data", (chunk: Buffer) => { stderr = `${stderr}${chunk.toString("utf8")}`.slice(0, 500_000); });
    child.on("error", (error) => reject(new GkeVllmAdapterError(error.message, "KUBECTL_UNAVAILABLE")));
    child.on("close", (code) => code === 0 ? resolve({ stdout, stderr }) : reject(new GkeVllmAdapterError(stderr.trim() || `kubectl exited with ${code}`, "KUBECTL_FAILED")));
    if (input !== undefined) { child.stdin.end(input); } else child.stdin.end();
  });
}

export async function deployGkeVllm(input: GkeVllmDeploymentInput) {
  const manifest = buildGkeVllmManifest(input);
  const applied = await runKubectl(["apply", "--server-side", "--field-manager=epoch", "-f", "-"], manifest);
  const rollout = await runKubectl(["-n", namespace(input.namespace), "rollout", "status", `deployment/${safeName(input.name)}`, "--timeout=15m"]);
  return { provider: "gke", runtime: "vllm", name: safeName(input.name), namespace: namespace(input.namespace), version: input.version, status: "ready", manifestSha256: createHash("sha256").update(manifest).digest("hex"), applyOutput: applied.stdout, rolloutOutput: rollout.stdout, observedAt: new Date().toISOString() };
}

export async function rollbackGkeVllm(input: { name: string; namespace?: string; toRevision?: number; reason: string }) {
  const args = ["-n", namespace(input.namespace), "rollout", "undo", `deployment/${safeName(input.name)}`, ...(input.toRevision ? [`--to-revision=${Math.floor(input.toRevision)}`] : [])];
  const result = await runKubectl(args);
  const status = await runKubectl(["-n", namespace(input.namespace), "rollout", "status", `deployment/${safeName(input.name)}`, "--timeout=15m"]);
  return { provider: "gke", runtime: "vllm", name: safeName(input.name), namespace: namespace(input.namespace), status: "rolled_back", reason: input.reason, output: result.stdout, rolloutOutput: status.stdout, observedAt: new Date().toISOString() };
}

export async function getGkeVllmStatus(input: { name: string; namespace?: string }) {
  const result = await runKubectl(["-n", namespace(input.namespace), "get", "deployment", safeName(input.name), "-o", "json"]);
  return { provider: "gke", runtime: "vllm", name: safeName(input.name), namespace: namespace(input.namespace), status: JSON.parse(result.stdout), observedAt: new Date().toISOString() };
}
