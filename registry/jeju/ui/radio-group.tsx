"use client"

import * as React from "react"
import { RadioGroup as RadioGroupPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function RadioGroup({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return (
    <RadioGroupPrimitive.Root
      data-slot="radio-group"
      className={cn("grid w-full gap-2", className)}
      {...props}
    />
  )
}

function RadioGroupItem({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-group-item"
      className={cn(
        "group/radio-group-item peer relative flex aspect-square size-(--jeju-choice-size) shrink-0 items-center justify-center rounded-full border-2 border-input bg-card outline-none after:absolute after:-inset-x-3 after:-inset-y-2 not-disabled:hover:border-primary focus-visible:border-ring focus-visible:shadow-(--jeju-focus-ring) disabled:cursor-not-allowed disabled:border-(--jeju-disabled-border) disabled:bg-(--jeju-disabled-bg) aria-invalid:border-destructive data-checked:border-primary forced-colors:forced-color-adjust-none forced-colors:border-[ButtonText] forced-colors:bg-[Canvas] forced-colors:data-checked:border-[Highlight]",
        className
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator
        data-slot="radio-group-indicator"
        className="flex size-full items-center justify-center"
      >
        <span className="size-[50%] rounded-full bg-primary forced-colors:bg-[Highlight]" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  )
}

export { RadioGroup, RadioGroupItem }
