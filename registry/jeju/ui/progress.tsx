"use client"

import * as React from "react"
import { Progress as ProgressPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

// role="progressbar"와 aria-valuenow는 Radix가 붙인다. 화면에는 숫자 문구(예: "4단계 중 1단계")를 함께 둔다.
function Progress({
  className,
  value,
  variant = "default",
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root> & {
  variant?: "default" | "success" | "warning" | "danger"
}) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      data-variant={variant}
      value={value}
      className={cn(
        "group/progress relative flex h-(--jeju-progress-h) w-full items-center overflow-x-hidden rounded-full bg-border forced-colors:forced-color-adjust-none forced-colors:border forced-colors:border-[CanvasText] forced-colors:bg-[Canvas]",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className="size-full flex-1 rounded-full bg-primary transition-all group-data-[variant=danger]/progress:bg-(--jeju-danger) group-data-[variant=success]/progress:bg-(--jeju-success) group-data-[variant=warning]/progress:bg-(--jeju-warning) forced-colors:bg-[Highlight]"
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }
