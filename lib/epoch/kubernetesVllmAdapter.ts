import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import { preflightEpochKubernetes } from "./kubernetesPreflight";

export type EpochKubernetesVllmInput = { name: string; model: string; modelRevision: string; image: string; namespace?: string; replicas?: number; gpuCount?: number; gpuSelector?: string; port?: number; context?: string };
export class EpochKubernetesVllmError extends Error { constructor(message: string, public readonly code: string) { super(message); } }

function safe(value: string, label: string): string { const normalized = value.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "").slice(0,  fiftyFive()); if (!normalized) throw new EpochKubernetesVllmError(`${label} is required`, "INVALID_INPUT"); return normalized; }
function fiftyFive() { return 55; }

export function buildEpochKubernetesVllmManifest(input: EpochKubernetesVllmInput): { manifest: string; sha256: string; name: string; namespace: string } {
  const name = safe(input.name, "deployment name");
  const namespace = safe(input.namespace ?? "epoch", "namespace");
  const model = input.model.trim();
  const revision = input.modelRevision.trim();
  const image = input.image.trim();
  if (!model || !revision || !image) throw new EpochKubernetesVllmError("model, pinned modelRevision, and pinned image are required", "PINNED_IDENTITY_REQUIRED");
  if (revision.length < 7) throw new EpochKubernetesVllmError("modelRevision must identify a pinned revision", "MODEL_REVISION_NOT_PINNED");
  if (!image.includes("@sha256:")) throw new EpochKubernetesVllmError("vLLM image must use a digest-pinned reference", "IMAGE_NOT_PINNED");
  const replicas = Math.max(1, Math.min(50, Math.floor(input.replicas ?? 1)));
  const gpuCount = Math.max(1, Math.min(8, Math.floor(input.gpuCount ?? 1)));
  const port = Math.max(1024, Math.min(65535, Math.floor(input.port ?? 8000)));
  const selector = input.gpuSelector?.trim() ? `\n        nodeSelector:\n          accelerator: ${input.gpuSelector.trim()}` : "";
  const manifest = `apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: ${name}\n  namespace: ${namespace}\n  labels:\n    app.kubernetes.io/name: ${name}\n    app.kubernetes.io/managed-by: epoch\n    epoch.io/model-revision: ${revision}\nspec:\n  replicas: ${replicas}\n  strategy:\n    type: RollingUpdate\n  selector:\n    matchLabels:\n      app.kubernetes.io/name: ${name}\n  template:\n    metadata:\n      labels:\n        app.kubernetes.io/name: ${name}\n        app.kubernetes.io/managed-by: epoch\n        epoch.io/model-revision: ${revision}\n    spec:${selector}\n      terminationGracePeriodSeconds: 90\n      containers:\n        - name: vllm\n          image: ${image}\n          imagePullPolicy: IfNotPresent\n          args: ["--model", "${model}", "--revision", "${revision}", "--host", "0.0.0.0", "--port", "${port}"]\n          ports:\n            - name: http\n              containerPort: ${port}\n          readinessProbe:\n            httpGet: { path: /health, port: http }\n            initialDelaySeconds: 30\n            periodSeconds: 10\n          livenessProbe:\n            httpGet: { path: /health, port: http }\n            initialDelaySeconds: 60\n            periodSeconds: 20\n          resources:\n            requests:\n              nvidia.com/gpu: "${gpuCount}"\n            limits:\n              nvidia.com/gpu: "${gpuCount}"\n          securityContext:\n            allowPrivilegeEscalation: false\n            readOnlyRootFilesystem: true\n            capabilities: { drop: ["ALL"] }\n---\napiVersion: v1\nkind: Service\nmetadata:\n  name: ${name}\n  namespace: ${namespace}\n  labels:\n    app.kubernetes.io/managed-by: epoch\nspec:\n  selector:\n    app.kubernetes.io/name: ${name}\n  ports:\n    - name: http\n      port: ${port}\n      targetPort: http\n  type: ClusterIP\n`;
  return { manifest, sha256: createHash("sha256").update(manifest).digest("hex"), name, namespace };
}

export function buildEpochKubernetesVllmCommandPlan(input: EpochKubernetesVllmInput) {
  const built = buildEpochKubernetesVllmManifest(input);
  const contextArgs = input.context?.trim() ? ["--context", input.context.trim()] : [];
  return { ...built, commands: { apply: ["kubectl", ...contextArgs, "apply", "--server-side", "--field-manager=epoch", "-f", "-"], status: ["kubectl", ...contextArgs, "-n", built.namespace, "get", "deployment", built.name, "-o", "json"], rollout: ["kubectl", ...contextArgs, "-n", built.namespace, "rollout", "status", `deployment/${built.name}`, "--timeout=15m"], rollback: ["kubectl", ...contextArgs, "-n", built.namespace, "rollout", "undo", `deployment/${built.name}`] } };
}

async function runKubectl(args: string[], stdin?: string) {
  if (process.env.EPOCH_KUBERNETES_ENABLED?.trim().toLowerCase() !== "true") throw new EpochKubernetesVllmError("Kubernetes execution is disabled; set EPOCH_KUBERNETES_ENABLED=true", "KUBERNETES_NOT_ENABLED");
  return new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
    const child = spawn(args[0], args.slice(1), { windowsHide: true, stdio: ["pipe", "pipe", "pipe"] });
    let stdout = ""; let stderr = "";
    const timeout = setTimeout(() => { child.kill(); reject(new EpochKubernetesVllmError("kubectl timed out", "KUBECTL_TIMEOUT")); }, 900_000);
    child.stdout.on("data", (chunk: Buffer) => { stdout = `${stdout}${chunk.toString("utf8")}`.slice(0, 2_000_000); });
    child.stderr.on("data", (chunk: Buffer) => { stderr = `${stderr}${chunk.toString("utf8")}`.slice(0, 2_000_000); });
    child.on("error", (error) => { clearTimeout(timeout); reject(new EpochKubernetesVllmError(error.message, "KUBECTL_UNAVAILABLE")); });
    child.on("close", (code) => { clearTimeout(timeout); code === 0 ? resolve({ stdout, stderr }) : reject(new EpochKubernetesVllmError(stderr.trim() || `kubectl exited with ${code}`, "KUBECTL_FAILED")); });
    if (stdin !== undefined) child.stdin.end(stdin); else child.stdin.end();
  });
}

export async function deployEpochKubernetesVllm(input: EpochKubernetesVllmInput) {
  const plan = buildEpochKubernetesVllmCommandPlan(input);
  if (process.env.EPOCH_KUBERNETES_ENABLED?.trim().toLowerCase() !== "true") throw new EpochKubernetesVllmError("Kubernetes execution is disabled; set EPOCH_KUBERNETES_ENABLED=true", "KUBERNETES_NOT_ENABLED");
  const preflight = await preflightEpochKubernetes({ context: input.context, requiredGpuCount: input.gpuCount });
  if (preflight.status !== "READY") throw new EpochKubernetesVllmError(`Kubernetes preflight blocked deployment: ${preflight.checks.filter((check) => check.status === "FAIL").map((check) => check.detail).join("; ")}`, "KUBERNETES_PREFLIGHT_BLOCKED");
  const applied = await runKubectl(plan.commands.apply, plan.manifest);
  const rollout = await runKubectl(plan.commands.rollout);
  return { provider: "kubernetes", runtime: "vllm", name: plan.name, namespace: plan.namespace, status: "ready", manifestSha256: plan.sha256, preflight, applyOutput: applied.stdout, rolloutOutput: rollout.stdout, observedAt: new Date().toISOString() };
}

export async function rollbackEpochKubernetesVllm(input: EpochKubernetesVllmInput & { reason: string }) {
  const plan = buildEpochKubernetesVllmCommandPlan(input);
  const rollback = await runKubectl(plan.commands.rollback);
  const rollout = await runKubectl(plan.commands.rollout);
  return { provider: "kubernetes", runtime: "vllm", name: plan.name, namespace: plan.namespace, status: "rolled_back", reason: input.reason, rollbackOutput: rollback.stdout, rolloutOutput: rollout.stdout, observedAt: new Date().toISOString() };
}
