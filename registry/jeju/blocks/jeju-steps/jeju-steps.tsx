import * as React from "react"

import { cn } from "@/lib/utils"

// 단계 표시. 완료·현재 단계·예정을 색과 함께 문구로도 알리고, 현재 단계에 aria-current="step"을 둔다.
// 700px 이하에서는 세로 목록으로 바뀐다(Tier 1 .jeju-steps).
type StepState = "done" | "current" | "todo"

const stateText: Record<StepState, string> = {
  done: "완료",
  current: "현재 단계",
  todo: "예정",
}

function Steps({
  steps,
  current,
  className,
  ...props
}: Omit<React.ComponentProps<"ol">, "children"> & {
  steps: Array<{ label: string }>
  current: number
}) {
  return (
    <ol
      data-slot="steps"
      className={cn(
        "m-0 flex list-none p-0 max-[700px]:grid max-[700px]:gap-4",
        className
      )}
      {...props}
    >
      {steps.map((step, index) => {
        const state: StepState = index < current ? "done" : index === current ? "current" : "todo"
        return (
          <li
            key={step.label}
            data-state={state}
            aria-current={state === "current" ? "step" : undefined}
            className="group/step relative grid min-w-0 flex-1 justify-items-center gap-2 px-2 text-center text-muted-foreground before:absolute before:top-[calc(var(--jeju-step-dot)/2)] before:right-1/2 before:-left-1/2 before:h-0.5 before:bg-(--jeju-border-strong) first:before:hidden data-[state=current]:before:bg-primary data-[state=done]:before:bg-(--jeju-success) max-[700px]:grid-cols-[var(--jeju-step-dot)_minmax(0,1fr)] max-[700px]:items-center max-[700px]:justify-items-start max-[700px]:gap-x-3 max-[700px]:gap-y-0 max-[700px]:px-0 max-[700px]:text-left max-[700px]:before:hidden"
          >
            <span
              aria-hidden="true"
              className="relative z-1 grid size-(--jeju-step-dot) place-items-center rounded-full border-2 border-(--jeju-border-strong) bg-card font-extrabold text-muted-foreground tabular-nums group-data-[state=current]/step:border-primary group-data-[state=current]/step:bg-primary group-data-[state=current]/step:text-(--jeju-on-fill) group-data-[state=done]/step:border-(--jeju-success) group-data-[state=done]/step:bg-(--jeju-success) group-data-[state=done]/step:text-(--jeju-on-fill) max-[700px]:row-span-2 forced-colors:forced-color-adjust-none forced-colors:border-[CanvasText] forced-colors:bg-[Canvas] forced-colors:text-[CanvasText] forced-colors:group-data-[state=current]/step:bg-[Highlight] forced-colors:group-data-[state=current]/step:text-[HighlightText] forced-colors:group-data-[state=done]/step:bg-[Highlight] forced-colors:group-data-[state=done]/step:text-[HighlightText]"
            >
              {index + 1}
            </span>
            <span className="text-(length:--jeju-control-font) font-bold wrap-anywhere text-(--jeju-text-body) group-data-[state=current]/step:text-primary max-[700px]:col-start-2">
              {step.label}
            </span>
            <span className="text-(length:--jeju-text-xs) font-bold max-[700px]:col-start-2">
              {stateText[state]}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

export { Steps, type StepState }
