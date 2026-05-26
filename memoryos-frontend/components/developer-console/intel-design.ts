/** Prody-style light dashboard tokens (reference image palette). */
export const intel = {
  colors: {
    canvas: "#F9FAFB",
    sidebar: "#F3F4F6",
    surface: "#FFFFFF",
    surfaceMuted: "#F9FAFB",
    border: "rgba(0, 0, 0, 0.06)",
    borderStrong: "#E5E7EB",
    text: "#111827",
    textSecondary: "#374151",
    textMuted: "#6B7280",
    textDim: "#9CA3AF",
    teal: "#14B8A6",
    tealSoft: "#CCFBF1",
    rose: "#EF4444",
    roseSoft: "#FEE2E2",
    violet: "#6366F1",
    amber: "#F59E0B",
    emerald: "#10B981",
    navActive: "#FFFFFF",
  },
  shadow: {
    workspace: "0 1px 3px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.06)",
    navActive: "0 1px 2px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)",
    card: "0 1px 2px rgba(0,0,0,0.05)",
  },
  radius: {
    dock: "12px",
    panel: "16px",
    workspace: "16px",
    pill: "9999px",
  },
} as const;

export const intelMotion = {
  spring: { type: "spring" as const, stiffness: 400, damping: 34 },
  panel: { duration: 0.32, ease: [0.22, 1, 0.36, 1] as const },
  fadeUp: {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -4 },
  },
};

export const intelPanelClass =
  "rounded-xl border border-black/[0.06] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05),0_4px_16px_rgba(0,0,0,0.04)]";

/** Full-bleed main column — no inset card, no side gutters */
export const intelWorkspaceClass =
  "relative flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden bg-white";

export const intelInsetClass = "rounded-xl border border-black/[0.06] bg-[#F9FAFB]";

/** Horizontal padding inside workspace panels */
export const intelContentPad = "px-3 sm:px-4";

/** Break out of intelContentPad so grids/gutters span the full main column */
export const intelContentBleed =
  "-mx-3 w-[calc(100%+1.5rem)] max-w-none sm:-mx-4 sm:w-[calc(100%+2rem)]";

/** Connectors page panel run — use with .connector-full-bleed in globals.css */
export const connectorPanelBleed = "connector-full-bleed connector-panel-run";
