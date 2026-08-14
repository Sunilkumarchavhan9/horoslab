export function verificationScopeKey(userId: string, orgId?: string): string {
  return `user:${userId}|org:${orgId?.trim() || "default"}`
}
