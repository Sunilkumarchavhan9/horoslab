export default function DeveloperConsoleRunDemoLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="dark min-h-dvh bg-black">{children}</div>;
}
