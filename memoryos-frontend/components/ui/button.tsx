import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"
import { PixelLoadOverlay } from "@/components/ui/pixel-load-overlay"
import { inferPixelToneFromClassName } from "@/lib/pixel-button-runtime"

const buttonVariants = cva(
  "group/button relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-md text-xs font-medium whitespace-nowrap transition-all duration-200 outline-none select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2b7cff]/50 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "btn-glossy-blue bg-gradient-to-b from-[#2b7cff] via-[#1765ec] to-[#115bd9] text-[#F0EFE2] border border-[#0d53c9] shadow-[inset_0_1.5px_0.5px_0_rgba(255,255,255,0.45),inset_0_-1.5px_1.5px_0_rgba(0,0,0,0.15),0_2px_6px_0_rgba(17,91,217,0.35)] hover:from-[#2272f8] hover:via-[#125cdb] hover:to-[#0d4eb8] hover:border-[#0947ba] hover:shadow-[inset_0_1px_0.5px_0_rgba(255,255,255,0.35),inset_0_-1px_1px_0_rgba(0,0,0,0.2),0_4px_12px_0_rgba(17,91,217,0.45)] hover:scale-[0.985] active:scale-[0.97]",
        outline:
          "border border-black/10 bg-white/90 text-black/80 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.8),0_1px_2px_rgba(0,0,0,0.04)] hover:bg-white hover:text-black hover:border-black/20 hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,1),0_2px_4px_rgba(0,0,0,0.06)] hover:scale-[0.985] active:scale-[0.97] dark:border-white/10 dark:bg-white/5 dark:text-[#F0EFE2] dark:hover:bg-white/10",
        secondary:
          "border border-black/5 bg-black/[0.04] text-black/90 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.5)] hover:bg-black/[0.07] hover:scale-[0.985] active:scale-[0.97] dark:bg-white/10 dark:text-[#F0EFE2] dark:hover:bg-white/15",
        ghost:
          "hover:bg-black/5 hover:text-black hover:scale-[0.985] active:scale-[0.97] dark:hover:bg-white/10 dark:hover:text-[#F0EFE2]",
        destructive:
          "bg-gradient-to-b from-[#ef4444] to-[#dc2626] text-[#F0EFE2] border border-[#b91c1c] shadow-[inset_0_1.5px_0.5px_0_rgba(255,255,255,0.35),0_2px_6px_0_rgba(220,38,38,0.3)] hover:from-[#dc2626] hover:to-[#b91c1c] hover:scale-[0.985] active:scale-[0.97]",
        link: "text-primary underline-offset-4 hover:underline",
        glossy: "btn-glossy-blue",
      },
      size: {
        default:
          "h-9 gap-1.5 px-4 text-xs rounded-md",
        xs: "h-6 gap-1 rounded-md px-2 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7.5 gap-1.5 rounded-md px-3 text-xs [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-10 gap-2 px-5 text-sm rounded-md [&_svg:not([class*='size-'])]:size-4.5",
        icon: "size-9 rounded-md",
        "icon-xs": "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-7.5 rounded-md",
        "icon-lg": "size-10 rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  loading = false,
  children,
  disabled,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    loading?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"
  const resolvedClassName = cn(
    buttonVariants({ variant, size, className })
  )

  if (asChild) {
    return (
      <Comp
        data-slot="button"
        data-variant={variant}
        data-size={size}
        className={resolvedClassName}
        disabled={disabled}
        aria-busy={loading || undefined}
        {...props}
      >
        {children}
      </Comp>
    )
  }

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      disabled={disabled}
      aria-busy={loading || undefined}
      className={resolvedClassName}
      {...props}
    >
      {children}
    </Comp>
  )
}

export { Button, buttonVariants }
