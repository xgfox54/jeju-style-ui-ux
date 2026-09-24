"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ArrowLeftIcon, ArrowRightIcon } from "@/components/ui/jeju-icons"
import { Steps } from "@/components/jeju-steps"

// 신청 절차 마법사. 이전/다음 버튼으로 이동하고 양 끝에서 비활성된다.
// 단계가 바뀌면 새 단계 영역으로 포커스를 옮겨 스크린리더 사용자가 바뀐 내용을 바로 듣게 한다.
type WizardStep = {
  label: string
  content: React.ReactNode
}

function Wizard({
  steps,
  initialStep = 0,
  onStepChange,
  onComplete,
  completeLabel = "신청하기",
  progressLabel = "진행률",
  className,
}: {
  steps: WizardStep[]
  initialStep?: number
  onStepChange?: (index: number) => void
  onComplete?: () => void
  completeLabel?: string
  progressLabel?: string
  className?: string
}) {
  const [index, setIndex] = React.useState(initialStep)
  const panelRef = React.useRef<HTMLDivElement>(null)
  const moved = React.useRef(false)
  const last = steps.length - 1
  const percent = Math.round(((index + 1) / steps.length) * 100)

  React.useEffect(() => {
    if (!moved.current) return
    panelRef.current?.focus()
  }, [index])

  const go = (target: number) => {
    if (target < 0 || target > last) return
    moved.current = true
    setIndex(target)
    onStepChange?.(target)
  }

  return (
    <div
      data-slot="wizard"
      className={cn(
        "grid min-w-0 gap-6 rounded-xl border border-border bg-card p-(--jeju-card-pad)",
        className
      )}
    >
      <Steps steps={steps} current={index} aria-label="진행 단계" />

      <div className="grid gap-1.5">
        <div className="flex flex-wrap justify-between gap-3 text-(length:--jeju-text-sm) text-muted-foreground">
          <span aria-live="polite">
            전체 {steps.length}단계 중 {index + 1}단계
          </span>
          <strong className="text-(--jeju-text-strong) tabular-nums">{percent}%</strong>
        </div>
        <Progress value={percent} aria-label={progressLabel} />
      </div>

      <div
        ref={panelRef}
        tabIndex={-1}
        role="group"
        aria-label={index + 1 + "단계 " + steps[index]?.label}
        className="min-w-0 rounded-lg outline-none focus-visible:shadow-(--jeju-focus-ring)"
      >
        {steps[index]?.content}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button variant="outline" size="lg" disabled={index === 0} onClick={() => go(index - 1)}>
          <ArrowLeftIcon />
          이전 단계
        </Button>
        {index === last && onComplete ? (
          <Button size="lg" onClick={onComplete}>
            {completeLabel}
          </Button>
        ) : (
          <Button size="lg" disabled={index === last} onClick={() => go(index + 1)}>
            {index === last - 1 ? "마지막 단계로" : "다음 단계"}
            <ArrowRightIcon />
          </Button>
        )}
      </div>
    </div>
  )
}

export { Wizard, type WizardStep }
