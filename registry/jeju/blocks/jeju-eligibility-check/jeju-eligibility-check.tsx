"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Field, FieldDescription, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { CheckIcon, InfoIcon, WarningIcon } from "@/components/ui/jeju-icons"

// 신청 자격 확인(Tier 1 .jeju-checklist). 질문마다 예/아니요를 고르면 결과를 알림 색과 문구로 함께 보여 준다.
// 결과는 자가 확인이다. 최종 판단이 아니라는 안내를 화면 설명에 둔다.
type EligibilityQuestion = {
  id: string
  label: string
  question: string
  hint?: string
  qualify?: "yes" | "no"
}

type Answer = "yes" | "no"

function EligibilityCheck({
  questions,
  eligibleTitle = "신청할 수 있을 가능성이 높습니다.",
  eligibleText = "신청 절차로 이동해 필요한 서류를 준비하세요. 최종 결과는 심사 후 안내합니다.",
  checkTitle = "상담이 필요합니다.",
  checkText = "가까운 읍·면·동 주민센터에서 다른 지원을 함께 확인할 수 있습니다.",
  className,
}: {
  questions: EligibilityQuestion[]
  eligibleTitle?: string
  eligibleText?: string
  checkTitle?: string
  checkText?: string
  className?: string
}) {
  const [answers, setAnswers] = React.useState<Record<string, Answer>>({})
  const answered = questions.filter((q) => answers[q.id]).length
  const unmet = questions.filter((q) => answers[q.id] && answers[q.id] !== (q.qualify ?? "yes"))

  const state: "info" | "success" | "warning" =
    answered < questions.length ? "info" : unmet.length ? "warning" : "success"
  const title =
    state === "info"
      ? "질문 " + questions.length + "개 중 " + answered + "개에 답했습니다."
      : state === "success"
        ? eligibleTitle
        : checkTitle
  const text =
    state === "info"
      ? "모든 질문에 답하면 신청할 수 있는지 알려 드립니다."
      : state === "success"
        ? eligibleText
        : "조건과 맞지 않는 항목: " + unmet.map((q) => q.label).join(", ") + ". " + checkText

  return (
    <div data-slot="eligibility-check" className={cn("grid min-w-0 gap-3", className)}>
      {questions.map((q, index) => {
        const hintId = q.id + "-hint"
        return (
          <div key={q.id} className="rounded-xl border border-border bg-card px-5 py-4">
            <FieldSet className="gap-2">
              <FieldLegend className="mb-0 text-(--jeju-text-strong)">
                <span className="mr-2 text-primary tabular-nums">{index + 1}.</span>
                {q.question}
              </FieldLegend>
              {q.hint ? <FieldDescription id={hintId}>{q.hint}</FieldDescription> : null}
              <RadioGroup
                value={answers[q.id] ?? ""}
                onValueChange={(value) => setAnswers((current) => ({ ...current, [q.id]: value as Answer }))}
                aria-describedby={q.hint ? hintId : undefined}
                className="flex flex-wrap gap-x-6 gap-y-0"
              >
                {(["yes", "no"] as const).map((value) => (
                  <Field key={value} orientation="horizontal" className="w-auto">
                    <RadioGroupItem id={q.id + "-" + value} value={value} />
                    <FieldLabel htmlFor={q.id + "-" + value} className="font-semibold">
                      {value === "yes" ? "예" : "아니요"}
                    </FieldLabel>
                  </Field>
                ))}
              </RadioGroup>
            </FieldSet>
          </div>
        )
      })}
      <Alert variant={state} role="status" data-state={state}>
        {state === "success" ? <CheckIcon /> : state === "warning" ? <WarningIcon /> : <InfoIcon />}
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>{text}</AlertDescription>
      </Alert>
    </div>
  )
}

export { EligibilityCheck, type EligibilityQuestion }
