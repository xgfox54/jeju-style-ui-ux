import * as React from "react"

import { cn } from "@/lib/utils"

// 문의·방문 안내(Tier 1 .jeju-contact). 전화번호는 tel: 링크, 지도는 외부 지도 서비스로 연결한다.
// 지도를 페이지에 끼워 넣지 않는다(망분리 · 외부 스크립트 의존 금지).
type ContactRow = {
  label: string
  value: React.ReactNode
  icon?: React.ReactNode
}

function ContactCard({
  title = "문의·방문 안내",
  rows,
  actions,
  level = 2,
  className,
}: {
  title?: string
  rows: ContactRow[]
  actions?: React.ReactNode
  level?: 2 | 3
  className?: string
}) {
  const titleId = React.useId()
  const Heading = level === 2 ? "h2" : "h3"

  return (
    <section
      data-slot="contact-card"
      aria-labelledby={titleId}
      className={cn(
        "grid min-w-0 content-start gap-4 rounded-xl border border-border bg-card p-(--jeju-card-pad)",
        className
      )}
    >
      <Heading id={titleId} className="m-0 text-(length:--jeju-text-xl) font-bold text-(--jeju-text-strong)">
        {title}
      </Heading>
      <dl className="m-0 grid gap-2">
        {rows.map((row) => (
          <div
            key={row.label}
            className="grid grid-cols-[8em_minmax(0,1fr)] items-center gap-3 max-[560px]:grid-cols-1 max-[560px]:gap-0"
          >
            <dt className="inline-flex items-center gap-2 font-bold text-muted-foreground">
              {row.icon}
              {row.label}
            </dt>
            <dd className="m-0 wrap-anywhere text-(--jeju-text-body) [&_a]:inline-flex [&_a]:min-h-(--jeju-target-min) [&_a]:items-center [&_a]:font-bold">
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </section>
  )
}

export { ContactCard, type ContactRow }
