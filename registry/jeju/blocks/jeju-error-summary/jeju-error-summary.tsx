"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { WarningIcon } from "@/components/ui/jeju-icons"

// 제출 실패 시 폼 위에 두는 오류 요약. 나타나면 포커스를 받고, 각 항목은 해당 입력으로 이동시킨다.
type ErrorSummaryItem = {
  fieldId: string
  message: string
}

function ErrorSummary({
  errors,
  title = "입력 내용을 확인해 주세요",
  autoFocus = true,
  className,
}: {
  errors: ErrorSummaryItem[]
  title?: string
  autoFocus?: boolean
  className?: string
}) {
  const ref = React.useRef<HTMLDivElement>(null)
  const titleId = React.useId()
  const key = errors.map((error) => error.fieldId + error.message).join("|")

  React.useEffect(() => {
    if (autoFocus && key) ref.current?.focus()
  }, [autoFocus, key])

  if (errors.length === 0) return null

  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="alert"
      aria-labelledby={titleId}
      data-slot="error-summary"
      className={cn(
        "grid gap-2 rounded-lg border border-destructive bg-(--jeju-danger-tint) p-4 text-destructive outline-none focus-visible:shadow-(--jeju-focus-ring)",
        className
      )}
    >
      <h2
        id={titleId}
        className="m-0 flex items-center gap-2 text-(length:--jeju-h3-size) font-bold"
      >
        <WarningIcon />
        {title}
      </h2>
      <ul className="m-0 grid gap-1 pl-5">
        {errors.map((error) => (
          <li key={error.fieldId}>
            <a
              href={"#" + error.fieldId}
              className="font-bold text-inherit underline underline-offset-2"
              onClick={(event) => {
                const target = document.getElementById(error.fieldId)
                if (!target) return
                event.preventDefault()
                target.focus()
                target.scrollIntoView({ block: "center" })
              }}
            >
              {error.message}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

export { ErrorSummary, type ErrorSummaryItem }
