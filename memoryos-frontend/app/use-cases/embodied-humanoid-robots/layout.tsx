import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "embodied-humanoid-robots",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
