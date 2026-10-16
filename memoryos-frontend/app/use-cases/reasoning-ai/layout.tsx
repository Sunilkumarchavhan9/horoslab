import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "reasoning-ai",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
