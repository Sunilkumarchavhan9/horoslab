import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "teaching-data-factory",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
