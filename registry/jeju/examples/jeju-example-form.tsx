"use client"

import * as React from "react"
import type { DateRange } from "react-day-picker"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Toaster } from "@/components/ui/sonner"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { HelpIcon } from "@/components/ui/jeju-icons"
import { DatePicker, DateRangePicker, type RangePreset } from "@/components/jeju-date-picker"
import { ErrorSummary, type ErrorSummaryItem } from "@/components/jeju-error-summary"
import { FileUpload } from "@/components/jeju-file-upload"
import { PageHead } from "@/components/jeju-page-head"
import { WorkShell } from "@/components/jeju-shell"

// 업무 폼 기준 예제: 대상자 등록(Tier 1 design/examples/form.html의 React판).
// 상태 계층(기본·hover·focus·readonly·disabled·필수·오류)과 오류 요약 → 입력 이동을 보여 준다.
const nav = {
  title: "통합돌봄",
  label: "업무 메뉴",
  items: [
    { label: "대상자 현황", href: "#/work" },
    { label: "서비스 연계", href: "#/work" },
    { label: "대상자 등록", href: "#/form", current: true },
    { label: "기준정보", href: "#/work" },
  ],
}

const serviceOptions = ["식사 지원", "안부 확인", "방문 건강", "이동 지원", "주거환경 개선"]

function addMonths(from: Date, months: number): DateRange {
  return { from, to: new Date(from.getFullYear(), from.getMonth() + months, from.getDate() - 1) }
}

function forwardPresets(start: () => Date): RangePreset[] {
  return [
    { label: "3개월", range: () => addMonths(start(), 3) },
    { label: "6개월", range: () => addMonths(start(), 6) },
    { label: "1년", range: () => addMonths(start(), 12) },
  ]
}

function sectionTitle(text: string, description: string) {
  return (
    <div className="grid gap-1 border-b-2 border-border pb-3">
      <h2 className="m-0 text-(length:--jeju-h2-size) font-bold text-(--jeju-text-strong)">{text}</h2>
      <p className="m-0 text-(length:--jeju-text-sm) text-muted-foreground">{description}</p>
    </div>
  )
}

export default function JejuExampleForm() {
  const [name, setName] = React.useState("")
  const [birth, setBirth] = React.useState<Date | undefined>()
  const [district, setDistrict] = React.useState("")
  const [level, setLevel] = React.useState("")
  const [needs, setNeeds] = React.useState<string[]>([])
  const [urgent, setUrgent] = React.useState(false)
  const [period, setPeriod] = React.useState<DateRange | undefined>()
  const [errors, setErrors] = React.useState<ErrorSummaryItem[]>([])
  const [submitted, setSubmitted] = React.useState(false)

  const errorFor = (fieldId: string) => (submitted ? errors.find((error) => error.fieldId === fieldId) : undefined)

  const validate = () => {
    const next: ErrorSummaryItem[] = []
    if (!name.trim()) next.push({ fieldId: "client-name", message: "대상자 이름을 입력해 주세요." })
    if (!birth) next.push({ fieldId: "client-birth", message: "생년월일을 달력에서 선택해 주세요." })
    if (!district) next.push({ fieldId: "client-district", message: "거주 지역을 선택해 주세요." })
    if (!level) next.push({ fieldId: "care-level-1", message: "돌봄 필요도를 하나 선택해 주세요." })
    if (needs.length === 0) next.push({ fieldId: "need-0", message: "필요한 서비스를 하나 이상 선택해 주세요." })
    return next
  }

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    const next = validate()
    setSubmitted(true)
    setErrors(next)
    if (next.length === 0) toast.success(name + " 대상자를 등록했습니다.")
  }

  return (
    <TooltipProvider>
      <WorkShell brand={{ name: "통합돌봄 업무관리", href: "#/work" }} systemName="제주특별자치도" nav={nav}>
        <PageHead
          title="대상자 등록"
          description="필수 항목을 모두 입력한 뒤 등록합니다. 입력 중인 내용은 임시 저장할 수 있습니다."
        />
        <form noValidate onSubmit={onSubmit} className="grid gap-8">
          <ErrorSummary errors={submitted ? errors : []} />

          <section className="grid gap-4">
            {sectionTitle("기본 정보", "대상자를 식별하는 정보입니다.")}
            <div className="grid grid-cols-2 gap-4 max-[700px]:grid-cols-1">
              <Field data-invalid={!!errorFor("client-name")}>
                <Label htmlFor="client-name" required>
                  대상자 이름
                </Label>
                <Input
                  id="client-name"
                  autoComplete="off"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  aria-invalid={!!errorFor("client-name")}
                  aria-describedby={errorFor("client-name") ? "client-name-error" : undefined}
                />
                {errorFor("client-name") ? (
                  <FieldError id="client-name-error">{errorFor("client-name")?.message}</FieldError>
                ) : null}
              </Field>
              <Field data-invalid={!!errorFor("client-birth")}>
                <Label id="client-birth-label" required>
                  생년월일
                </Label>
                <DatePicker
                  id="client-birth"
                  labelId="client-birth-label"
                  value={birth}
                  onChange={setBirth}
                  invalid={!!errorFor("client-birth")}
                  describedBy={errorFor("client-birth") ? "client-birth-error" : undefined}
                />
                {errorFor("client-birth") ? (
                  <FieldError id="client-birth-error">{errorFor("client-birth")?.message}</FieldError>
                ) : null}
              </Field>
              <Field data-invalid={!!errorFor("client-district")}>
                <Label htmlFor="client-district" required>
                  거주 지역
                </Label>
                <Select value={district} onValueChange={setDistrict}>
                  <SelectTrigger
                    id="client-district"
                    className="w-full"
                    aria-invalid={!!errorFor("client-district")}
                    aria-describedby={errorFor("client-district") ? "client-district-error" : undefined}
                  >
                    <SelectValue placeholder="지역 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {["제주시 동부", "제주시 서부", "서귀포시 동부", "서귀포시 서부"].map((value) => (
                      <SelectItem key={value} value={value}>
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errorFor("client-district") ? (
                  <FieldError id="client-district-error">{errorFor("client-district")?.message}</FieldError>
                ) : null}
              </Field>
              <Field>
                <Label htmlFor="client-phone">연락처</Label>
                <Input id="client-phone" type="tel" inputMode="tel" placeholder="064-710-0000" aria-describedby="client-phone-hint" />
                <FieldDescription id="client-phone-hint">숫자와 하이픈(-)만 입력합니다.</FieldDescription>
              </Field>
              <Field>
                <Label htmlFor="client-no">관리번호</Label>
                <Input id="client-no" readOnly value="IC-2609129" aria-describedby="client-no-hint" />
                <FieldDescription id="client-no-hint">등록하면 자동으로 부여됩니다(읽기 전용).</FieldDescription>
              </Field>
              <Field data-disabled="true">
                <Label htmlFor="client-agency">담당 기관</Label>
                <Input id="client-agency" disabled value="제주시 통합돌봄지원센터" />
                <FieldDescription>기관 변경은 기준정보 화면에서 합니다(비활성).</FieldDescription>
              </Field>
            </div>
          </section>

          <section className="grid gap-4">
            {sectionTitle("돌봄 필요", "상담 결과에 따라 필요한 서비스를 고릅니다.")}
            <div className="grid grid-cols-2 gap-4 max-[700px]:grid-cols-1">
              <FieldSet data-invalid={!!errorFor("care-level-1")}>
                <FieldLegend>
                  돌봄 필요도 <span className="text-(length:--jeju-text-xs) font-extrabold text-destructive">필수</span>
                </FieldLegend>
                <RadioGroup
                  value={level}
                  onValueChange={setLevel}
                  aria-invalid={!!errorFor("care-level-1")}
                  aria-describedby={errorFor("care-level-1") ? "care-level-error" : undefined}
                >
                  {["낮음", "보통", "높음"].map((value, index) => (
                    <Field key={value} orientation="horizontal">
                      <RadioGroupItem id={"care-level-" + (index + 1)} value={value} />
                      <FieldLabel htmlFor={"care-level-" + (index + 1)} className="font-semibold">
                        {value}
                      </FieldLabel>
                    </Field>
                  ))}
                </RadioGroup>
                {errorFor("care-level-1") ? (
                  <FieldError id="care-level-error">{errorFor("care-level-1")?.message}</FieldError>
                ) : null}
              </FieldSet>
              <FieldSet data-invalid={!!errorFor("need-0")}>
                <FieldLegend>
                  필요한 서비스 <span className="text-(length:--jeju-text-xs) font-extrabold text-destructive">필수</span>
                </FieldLegend>
                <div className="grid gap-2" aria-describedby={errorFor("need-0") ? "need-error" : undefined}>
                  {serviceOptions.map((value, index) => (
                    <Field key={value} orientation="horizontal">
                      <Checkbox
                        id={"need-" + index}
                        checked={needs.includes(value)}
                        aria-invalid={!!errorFor("need-0")}
                        onCheckedChange={(checked) =>
                          setNeeds((current) =>
                            checked === true ? [...current, value] : current.filter((item) => item !== value)
                          )
                        }
                      />
                      <FieldLabel htmlFor={"need-" + index} className="font-semibold">
                        {value}
                      </FieldLabel>
                    </Field>
                  ))}
                </div>
                {errorFor("need-0") ? <FieldError id="need-error">{errorFor("need-0")?.message}</FieldError> : null}
              </FieldSet>
              <div className="flex items-center gap-2.5 self-start">
                <Switch id="urgent" checked={urgent} onCheckedChange={setUrgent} aria-describedby="urgent-state" />
                <Label htmlFor="urgent">긴급 연계 대상</Label>
                <span
                  id="urgent-state"
                  className={urgent ? "text-(length:--jeju-text-xs) font-extrabold text-primary" : "text-(length:--jeju-text-xs) font-extrabold text-muted-foreground"}
                >
                  {urgent ? "켜짐" : "꺼짐"}
                </span>
              </div>
              <Field>
                <Label id="period-label">지원 기간</Label>
                <DateRangePicker
                  labelId="period-label"
                  value={period}
                  onChange={setPeriod}
                  presets={forwardPresets(() => period?.from ?? new Date())}
                />
              </Field>
            </div>
          </section>

          <section className="grid gap-4">
            {sectionTitle("상담 기록", "상담 내용과 증빙 서류를 남깁니다.")}
            <Field>
              <div className="flex items-center gap-1">
                <Label htmlFor="memo">상담 메모</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon-xs" className="size-(--jeju-target-min) rounded-full text-muted-foreground" aria-label="상담 메모 작성 기준 보기">
                      <HelpIcon />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>사실 위주로 쓰고, 주민등록번호 등 불필요한 개인정보는 적지 않습니다.</TooltipContent>
                </Tooltip>
              </div>
              <Textarea id="memo" aria-describedby="memo-hint" />
              <FieldDescription id="memo-hint">500자 이내로 작성합니다.</FieldDescription>
            </Field>
            <Field>
              <Label htmlFor="attachments">증빙 서류</Label>
              <FileUpload
                id="attachments"
                hint="PDF · JPG · 파일당 10MB 이하"
                accept=".pdf,.jpg,.jpeg"
                maxSizeMB={10}
                listLabel="첨부한 파일"
              />
            </Field>
          </section>

          <div className="flex flex-wrap justify-between gap-2 border-t border-(--jeju-hairline) pt-4">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" type="button">
                  작성 취소
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>작성 중인 내용을 버릴까요?</AlertDialogTitle>
                  <AlertDialogDescription>저장하지 않은 입력 내용은 복구할 수 없습니다.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>계속 작성</AlertDialogCancel>
                  <AlertDialogAction variant="destructive" onClick={() => (window.location.hash = "#/work")}>
                    버리고 나가기
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" type="button" onClick={() => toast.info("임시 저장했습니다.")}>
                임시 저장
              </Button>
              <Button type="submit">등록</Button>
            </div>
          </div>
        </form>
      </WorkShell>
      <Toaster />
    </TooltipProvider>
  )
}
