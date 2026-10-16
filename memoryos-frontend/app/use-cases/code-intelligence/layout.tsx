import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "code-intelligence",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
