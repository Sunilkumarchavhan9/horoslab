import { WorkOS } from "@workos-inc/node";

const apiKey = process.env.WORKOS_API_KEY;
const clientId = process.env.WORKOS_CLIENT_ID;

export const WORKOS_CLIENT_ID = clientId || "";

export const isWorkOSEnabled = (): boolean => {
  return Boolean(
    apiKey &&
      clientId &&
      !apiKey.startsWith("your_") &&
      apiKey !== "sk_test_placeholder"
  );
};

export const workos = new WorkOS(apiKey || "sk_test_placeholder");

export type WorkOSOAuthProvider = "google" | "github" | "linkedin";

export function getWorkOSProviderName(
  provider: WorkOSOAuthProvider
): "GoogleOAuth" | "GitHubOAuth" | "LinkedInOAuth" {
  switch (provider) {
    case "google":
      return "GoogleOAuth";
    case "github":
      return "GitHubOAuth";
    case "linkedin":
      return "LinkedInOAuth";
  }
}

