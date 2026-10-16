import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "research-ai",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
