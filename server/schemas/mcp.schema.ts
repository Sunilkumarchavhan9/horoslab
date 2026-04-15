import { z } from "zod";

export const McpInvokeRequestSchema = z.object({
  name: z.string().min(1, "name is required"),
  input: z.record(z.string(), z.unknown()).optional().default({}),
});
