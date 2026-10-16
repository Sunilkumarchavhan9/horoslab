import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "engineering-intelligence",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
