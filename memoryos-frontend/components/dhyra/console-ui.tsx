"use client";

import type { ComponentProps, ReactNode } from "react";
import { motion } from "framer-motion";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { Badge as ShadcnBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card as ShadcnCard,
  CardContent as ShadcnCardContent,
  CardDescription as ShadcnCardDescription,
  CardFooter as ShadcnCardFooter,
  CardHeader as ShadcnCardHeader,
  CardTitle as ShadcnCardTitle,
} from "@/components/ui/card";
import { Input as ShadcnInput } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type DivProps = ComponentProps<"div">;

function Card({ className, size = "default", ...props }: DivProps & { size?: "default" | "sm" }) {
  return (
    <ShadcnCard
      size={size}
      className={cn("console-surface border-border bg-card text-card-foreground", className)}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: DivProps) {
  return <ShadcnCardHeader className={className} {...props} />;
}

function CardContent({ className, ...props }: DivProps) {
  return <ShadcnCardContent className={className} {...props} />;
}

function CardFooter({ className, ...props }: DivProps) {
  return <ShadcnCardFooter className={className} {...props} />;
}

function CardTitle({ className, ...props }: DivProps) {
  return <ShadcnCardTitle className={cn("text-foreground", className)} {...props} />;
}

function CardDescription({ className, ...props }: DivProps) {
  return <ShadcnCardDescription className={className} {...props} />;
}

function Badge({
  className,
  variant = "default",
  ...props
}: ComponentProps<typeof ShadcnBadge>) {
  return (
    <ShadcnBadge
      variant={variant}
      className={cn("font-medium tracking-normal", className)}
      {...props}
    />
  );
}

function Input({ className, ...props }: ComponentProps<typeof ShadcnInput>) {
  return <ShadcnInput className={cn("bg-background text-foreground", className)} {...props} />;
}

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
        "console-premium-panel relative overflow-hidden border border-border bg-card px-5 py-5 sm:px-6 sm:py-6",
        className,
      )}
    >
      <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
        <div>
          <motion.div
            className="flex flex-wrap items-center gap-2"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24 }}
          >
            <h1 className="text-xl font-medium tracking-tight text-foreground sm:text-2xl">
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
      className={cn("grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5", className)}
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

export function ConsoleGrid({
  children,
  className,
  columns = "auto",
}: {
  children: ReactNode;
  className?: string;
  columns?: "auto" | "two" | "three" | "four" | "five";
}) {
  const columnClass = {
    auto: "grid-cols-1",
    two: "grid-cols-1 lg:grid-cols-2",
    three: "grid-cols-1 md:grid-cols-2 xl:grid-cols-3",
    four: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
    five: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-5",
  }[columns];

  return <div className={cn("grid gap-4", columnClass, className)}>{children}</div>;
}

export function ConsoleSurface({
  children,
  className,
  tone = "default",
  ...props
}: DivProps & {
  children: ReactNode;
  className?: string;
  tone?: "default" | "muted" | "primary" | "destructive";
}) {
  const toneClass = {
    default: "border-border bg-card text-card-foreground",
    muted: "border-border bg-muted text-foreground",
    primary: "border-primary/20 bg-primary/10 text-foreground",
    destructive: "border-destructive/25 bg-destructive/10 text-foreground",
  }[tone];

  return (
    <div className={cn("rounded-md border p-4", toneClass, className)} {...props}>
      {children}
    </div>
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
      <Card size="sm" className={cn("console-stat-surface border-border bg-card", className)}>
        <CardHeader className="pb-1">
          <CardDescription className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-2xl font-medium tracking-tight text-foreground tabular-nums">
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
    <Card className={cn("console-section-surface border-border bg-card", className)}>
      <CardHeader className="pb-1">
        <motion.div
          className="flex items-start justify-between gap-3"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.22 }}
        >
          <div>
            <CardTitle className="text-sm font-medium text-foreground">{title}</CardTitle>
            {description ? <CardDescription className="mt-1">{description}</CardDescription> : null}
          </div>
          {action}
        </motion.div>
      </CardHeader>
      <CardContent className="pt-4">{children}</CardContent>
      {footer ? <CardFooter>{footer}</CardFooter> : null}
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
        "gap-1.5 px-2.5 py-1 text-xs font-medium normal-case tracking-normal",
        active
          ? "border-primary/40 bg-primary/10 text-foreground"
          : "border-border bg-muted/20 text-muted-foreground",
        className,
      )}
    >
      <span
        className={cn("size-1.5 rounded-full", active ? "bg-primary" : "bg-muted-foreground/50")}
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
        className="h-9 border-border bg-sidebar-accent/70 pl-8 text-sm"
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
        "border px-3.5 py-3 text-sm",
        variant === "destructive"
          ? "border-destructive/25 bg-destructive/10 text-destructive"
          : "border-border bg-muted/25 text-muted-foreground",
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
      className={cn("console-toolbar flex flex-wrap items-center gap-1 bg-muted/20 p-1", className)}
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
      className={cn("h-8 px-3 text-xs font-medium", active && "bg-card text-foreground")}
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
    <div className="console-empty-state flex flex-col items-center justify-center bg-muted/10 px-6 py-12 text-center">
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description ? <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function ConsoleDivider() {
  return <div className="h-px w-full bg-border/60" />;
}

export { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input };
