"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { RefreshIcon, WarningIcon } from "@/components/ui/jeju-icons"

// 로딩 · 오류 상태(Tier 1 .jeju-state · data-jeju-async). 목록이나 상세를 불러오는 자리에 같은 모양으로 둔다.
// 불러오는 동안은 role="status" 문구와 aria-busy, 실패하면 role="alert"로 무엇이 안 됐는지와 다음 행동(다시 시도 · 문의)을 알린다.
function LoadingState({
  title = "불러오는 중입니다.",
  lines = 0,
  className,
}: {
  title?: string
  lines?: number
  className?: string
}) {
  return (
    <div
      role="status"
      data-slot="loading-state"
      className={cn("grid justify-items-center gap-3 px-5 py-10.5 text-center text-muted-foreground", className)}
    >
      <Spinner label={title} className="size-(--jeju-icon-lg)" />
      <p className="m-0">{title}</p>
      {lines > 0 ? (
        <div className="grid w-full max-w-[420px] gap-2" aria-hidden="true">
          {Array.from({ length: lines }, (_, index) => (
            <Skeleton key={index} className={cn("h-4", index === lines - 1 && "w-2/5")} />
          ))}
        </div>
      ) : null}
    </div>
  )
}

function ErrorState({
  title = "정보를 불러오지 못했습니다",
  description = "잠시 뒤 다시 시도해 주세요. 문제가 계속되면 담당 부서에 문의해 주세요.",
  onRetry,
  retryLabel = "다시 시도",
  level = 3,
  className,
}: {
  title?: string
  description?: React.ReactNode
  onRetry?: () => void
  retryLabel?: string
  level?: 2 | 3
  className?: string
}) {
  const Heading = level === 2 ? "h2" : "h3"
  return (
    <div
      role="alert"
      data-slot="error-state"
      className={cn("grid justify-items-center gap-3 px-5 py-10.5 text-center text-muted-foreground", className)}
    >
      <WarningIcon className="size-(--jeju-icon-lg) text-destructive" />
      <Heading className="m-0 text-(length:--jeju-h3-size) font-bold text-destructive">{title}</Heading>
      <p className="m-0 max-w-[560px]">{description}</p>
      {onRetry ? (
        <Button variant="outline" onClick={onRetry}>
          <RefreshIcon />
          {retryLabel}
        </Button>
      ) : null}
    </div>
  )
}

type AsyncStatus = "loading" | "error" | "empty" | "ready"

// 한 자리에서 네 가지 상태 중 하나만 보여 준다. empty는 호출한 쪽이 Empty 컴포넌트로 채운다.
// 상태가 바뀌면서 포커스가 있던 버튼(다시 시도 등)이 사라지면 포커스가 문서 처음으로 튕기므로 이 영역으로 옮긴다.
function AsyncState({
  status,
  loading,
  error,
  empty,
  children,
  className,
}: {
  status: AsyncStatus
  loading?: React.ReactNode
  error?: React.ReactNode
  empty?: React.ReactNode
  children?: React.ReactNode
  className?: string
}) {
  const ref = React.useRef<HTMLDivElement>(null)
  const focusInside = React.useRef(false)

  React.useEffect(() => {
    const track = (event: FocusEvent) => {
      focusInside.current = !!ref.current?.contains(event.target as Node)
    }
    document.addEventListener("focusin", track)
    return () => document.removeEventListener("focusin", track)
  }, [])

  React.useLayoutEffect(() => {
    const region = ref.current
    if (!region || !focusInside.current) return
    const active = document.activeElement
    if (!active || active === document.body) region.focus({ preventScroll: true })
  }, [status])

  return (
    <div
      ref={ref}
      tabIndex={-1}
      data-slot="async-state"
      data-state={status}
      aria-busy={status === "loading"}
      className={cn("min-w-0", className)}
    >
      {status === "loading" ? loading ?? <LoadingState /> : null}
      {status === "error" ? error ?? <ErrorState /> : null}
      {status === "empty" ? empty : null}
      {status === "ready" ? children : null}
    </div>
  )
}

export { AsyncState, ErrorState, LoadingState, type AsyncStatus }
