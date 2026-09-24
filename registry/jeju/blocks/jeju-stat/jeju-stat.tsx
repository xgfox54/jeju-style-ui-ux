import * as React from "react"

import { cn } from "@/lib/utils"

// KPI 묶음. 4열 → 1024px 이하 2열 → 560px 이하 1열. 숫자는 tabular-nums로 자릿수를 맞춘다.
function StatGrid({ className, ...props }: React.ComponentProps<"section">) {
  return (
    <section
      data-slot="stat-grid"
      className={cn(
        "grid grid-cols-4 gap-3.5 max-[1024px]:grid-cols-2 max-[560px]:grid-cols-1",
        className
      )}
      {...props}
    />
  )
}

function Stat({
  label,
  value,
  meta,
  className,
  ...props
}: Omit<React.ComponentProps<"article">, "children"> & {
  label: React.ReactNode
  value: React.ReactNode
  meta?: React.ReactNode
}) {
  return (
    <article
      data-slot="stat"
      className={cn("min-w-0 rounded-xl border border-border bg-card p-4.5", className)}
      {...props}
    >
      <div className="text-(length:--jeju-text-sm) font-bold text-muted-foreground">{label}</div>
      <div className="mt-1.5 text-(length:--jeju-kpi-size) leading-[1.1] font-extrabold text-(--jeju-text-strong) tabular-nums">
        {value}
      </div>
      {meta ? (
        <div className="mt-2 text-(length:--jeju-text-xs) text-(--jeju-text-subtle)">{meta}</div>
      ) : null}
    </article>
  )
}

export { Stat, StatGrid }
