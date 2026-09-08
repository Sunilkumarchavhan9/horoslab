"use client";

import { useEffect, useMemo, useState } from "react";
import { Copy, AlertTriangle, Info, Key, Plus, RefreshCw, Shield, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
 createEpochRuntimeApiKey,
 listEpochRuntimeApiKeys,
 readActiveEpochWorkspaceId,
 revokeEpochRuntimeApiKey,
 type EpochRuntimeApiKey,
} from "@/lib/epoch-api";

function formatTimestamp(value?: string | null): string {
 if (!value) return "Never";
 const parsed = new Date(value);
 if (Number.isNaN(parsed.getTime())) return value;
 return parsed.toLocaleString();
}

function formatCreditLimit(value?: number | null): string {
 if (value === null || value === undefined) return "Unlimited";
 return `${value.toLocaleString()} credits`;
}

function formatResetLimitEvery(value?: string | null): string {
 if (!value || value === "N/A") return "No reset";
 return value;
}

type ExpirationPreset = "never" | "1h" | "1d" | "7d" | "30d" | "90d" | "180d" | "1y";

const EXPIRATION_PRESETS: Array<{ value: ExpirationPreset; label: string; durationMs: number | null }> = [
 { value: "never", label: "No expiration", durationMs: null },
 { value: "1h", label: "1 hour", durationMs: 60 * 60 * 1000 },
 { value: "1d", label: "1 day", durationMs: 24 * 60 * 60 * 1000 },
 { value: "7d", label: "7 days", durationMs: 7 * 24 * 60 * 60 * 1000 },
 { value: "30d", label: "30 days", durationMs: 30 * 24 * 60 * 60 * 1000 },
 { value: "90d", label: "90 days", durationMs: 90 * 24 * 60 * 60 * 1000 },
 { value: "180d", label: "180 days", durationMs: 180 * 24 * 60 * 60 * 1000 },
 { value: "1y", label: "1 year", durationMs: 365 * 24 * 60 * 60 * 1000 },
];

function resolveExpirationDate(preset: ExpirationPreset): string | undefined {
 const matched = EXPIRATION_PRESETS.find((item) => item.value === preset);
 if (!matched || matched.durationMs === null) return undefined;
 return new Date(Date.now() + matched.durationMs).toISOString();
}

export function DeveloperKeys() {
 const [workspaceId, setWorkspaceId] = useState<string | null>(() => readActiveEpochWorkspaceId());
 const [keys, setKeys] = useState<EpochRuntimeApiKey[]>([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);
 const [creating, setCreating] = useState(false);
 const [busyKeyId, setBusyKeyId] = useState<string | null>(null);
 const [createOpen, setCreateOpen] = useState(false);
 const [createName, setCreateName] = useState("Epoch Runtime");
 const [createCreditLimit, setCreateCreditLimit] = useState("");
 const [createResetLimitEvery, setCreateResetLimitEvery] = useState("N/A");
 const [createExpiration, setCreateExpiration] = useState<ExpirationPreset>("never");
 const [createError, setCreateError] = useState<string | null>(null);
 const [createdSecret, setCreatedSecret] = useState<string | null>(null);

 async function reloadKeys(targetWorkspaceId = workspaceId) {
 if (!targetWorkspaceId) {
 setKeys([]);
 return;
 }
 setKeys(await listEpochRuntimeApiKeys(targetWorkspaceId));
 }

 useEffect(() => {
 const syncWorkspace = () => setWorkspaceId(readActiveEpochWorkspaceId());
 syncWorkspace();
 window.addEventListener("focus", syncWorkspace);
 window.addEventListener("storage", syncWorkspace);
 return () => {
 window.removeEventListener("focus", syncWorkspace);
 window.removeEventListener("storage", syncWorkspace);
 };
 }, []);

 useEffect(() => {
 let canceled = false;

 async function load() {
 if (!workspaceId) {
 setKeys([]);
 setLoading(false);
 setError("Select a workspace to view API keys.");
 return;
 }
 setLoading(true);
 setError(null);
 try {
 const result = await listEpochRuntimeApiKeys(workspaceId);
 if (!canceled) setKeys(result);
 } catch (loadError) {
 if (!canceled) {
 setKeys([]);
 setError(loadError instanceof Error ? loadError.message : "Failed to load API keys.");
 }
 } finally {
 if (!canceled) setLoading(false);
 }
 }

 void load();
 return () => {
 canceled = true;
 };
 }, [workspaceId]);

 const scopes = [
 "missions:read",
 "missions:write",
 "authority:read",
 "verification:read",
 "memory:read",
 ];

 const sortedKeys = useMemo(() => [...keys].sort((a, b) => (b.updatedAt ?? b.createdAt ?? "").localeCompare(a.updatedAt ?? a.createdAt ?? "")), [keys]);

 async function handleCreate() {
 if (!workspaceId) return;
 setCreating(true);
 setCreatedSecret(null);
 setCreateError(null);
 try {
 const expires = resolveExpirationDate(createExpiration);
 const creditLimitValue = createCreditLimit.trim();
 const creditLimit = creditLimitValue.length > 0 && Number.isFinite(Number(creditLimitValue))
 ? Math.max(0, Math.trunc(Number(creditLimitValue)))
 : null;
 const resetLimitEvery = createResetLimitEvery.trim() === "N/A" ? null : createResetLimitEvery.trim();
 const result = await createEpochRuntimeApiKey(workspaceId, {
 name: createName.trim() || "Epoch Runtime",
 ...(expires ? { expires } : {}),
 creditLimit,
 resetLimitEvery,
 });
 await reloadKeys();
 setCreatedSecret(result.token);
 setCreateOpen(false);
 setCreateName("Epoch Runtime");
 setCreateCreditLimit("");
 setCreateResetLimitEvery("N/A");
 setCreateExpiration("never");
 } catch (createError) {
 setCreateError(createError instanceof Error ? createError.message : "Failed to create API key.");
 } finally {
 setCreating(false);
 }
 }

 async function handleRevoke(keyId: string) {
 if (!workspaceId) return;
 setBusyKeyId(keyId);
 try {
 await revokeEpochRuntimeApiKey(workspaceId, keyId);
 await reloadKeys();
 } catch (revokeError) {
 setError(revokeError instanceof Error ? revokeError.message : "Failed to revoke API key.");
 } finally {
 setBusyKeyId(null);
 }
 }

 async function handleRotate(key: EpochRuntimeApiKey) {
 if (!workspaceId) return;
 setBusyKeyId(key.id);
 try {
 const created = await createEpochRuntimeApiKey(workspaceId, {
 name: `${key.name} (rotated)`,
 expires: key.expiresAt,
 creditLimit: key.creditLimit ?? null,
 resetLimitEvery: key.resetLimitEvery ?? null,
 });
 await revokeEpochRuntimeApiKey(workspaceId, key.id);
 await reloadKeys();
 setCreatedSecret(created.token);
 } catch (rotateError) {
 setError(rotateError instanceof Error ? rotateError.message : "Failed to rotate API key.");
 } finally {
 setBusyKeyId(null);
 }
 }

 return (
 <div className="w-full flex flex-col pt-2 pb-12 font-sans">
 <div className="mb-8">
 <div className="flex items-center gap-2.5 mb-1">
 <Key className="size-6 text-foreground" strokeWidth={1.5} />
 <h1 className="text-[28px] font-medium text-foreground tracking-tight">API Keys</h1>
 </div>
 <p className="text-[15px] text-muted-foreground">Live runtime API keys for Epoch agents and tools.</p>
 </div>

 <div className="flex items-center justify-end mb-6">
 <Button
 className="btn-glossy-blue h-9 px-6 text-[13.5px] font-medium gap-1.5 "
 onClick={() => {
 setCreateError(null);
 setCreateOpen(true);
 }}
 disabled={creating}
 >
 <Plus className="size-4" />
 {creating ? "Creating..." : "Create Key"}
 </Button>
 </div>

 <Dialog
 open={createOpen}
 onOpenChange={(open) => {
 setCreateOpen(open);
 if (!open) setCreateError(null);
 }}
 >
 <DialogContent
 showCloseButton={false}
 className="w-[min(600px,calc(100vw-2rem))] max-w-none rounded-[16px] border border-white/10 bg-[#0c1117] p-0 text-[#F0EFE2] shadow-[0_24px_90px_rgba(0,0,0,0.6)]"
 >
 <div className="border-b border-white/10 px-6 py-6">
 <DialogHeader>
 <DialogTitle className="text-[18px] font-semibold text-[#F0EFE2]">Create runtime API key</DialogTitle>
 <DialogDescription className="text-[14px] text-[#F0EFE2]/60">
 Set the key name, limits, cadence, and expiration before creating it.
 </DialogDescription>
 </DialogHeader>
 </div>
 <form
 className="px-6 py-6 space-y-5"
 onSubmit={(event) => {
 event.preventDefault();
 void handleCreate();
 }}
 >
 {createError ? (
 <div className="rounded-md border border-red-500/30 bg-red-500/10 px-6 py-3 text-[13px] text-red-100">
 {createError}
 </div>
 ) : null}

 <div className="space-y-2">
 <label className="flex items-center gap-2 text-[13px] font-medium text-[#F0EFE2]/80">
 Name
 <Info className="size-3.5 text-[#F0EFE2]/35" />
 </label>
 <Input
 autoFocus
 value={createName}
 onChange={(event) => setCreateName(event.target.value)}
 placeholder='e.g. "Chatbot Key"'
 className="h-12 rounded-md border-white/10 bg-[#10161d] px-3.5 text-[14px] text-[#F0EFE2] placeholder:text-[#F0EFE2]/35 focus-visible:border-lime-500/50 focus-visible:ring-lime-500/20"
 />
 </div>

 <div className="space-y-2">
 <label className="flex items-center gap-2 text-[13px] font-medium text-[#F0EFE2]/80">
 Credit limit (optional)
 <Info className="size-3.5 text-[#F0EFE2]/35" />
 </label>
 <Input
 type="number"
 min="0"
 value={createCreditLimit}
 onChange={(event) => setCreateCreditLimit(event.target.value)}
 placeholder="Leave blank for unlimited"
 className="h-12 rounded-md border-white/10 bg-[#10161d] px-3.5 text-[14px] text-[#F0EFE2] placeholder:text-[#F0EFE2]/35 focus-visible:border-lime-500/50 focus-visible:ring-lime-500/20"
 />
 </div>

 <div className="space-y-2">
 <label className="flex items-center gap-2 text-[13px] font-medium text-[#F0EFE2]/80">
 Reset limit every...
 <Info className="size-3.5 text-[#F0EFE2]/35" />
 </label>
 <Select value={createResetLimitEvery} onValueChange={setCreateResetLimitEvery}>
 <SelectTrigger
 className="h-12 w-full rounded-md border-white/10 bg-[#10161d] px-3.5 text-[14px] text-[#F0EFE2] shadow-none focus:ring-0 [&>span]:text-[#F0EFE2]"
 >
 <SelectValue placeholder="N/A" />
 </SelectTrigger>
 <SelectContent className="border-white/10 bg-[#0f141b] text-[#F0EFE2] shadow-[0_18px_50px_rgba(0,0,0,0.55)]">
 {["N/A", "1 hour", "1 day", "7 days", "30 days", "90 days", "180 days", "1 year"].map((option) => (
 <SelectItem
 key={option}
 value={option}
 className="text-[#F0EFE2]/80 focus:bg-card/10 focus:text-[#F0EFE2] data-[state=checked]:bg-lime-500/15 data-[state=checked]:text-lime-300"
 >
 {option}
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>

 <div className="space-y-2">
 <label className="flex items-center gap-2 text-[13px] font-medium text-[#F0EFE2]/80">
 Expiration
 <Info className="size-3.5 text-[#F0EFE2]/35" />
 </label>
 <Select value={createExpiration} onValueChange={(value) => setCreateExpiration(value as ExpirationPreset)}>
 <SelectTrigger
 className="h-12 w-full rounded-md border-white/10 bg-[#10161d] px-3.5 text-[14px] text-[#F0EFE2] shadow-none focus:ring-0 [&>span]:text-[#F0EFE2]"
 >
 <SelectValue placeholder="No expiration" />
 </SelectTrigger>
 <SelectContent className="border-white/10 bg-[#0f141b] text-[#F0EFE2] shadow-[0_18px_50px_rgba(0,0,0,0.55)]">
 {EXPIRATION_PRESETS.map((option) => (
 <SelectItem
 key={option.value}
 value={option.value}
 className="text-[#F0EFE2]/80 focus:bg-card/10 focus:text-[#F0EFE2] data-[state=checked]:bg-lime-500/15 data-[state=checked]:text-lime-300"
 >
 {option.label}
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>

 <DialogFooter className="px-0 pt-2 sm:justify-end">
 <Button
 type="button"
 variant="outline"
 onClick={() => setCreateOpen(false)}
 className="h-10 rounded-md border-white/10 bg-card/5 px-6 text-[#F0EFE2] hover:bg-card/10 hover:text-[#F0EFE2]"
 >
 Cancel
 </Button>
 <Button
 type="submit"
 disabled={creating}
 className="h-10 rounded-md border border-[#7a8f00] bg-[#a8bc12] px-6 text-[14px] font-medium text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_10px_20px_rgba(128,145,0,0.25)] hover:bg-[#b4c91a] hover:text-foreground"
 >
 {creating ? "Creating..." : "Create"}
 </Button>
 </DialogFooter>
 </form>
 </DialogContent>
 </Dialog>

 {createdSecret ? (
 <div className="mb-6 rounded-md border border-emerald-200 bg-emerald-50 px-6 py-3 text-[14px] text-emerald-900 flex items-center justify-between gap-3">
 <div className="min-w-0">
 <div className="font-semibold">Runtime API key created</div>
 <div className="font-mono text-[12px] break-all">{createdSecret}</div>
 </div>
 <Button
 type="button"
 variant="outline"
 className="h-9 px-3 shrink-0"
 onClick={async () => {
 await navigator.clipboard.writeText(createdSecret);
 }}
 >
 <Copy className="size-3.5 mr-1.5" />
 Copy
 </Button>
 </div>
 ) : null}

 {loading ? (
 <div className="bg-card border border-border rounded-md p-12 text-center">
 <p className="text-[15px] text-muted-foreground">Loading API keys.</p>
 </div>
 ) : error ? (
 <div className="bg-card border border-border rounded-md p-12 text-center">
 <AlertTriangle className="size-10 text-[#f59e0b] mx-auto mb-3" />
 <p className="text-[15px] text-foreground font-medium mb-1">API keys unavailable</p>
 <p className="text-[14px] text-muted-foreground">{error}</p>
 </div>
 ) : (
 <>
 <div className="w-full overflow-hidden rounded-md border border-border bg-card mb-12">
 <table className="w-full text-left border-collapse">
 <thead className="bg-card border-b border-border">
 <tr>
 <th className="px-6 py-3.5 text-[13px] font-semibold text-foreground">Name</th>
 <th className="px-6 py-3.5 text-[13px] font-semibold text-foreground">Created</th>
 <th className="px-6 py-3.5 text-[13px] font-semibold text-foreground">Last Used</th>
 <th className="px-6 py-3.5 text-[13px] font-semibold text-foreground">Permissions</th>
 <th className="px-6 py-3.5 text-[13px] font-semibold text-foreground text-right">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-[#e5e5e5]">
 {sortedKeys.length === 0 ? (
 <tr>
 <td className="px-6 py-8 text-[14px] text-muted-foreground" colSpan={5}>
 No runtime API keys yet.
 </td>
 </tr>
 ) : (
 sortedKeys.map((key) => (
 <tr key={key.id} className="hover:bg-card transition-colors">
 <td className="px-6 py-6">
 <span className="font-semibold text-[14px] text-foreground">{key.name}</span>
 <div className="text-[12px] text-muted-foreground font-mono">{key.prefix ?? key.id.slice(0, 8)}</div>
 <div className="mt-1 text-[12px] text-muted-foreground">
 {formatCreditLimit(key.creditLimit)} • Reset {formatResetLimitEvery(key.resetLimitEvery)} • Expires {formatTimestamp(key.expiresAt)}
 </div>
 </td>
 <td className="px-6 py-6">
 <span className="text-[13px] text-muted-foreground font-medium">{formatTimestamp(key.createdAt)}</span>
 </td>
 <td className="px-6 py-6">
 <span className="text-[13px] text-muted-foreground font-medium">{formatTimestamp(key.lastUsedAt)}</span>
 </td>
 <td className="px-6 py-6">
 <span className={cn(
 "inline-flex items-center px-2 py-0.5 rounded-md text-[12px] font-bold",
 (key.mode ?? "").includes("scoped") ? "bg-purple-50 text-purple-700 border border-purple-200" : "bg-muted text-foreground/90 border border-border",
 )}>
 {key.contentTag ?? key.mode ?? "runtime"}
 </span>
 </td>
 <td className="px-6 py-6">
 <div className="flex items-center justify-end gap-2">
 <Button variant="outline" size="sm" className="h-8 px-3 text-muted-foreground hover:text-foreground">
 <Copy className="size-3.5 mr-1.5" /> Copy
 </Button>
 <Button
 variant="outline"
 size="sm"
 className="h-8 px-3 text-muted-foreground hover:text-foreground"
 onClick={() => void handleRotate(key)}
 disabled={busyKeyId === key.id}
 >
 <RefreshCw className="size-3.5 mr-1.5" /> Rotate
 </Button>
 <Button
 variant="ghost"
 size="sm"
 className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
 onClick={() => handleRevoke(key.id)}
 disabled={busyKeyId === key.id}
 >
 <Trash2 className="size-4" />
 </Button>
 </div>
 </td>
 </tr>
 ))
 )}
 </tbody>
 </table>
 </div>

 <div>
 <h3 className="text-[16px] font-bold text-foreground mb-4 flex items-center gap-2">
 <Shield className="size-5" />
 Permission Scopes
 </h3>
 <div className="flex flex-wrap items-center gap-3">
 {scopes.map((scope) => (
 <div key={scope} className="text-[13px] font-mono font-medium text-foreground/90 bg-card border border-border px-3 py-1.5 rounded-md ">
 {scope}
 </div>
 ))}
 </div>
 </div>
 </>
 )}
 </div>
 );
}
