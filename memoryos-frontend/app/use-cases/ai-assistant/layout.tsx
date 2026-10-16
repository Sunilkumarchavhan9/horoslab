import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ai-assistant",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
