import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "automated-scientific-discoverers",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
