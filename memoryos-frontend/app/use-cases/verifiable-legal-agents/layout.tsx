import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "verifiable-legal-agents",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
