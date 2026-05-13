export function resolveBackendOrigin(): string {
  const configured = process.env.MEMORYOS_API_ORIGIN?.trim();
  return (configured && configured !== "same-origin" ? configured : "http://localhost:3001").replace(/\/+$/, "");
}
