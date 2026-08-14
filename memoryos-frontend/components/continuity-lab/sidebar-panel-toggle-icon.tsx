import { cn } from "@/lib/utils";

type SidebarPanelToggleIconProps = {
  className?: string;
  /** Mirrored when the sidebar rail is collapsed (expand affordance). */
  mirrored?: boolean;
};

/** Devin-style panel toggle: rounded square with a left vertical divider. */
export function SidebarPanelToggleIcon({
  className,
  mirrored = false,
}: SidebarPanelToggleIconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden
      className={cn("shrink-0", mirrored && "-scale-x-100", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2.25" y="2.25" width="11.5" height="11.5" rx="2" />
      <path d="M5.75 2.25v11.5" />
    </svg>
  );
}
