import * as React from "react"

import { cn } from "@/lib/utils"

// 페이지 첫 줄: 제목(h1) · 설명 · 주요 액션. 560px 이하에서는 액션이 제목 아래로 내려가 가로를 채운다.
function PageHead({
  title,
  description,
  actions,
  level = 1,
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "title"> & {
  title: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
  level?: 1 | 2
}) {
  const Heading = level === 1 ? "h1" : "h2"

  return (
    <div
      data-slot="page-head"
      className={cn(
        "mb-5 flex items-start justify-between gap-5 max-[560px]:grid",
        className
      )}
      {...props}
    >
      <div className="min-w-0">
        <Heading
          className={cn(
            "m-0 leading-(--jeju-leading-tight) font-bold text-(--jeju-text-strong)",
            level === 1 ? "text-(length:--jeju-h1-size)" : "text-(length:--jeju-h2-size)"
          )}
        >
          {title}
        </Heading>
        {description ? (
          <p className="mt-2 mb-0 text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2 max-[560px]:w-full max-[560px]:*:flex-auto">
          {actions}
        </div>
      ) : null}
    </div>
  )
}

export { PageHead }
