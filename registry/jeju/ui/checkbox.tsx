"use client"

import * as React from "react"
import { Checkbox as CheckboxPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"
import { CheckIcon, MinusIcon } from "@/components/ui/jeju-icons"

// checked="indeterminate"면 부분 선택(가로 막대)을 그린다. 표 전체 선택에 쓴다.
function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer group/checkbox relative flex size-(--jeju-choice-size) shrink-0 items-center justify-center rounded-(--jeju-radius-xs) border-2 border-input bg-card transition-colors outline-none after:absolute after:-inset-x-3 after:-inset-y-2 not-disabled:hover:border-primary focus-visible:border-ring focus-visible:shadow-(--jeju-focus-ring) disabled:cursor-not-allowed disabled:border-(--jeju-disabled-border) disabled:bg-(--jeju-disabled-bg) aria-invalid:border-destructive data-checked:border-primary data-checked:bg-primary data-checked:text-primary-foreground data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground forced-colors:forced-color-adjust-none forced-colors:border-[ButtonText] forced-colors:bg-[Canvas] forced-colors:text-[HighlightText] forced-colors:data-checked:border-[Highlight] forced-colors:data-checked:bg-[Highlight] forced-colors:data-[state=indeterminate]:border-[Highlight] forced-colors:data-[state=indeterminate]:bg-[Highlight]",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current transition-none [&>svg]:size-[calc(var(--jeju-choice-size)-4px)] [&>svg]:[stroke-width:3]"
      >
        <CheckIcon className="group-data-[state=indeterminate]/checkbox:hidden" />
        <MinusIcon className="hidden group-data-[state=indeterminate]/checkbox:block" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
