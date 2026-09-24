"use client"

import * as React from "react"
import { Accordion as AccordionPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"
import { ChevronDownIcon } from "@/components/ui/jeju-icons"

// 제목은 heading(h3) 안의 button이다. 위/아래/Home/End로 제목 사이를 이동한다(Radix).
function Accordion({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Root>) {
  return (
    <AccordionPrimitive.Root
      data-slot="accordion"
      className={cn(
        "flex w-full flex-col overflow-hidden rounded-xl border border-border bg-card",
        className
      )}
      {...props}
    />
  )
}

function AccordionItem({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn("not-last:border-b not-last:border-(--jeju-hairline)", className)}
      {...props}
    />
  )
}

function AccordionTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header className="m-0 flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          "group/accordion-trigger relative flex min-h-(--jeju-control-h-lg) flex-1 items-center justify-between gap-3 border border-transparent px-4.5 py-3.5 text-left text-(length:--jeju-text-md) font-bold text-(--jeju-text-strong) transition-all outline-none hover:bg-(--jeju-surface-inset) focus-visible:border-ring focus-visible:shadow-(--jeju-focus-ring) disabled:pointer-events-none disabled:text-(--jeju-disabled-text) aria-expanded:text-primary",
          className
        )}
        {...props}
      >
        {children}
        <ChevronDownIcon
          data-slot="accordion-trigger-icon"
          className="pointer-events-none ml-auto shrink-0 text-muted-foreground transition-transform duration-150 group-aria-expanded/accordion-trigger:rotate-180 group-aria-expanded/accordion-trigger:text-primary"
        />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  )
}

function AccordionContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content
      data-slot="accordion-content"
      className="overflow-hidden text-(length:--jeju-text-base) text-(--jeju-text-body) data-open:animate-accordion-down data-closed:animate-accordion-up"
      {...props}
    >
      <div
        className={cn(
          "h-(--radix-accordion-content-height) px-4.5 pt-0 pb-4.5 [&_a]:underline [&_a]:underline-offset-3 [&_p:not(:last-child)]:mb-4",
          className
        )}
      >
        {children}
      </div>
    </AccordionPrimitive.Content>
  )
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
