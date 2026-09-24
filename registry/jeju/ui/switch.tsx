"use client"

import * as React from "react"
import { Switch as SwitchPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

// 켜짐/꺼짐은 색 외에 문구로도 보여 준다. 스위치 옆에 상태 문구를 함께 둔다.
function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer group/switch relative inline-flex h-(--jeju-switch-h) w-(--jeju-switch-w) shrink-0 items-center rounded-full border border-input bg-muted px-[3px] transition-colors outline-none after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:border-ring focus-visible:shadow-(--jeju-focus-ring) aria-invalid:border-destructive data-checked:border-primary data-checked:bg-primary data-disabled:cursor-not-allowed data-disabled:border-(--jeju-disabled-border) data-disabled:bg-(--jeju-disabled-bg) forced-colors:forced-color-adjust-none forced-colors:border-[ButtonText] forced-colors:bg-[Canvas] forced-colors:data-checked:border-[Highlight] forced-colors:data-checked:bg-[Highlight]",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="pointer-events-none block size-[calc(var(--jeju-switch-h)-10px)] rounded-full bg-muted-foreground transition-transform data-checked:translate-x-[calc(var(--jeju-switch-w)-var(--jeju-switch-h)+2px)] data-checked:bg-card data-unchecked:translate-x-0 forced-colors:forced-color-adjust-none forced-colors:bg-[ButtonText] forced-colors:data-checked:bg-[HighlightText]"
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
