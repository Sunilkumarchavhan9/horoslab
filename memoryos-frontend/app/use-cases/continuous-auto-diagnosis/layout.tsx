import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "continuous-auto-diagnosis",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
