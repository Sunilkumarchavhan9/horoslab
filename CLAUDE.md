# MemoryOS Design System and Figma MCP Rules

This document is the working guide for translating Figma designs into the MemoryOS codebase. It is optimized for the current repository layout, the Next.js frontend in `memoryos-frontend/`, and the existing design system patterns already in use.

## What This Codebase Is

MemoryOS is not a generic component sandbox. It is a product suite split across the landing site, the mission control, the continuity lab, and supporting auth, observability, and memory surfaces.

The main frontend lives in [`memoryos-frontend/`](memoryos-frontend/) and uses the App Router under [`memoryos-frontend/app/`](memoryos-frontend/app/). The root [`app/`](app/) directory only contains a redirect entrypoint for the workspace shell.

## 1. Token Definitions

### Where tokens live

There is no separate token package or generated design-token pipeline. The effective tokens are defined in CSS and mapped into Tailwind through the global stylesheet.

Primary sources:

- [`memoryos-frontend/app/globals.css`](memoryos-frontend/app/globals.css)
- [`memoryos-frontend/app/layout.tsx`](memoryos-frontend/app/layout.tsx)
- [`memoryos-frontend/public/theme-bootstrap.js`](memoryos-frontend/public/theme-bootstrap.js)

### Token format

The codebase uses CSS custom properties as the source of truth, then maps them into Tailwind via `@theme inline`.

Representative pattern:

```css
:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --primary: oklch(0.488 0.243 264.376);
  --radius: 0.625rem;
}

@theme inline {
  --font-sans: var(--font-space-grotesk), var(--font-sora), ui-sans-serif, system-ui, sans-serif;
  --font-heading: var(--font-space-grotesk), var(--font-sora), ui-sans-serif, system-ui, sans-serif;
  --font-mono: var(--font-plex-mono), var(--font-jetbrains-mono), ui-monospace, SFMono-Regular, Menlo, monospace;
  --color-background: var(--background);
  --color-foreground: var(--foreground);
}
```

There are also route- or section-scoped tokens for specific surfaces:

- Landing page variables such as `--landing-bg`, `--landing-border`, `--landing-accent`
- Dark personal-memory overrides in `.personal-memory-dark-section`
- Console palette helpers in the mission-control section primitives

### Token transformation system

There is no dedicated token transformer, Style Dictionary pipeline, or generated token package. The transformation is:

1. CSS custom properties in `globals.css`
2. Tailwind theme mapping via `@theme inline`
3. Runtime theme bootstrap before first paint via `theme-bootstrap.js`

Theme bootstrap pattern:

```js
(function () {
  try {
    var t = localStorage.getItem(THEME_KEY);
    document.documentElement.setAttribute("data-theme", r);
    document.documentElement.classList.toggle("dark", r === "dark");
  } catch (e) {}
})();
```

### Rules for Figma translation

- Map Figma colors to existing semantic variables first, not raw hex values.
- If a design asks for a new surface or mode, add a semantic CSS variable in `globals.css` before inventing arbitrary utility classes everywhere.
- Use the existing font stack in `app/layout.tsx`; do not introduce a new type system unless the product direction changes.
- Treat rounded corners as a special case. The global style resets most corners to square unless a component explicitly opts in.

## 2. Component Library

### Where UI components live

The shared UI primitives are in [`memoryos-frontend/components/ui/`](memoryos-frontend/components/ui/). Domain-specific product components live in feature folders:

- [`memoryos-frontend/components/landing/`](memoryos-frontend/components/landing/)
- [`memoryos-frontend/components/mission-control/`](memoryos-frontend/components/mission-control/)
- [`memoryos-frontend/components/continuity-lab/`](memoryos-frontend/components/continuity-lab/)
- [`memoryos-frontend/components/auth/`](memoryos-frontend/components/auth/)
- [`memoryos-frontend/components/memoryos/`](memoryos-frontend/components/memoryos/)
- [`memoryos-frontend/components/observability/`](memoryos-frontend/components/observability/)

### Component architecture

This codebase uses a layered approach:

- Primitive wrappers in `components/ui/`
- Domain shells and layouts in feature folders
- Route pages in `app/*/page.tsx` that mostly compose domain components
- Utility helpers in `lib/`

Most primitives use `class-variance-authority`, `cn`, and `Slot`-style composition rather than bespoke one-off CSS systems.

Representative button pattern:

```tsx
const buttonVariants = cva(
  "pixel-load-btn group/button relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-none ...",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        outline: "border-border bg-background hover:bg-muted",
      },
    },
  },
);
```

Representative card pattern:

```tsx
function Card({ className, size = "default", ...props }: React.ComponentProps<"div"> & { size?: "default" | "sm" }) {
  return (
    <div
      data-slot="card"
      data-size={size}
      className={cn("group/card flex flex-col gap-4 overflow-hidden rounded-none bg-card ...", className)}
      {...props}
    />
  );
}
```

### Documentation and storybook

No Storybook, CSF stories, or MDX component docs were found in this repository. The practical documentation is the source code itself plus product docs in [`docs/`](docs/).

Rules for Figma work:

- Reuse existing primitives before creating a new component.
- Prefer domain wrappers over adding behavior directly to `components/ui/`.
- If a Figma screen needs a new recurring pattern, add it as a reusable feature component with a clear folder name.

## 3. Frameworks and Libraries

### Frontend stack

The primary frontend is:

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Framer Motion
- Radix UI primitives
- class-variance-authority
- next/font for local font wiring

Authoritative files:

- [`memoryos-frontend/package.json`](memoryos-frontend/package.json)
- [`memoryos-frontend/app/layout.tsx`](memoryos-frontend/app/layout.tsx)
- [`memoryos-frontend/app/globals.css`](memoryos-frontend/app/globals.css)
- [`memoryos-frontend/next.config.ts`](memoryos-frontend/next.config.ts)

### Build system

The frontend uses the Next.js build pipeline, with both webpack and turbopack support in local scripts.

Key scripts:

- `dev`: `next dev --webpack`
- `dev:turbo`: `next dev --turbopack`
- `build`: `next build`

There is no separate Vite or Storybook runtime to account for.

### Figma translation implications

- Translate Figma layouts to Next.js route components and feature components, not to a framework-agnostic UI library.
- Use Tailwind utilities and existing primitives rather than adding a second styling framework.
- Prefer client components only when the interaction genuinely needs them.

## 4. Asset Management

### Where assets live

Static assets are stored in [`memoryos-frontend/public/`](memoryos-frontend/public/). They are referenced directly by root-relative paths.

Common asset classes:

- Logos and product marks
- Connector brand icons
- Background textures and generated imagery
- Screenshots and videos
- SVG sprite assets

Example references:

```tsx
<img src="/memoryostmlogoofficial.png" alt="MemoryOS Logo" />
<img src="/connector-icons/cursor.ico" alt="" aria-hidden />
<use href={`/icons.svg#${name}`} />
```

### Asset optimization

Observed behavior:

- Most assets are served directly from `public/`
- SVG is used heavily for brand and icon assets
- Some images use plain `<img>` with `loading="lazy"` and `decoding="async"`
- `next/image` is present but used sparingly

### CDN configuration

No CDN or remote asset configuration was found in `next.config.ts`. There is no `remotePatterns` setup in the frontend config. Treat assets as local/static unless the product explicitly introduces a CDN-backed workflow.

Rules for Figma work:

- Export design assets to `public/` when they are needed at runtime.
- Prefer SVG for icons, logos, and simple brand marks.
- Use raster images only when the design genuinely needs raster detail.
- Do not assume remote image hosting unless a feature already uses it.

## 5. Icon System

### Where icons are stored

There are three icon sources in practice:

- The SVG sprite at [`memoryos-frontend/public/icons.svg`](memoryos-frontend/public/icons.svg)
- Local connector icons in [`memoryos-frontend/public/connector-icons/`](memoryos-frontend/public/connector-icons/)
- Package icons from `lucide-react`, `@phosphor-icons/react`, and a few other icon packages

### How icons are imported and used

The shared sprite wrapper is in [`memoryos-frontend/components/ui/icon.tsx`](memoryos-frontend/components/ui/icon.tsx):

```tsx
export function Icon({ name, title, className, ...props }: IconProps) {
  return (
    <svg className={className} {...props}>
      <use href={`/icons.svg#${name}`} />
    </svg>
  );
}
```

Connector branding is centralized in [`memoryos-frontend/components/mission-control/connector-brand-icons.tsx`](memoryos-frontend/components/mission-control/connector-brand-icons.tsx). That file maps provider identifiers to local files or hand-authored SVG marks.

Representative patterns:

```tsx
github: ({ className }) => <PhosphorBrand icon={GithubLogo} className={className} color="#181717" />,
"local-files": ({ className }) => <FolderOpen className={cn(className, "text-[#D97706]")} weight="duotone" />,
function CursorIcon({ className }: IconProps) {
  return <ImageBrandIcon className={className} src="/connector-icons/cursor.ico" />;
}
```

### Naming convention

Observed conventions are semantic and lowercase:

- Sprite names: `memory`, `agent`, `timeline`, `success`, `warning`
- Connector icons: filenames mirror the provider name, usually lowercase with hyphens
- UI icons: imported by component purpose, not by a custom design-token naming scheme

Rules for Figma work:

- Use the existing icon source first.
- Prefer Lucide for general UI actions.
- Prefer the sprite or connector-brand map for product-specific marks.
- Do not introduce a new icon naming convention unless a new sprite set is intentionally being built.

## 6. Styling Approach

### CSS methodology

The project is primarily utility-first Tailwind CSS with a small amount of CSS module usage.

Evidence:

- Global Tailwind and token wiring in [`memoryos-frontend/app/globals.css`](memoryos-frontend/app/globals.css)
- Tailwind utility classes throughout component files
- At least one CSS module exists: [`memoryos-frontend/components/personal-app/personal-app-experience.module.css`](memoryos-frontend/components/personal-app/personal-app-experience.module.css)

### Global styles

Global styles are important and opinionated:

- Tailwind base imports live in `globals.css`
- Fonts are set globally
- `border-radius` is forced to square for most of the app unless a subtree opts out
- Landing and dark personal-memory sections override CSS variables to create route-scoped surfaces

Representative global rules:

```css
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";

:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
}

@layer base {
  :not(.mission-control-root):not(.mission-control-root *) {
    border-radius: 0;
  }
}
```

### Responsive implementation

Responsiveness is implemented with Tailwind breakpoints and layout utilities rather than separate style sheets.

Typical patterns:

- `sm:`, `md:`, `lg:`, `xl:` modifiers
- grid and flex utilities
- route-specific layout wrappers that control width, padding, and overflow
- section-scoped shells for landing, console, and continuity-lab views

Rules for Figma work:

- Translate spacing and breakpoints into Tailwind classes.
- Preserve route-specific themes and surface treatments.
- Avoid adding CSS modules unless a component genuinely needs scoped, non-utility styling.

## 7. Project Structure

### Overall organization

The repository is a multi-surface app with several major areas:

- [`memoryos-frontend/`](memoryos-frontend/) for the main product UI
- [`app/`](app/) for the root redirect shell
- [`server/`](server/), [`services/`](services/), [`shared/`](shared/), [`prisma/`](prisma/) for backend and data layers
- [`docs/`](docs/) for product and execution documentation
- [`public/`](memoryos-frontend/public/) for frontend static assets

### Feature organization patterns

Observed frontend organization is domain-first:

- `components/landing/` for marketing and explainer sections
- `components/mission-control/` for console primitives and product operations
- `components/continuity-lab/` for operational workflows and related screens
- `components/auth/` for sign-in and sign-up shells
- `components/memoryos/` for shared MemoryOS UI elements
- `components/ui/` for reusable primitives

Route pages are thin and usually just import a feature component.

Representative route pattern:

```tsx
export default function ContinuityLabPage() {
  return (
    <Suspense fallback={<div />}> 
      <ContinuityLabHome />
    </Suspense>
  );
}
```

### Rules for Figma work

- Map each Figma screen to the owning route and feature folder first.
- If a design spans multiple routes, split it into shared primitives plus route-specific containers.
- Keep page files thin; push reusable structure into `components/<domain>/`.
- When a Figma concept does not fit an existing domain, place it in the nearest operational area rather than creating a generic misc folder.

## 8. Figma MCP Integration Rules

These are the practical rules for using Figma designs with this codebase.

### For web pages

1. Capture the design or page with the Figma workflow first.
2. Search the existing codebase for matching tokens, components, and icon sources.
3. Reuse the closest existing domain component.
4. Add only the smallest new component surface needed to match the design.
5. Validate the result against the current app shell, not against a theoretical blank canvas.

### For existing Figma files

- Use the existing file and node context instead of recreating design intent from scratch.
- Keep the implementation faithful to the current product language: black/dark console surfaces, blue accents, square borders, and high information density when working inside the console areas.
- Preserve the established landing style in marketing pages rather than importing console visuals into them.

### Translation priorities

When a Figma layout conflicts with current code patterns, use this order:

1. Existing semantic tokens and route themes
2. Existing reusable components in the matching domain folder
3. Shared primitives in `components/ui/`
4. New code only when the design requires a genuinely reusable primitive

### Do not do these things

- Do not invent a separate design system just for one screen.
- Do not replace Tailwind utility composition with a CSS framework rewrite.
- Do not add Storybook as a dependency unless the project explicitly decides to adopt it.
- Do not introduce remote asset assumptions without adding the corresponding config and runtime path.

## 9. Quick Reference

If you need the authoritative files quickly, start here:

- Tokens and global styling: [`memoryos-frontend/app/globals.css`](memoryos-frontend/app/globals.css)
- Fonts and app shell: [`memoryos-frontend/app/layout.tsx`](memoryos-frontend/app/layout.tsx)
- Build and framework stack: [`memoryos-frontend/package.json`](memoryos-frontend/package.json)
- Theme bootstrap: [`memoryos-frontend/public/theme-bootstrap.js`](memoryos-frontend/public/theme-bootstrap.js)
- Shared UI primitives: [`memoryos-frontend/components/ui/`](memoryos-frontend/components/ui/)
- Console primitives: [`memoryos-frontend/components/mission-control/console-ui.tsx`](memoryos-frontend/components/mission-control/console-ui.tsx)
- Icon sprite wrapper: [`memoryos-frontend/components/ui/icon.tsx`](memoryos-frontend/components/ui/icon.tsx)
- Brand icon mapping: [`memoryos-frontend/components/mission-control/connector-brand-icons.tsx`](memoryos-frontend/components/mission-control/connector-brand-icons.tsx)
- Static assets: [`memoryos-frontend/public/`](memoryos-frontend/public/)
