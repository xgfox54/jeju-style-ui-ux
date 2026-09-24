"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Toggle as TogglePrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

const toggleVariants = cva(
  "group/toggle inline-flex items-center justify-center gap-1.5 rounded-lg border border-transparent text-(length:--jeju-control-font) font-bold whitespace-nowrap text-(--jeju-text-body) transition-all outline-none hover:bg-muted focus-visible:border-ring focus-visible:shadow-(--jeju-focus-ring) disabled:pointer-events-none disabled:text-(--jeju-disabled-text) data-[state=on]:bg-(--jeju-primary-tint) data-[state=on]:text-primary forced-colors:data-[state=on]:forced-color-adjust-none forced-colors:data-[state=on]:bg-[Highlight] forced-colors:data-[state=on]:text-[HighlightText] [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline: "border-input bg-card data-[state=on]:border-primary",
      },
      size: {
        default: "h-(--jeju-control-h) min-w-(--jeju-control-h) px-3",
        sm: "h-(--jeju-control-h-sm) min-w-(--jeju-control-h-sm) px-2.5 text-(length:--jeju-control-font-sm)",
        lg: "h-(--jeju-control-h-lg) min-w-(--jeju-control-h-lg) px-3.5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Toggle({
  className,
  variant = "default",
  size = "default",
  ...props
}: React.ComponentProps<typeof TogglePrimitive.Root> &
  VariantProps<typeof toggleVariants>) {
  return (
    <TogglePrimitive.Root
      data-slot="toggle"
      className={cn(toggleVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Toggle, toggleVariants }
