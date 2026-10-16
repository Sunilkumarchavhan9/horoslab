import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Autonomous Agents - Horos",
  description: "Build, adapt, and optimize autonomous agents that reason, use tools, recover from failures, and execute real-world workloads.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
