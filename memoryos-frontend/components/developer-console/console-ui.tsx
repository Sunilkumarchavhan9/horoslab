"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export function ConsolePage({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className={cn("space-y-6 pb-10", className)}
    >
      {children}
    </motion.div>
  );
}

type ConsolePageHeaderProps = {
  title: string;
  description?: string;
  meta?: string;
  badge?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export function ConsolePageHeader({
  title,
  description,
  meta,
  badge,
  actions,
  className,
}: ConsolePageHeaderProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-border/80 bg-card/40 px-5 py-5 shadow-sm backdrop-blur-sm sm:px-6 sm:py-6",
        className,
      )}
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_0%_0%,color-mix(in_oklab,var(--primary)_12%,transparent),transparent_55%)]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      />
      <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
        <div>
          <motion.div
            className="flex flex-wrap items-center gap-2"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24 }}
          >
            <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              {title}
            </h1>
            {badge}
          </motion.div>
          {description ? (
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          ) : null}
          {meta ? <p className="mt-2 text-xs text-muted-foreground">{meta}</p> : null}
        </div>
        {actions ? <motion.div className="flex flex-wrap items-center gap-2">{actions}</motion.div> : null}
      </div>
    </div>
  );
}

export function ConsoleStatGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={cn(
        "grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5",
        className,
      )}
      initial="hidden"
      animate="show"
      variants={{
        hidden: { opacity: 0 },
        show: {
          opacity: 1,
          transition: { staggerChildren: 0.05, delayChildren: 0.04 },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

export function ConsoleStatCard({
  label,
  value,
  hint,
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  className?: string;
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 8 },
        show: { opacity: 1, y: 0, transition: { duration: 0.22 } },
      }}
    >
      <Card
        size="sm"
        className={cn(
          "rounded-xl border-border/80 bg-card/80 shadow-sm ring-1 ring-foreground/[0.04]",
          className,
        )}
      >
        <CardHeader className="pb-1">
          <CardDescription className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-2xl font-semibold tracking-tight text-foreground tabular-nums">
            {value}
          </p>
          {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function ConsoleSectionCard({
  title,
  description,
  action,
  children,
  className,
  footer,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  footer?: ReactNode;
}) {
  return (
    <Card
      className={cn(
        "rounded-xl border-border/80 bg-card shadow-sm ring-1 ring-foreground/[0.04]",
        className,
      )}
    >
      <CardHeader className="border-b border-border/60 [.border-b]:pb-4">
        <motion.div
          className="flex items-start justify-between gap-3"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.22 }}
        >
          <div>
            <CardTitle className="text-sm font-semibold text-foreground">{title}</CardTitle>
            {description ? (
              <CardDescription className="mt-1">{description}</CardDescription>
            ) : null}
          </div>
          {action}
        </motion.div>
      </CardHeader>
      <CardContent className="pt-4">{children}</CardContent>
      {footer ? <CardFooter className="border-t border-border/60">{footer}</CardFooter> : null}
    </Card>
  );
}

export function ConsoleStatusBadge({
  label,
  active = false,
  className,
}: {
  label: string;
  active?: boolean;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium normal-case tracking-normal",
        active
          ? "border-primary/30 bg-primary/10 text-foreground"
          : "border-border bg-muted/30 text-muted-foreground",
        className,
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          active ? "bg-primary" : "bg-muted-foreground/50",
        )}
      />
      {label}
    </Badge>
  );
}

export function ConsoleNavSearch({
  value,
  onChange,
  placeholder = "Search…",
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <MagnifyingGlass
        className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-9 rounded-lg border-border/80 bg-sidebar-accent/50 pl-8 text-sm shadow-none"
      />
    </div>
  );
}

export function ConsoleAlert({
  children,
  variant = "destructive",
  className,
}: {
  children: ReactNode;
  variant?: "destructive" | "default";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border px-3.5 py-3 text-sm",
        variant === "destructive"
          ? "border-destructive/25 bg-destructive/10 text-destructive"
          : "border-border bg-muted/40 text-muted-foreground",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function ConsoleToolbar({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={cn(
        "flex flex-wrap items-center gap-1 rounded-lg border border-border/80 bg-muted/30 p-1",
        className,
      )}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: 0.05 }}
    >
      {children}
    </motion.div>
  );
}

export function ConsoleToolbarButton({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <Button
      type="button"
      variant={active ? "secondary" : "ghost"}
      size="sm"
      onClick={onClick}
      className={cn(
        "h-8 rounded-md px-3 text-xs font-medium",
        active && "bg-background shadow-sm",
      )}
    >
      {children}
    </Button>
  );
}

export function ConsoleEmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-muted/20 px-6 py-12 text-center">
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description ? (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function ConsoleDivider() {
  return <Separator className="bg-border/60" />;
}

export { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input };
