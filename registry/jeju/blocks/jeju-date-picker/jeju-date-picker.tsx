"use client"

import * as React from "react"
import type { DateRange } from "react-day-picker"
import { ko } from "react-day-picker/locale"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Chip, ChipSet } from "@/components/ui/chip"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "@/components/ui/jeju-icons"

// 달력 선택(Date picker)과 기간 선택. 표시 형식은 YYYY-MM-DD로 통일한다.
// 라벨은 <Label id=...>를 두고 labelId로 연결한다. 버튼 이름은 "라벨 + 선택한 날짜"로 읽힌다.
function formatDate(date?: Date) {
  if (!date) return ""
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return date.getFullYear() + "-" + month + "-" + day
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function sameDay(a?: Date, b?: Date) {
  return !!a && !!b && formatDate(a) === formatDate(b)
}

const triggerClass =
  "h-(--jeju-input-h) w-full justify-between bg-card px-2.75 font-normal text-foreground shadow-none"

function DatePicker({
  id,
  labelId,
  value,
  onChange,
  placeholder = "날짜 선택",
  disabled,
  invalid,
  describedBy,
  className,
}: {
  id?: string
  labelId?: string
  value?: Date
  onChange?: (value: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  invalid?: boolean
  describedBy?: string
  className?: string
}) {
  const generatedId = React.useId()
  const triggerId = id ?? generatedId
  const valueId = triggerId + "-value"
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={triggerId}
          variant="outline"
          disabled={disabled}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          aria-labelledby={labelId ? labelId + " " + valueId : undefined}
          className={cn(triggerClass, className)}
        >
          <span id={valueId} className={cn(!value && "text-muted-foreground")}>
            {value ? formatDate(value) : placeholder}
          </span>
          <CalendarIcon className="text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          locale={ko}
          selected={value}
          defaultMonth={value}
          autoFocus
          onSelect={(next) => {
            onChange?.(next)
            setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}

type RangePreset = {
  label: string
  range: () => DateRange
}

function daysAgo(days: number) {
  const today = startOfDay(new Date())
  return { from: new Date(today.getFullYear(), today.getMonth(), today.getDate() - days), to: today }
}

function monthsAgo(months: number) {
  const today = startOfDay(new Date())
  return { from: new Date(today.getFullYear(), today.getMonth() - months, today.getDate()), to: today }
}

const defaultRangePresets: RangePreset[] = [
  { label: "오늘", range: () => daysAgo(0) },
  { label: "최근 7일", range: () => daysAgo(6) },
  { label: "최근 1개월", range: () => monthsAgo(1) },
  { label: "최근 3개월", range: () => monthsAgo(3) },
]

function useWideCalendar() {
  const [wide, setWide] = React.useState(false)
  React.useEffect(() => {
    const media = window.matchMedia("(min-width: 701px)")
    const update = () => setWide(media.matches)
    update()
    media.addEventListener("change", update)
    return () => media.removeEventListener("change", update)
  }, [])
  return wide
}

function DateRangePicker({
  id,
  labelId,
  value,
  onChange,
  presets = defaultRangePresets,
  placeholder = "기간 선택",
  disabled,
  className,
}: {
  id?: string
  labelId?: string
  value?: DateRange
  onChange?: (value: DateRange | undefined) => void
  presets?: RangePreset[]
  placeholder?: string
  disabled?: boolean
  className?: string
}) {
  const generatedId = React.useId()
  const triggerId = id ?? generatedId
  const valueId = triggerId + "-value"
  const [open, setOpen] = React.useState(false)
  const wide = useWideCalendar()
  const text = value?.from
    ? formatDate(value.from) + " ~ " + (value.to ? formatDate(value.to) : "종료일 선택")
    : placeholder

  return (
    <div data-slot="date-range-picker" className={cn("grid min-w-0 gap-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={triggerId}
            variant="outline"
            disabled={disabled}
            aria-labelledby={labelId ? labelId + " " + valueId : undefined}
            className={triggerClass}
          >
            <span id={valueId} className={cn("truncate", !value?.from && "text-muted-foreground")}>
              {text}
            </span>
            <CalendarIcon className="text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            locale={ko}
            numberOfMonths={wide ? 2 : 1}
            selected={value}
            defaultMonth={value?.from}
            autoFocus
            onSelect={(next) => {
              onChange?.(next)
              if (next?.from && next?.to && !sameDay(next.from, next.to)) setOpen(false)
            }}
          />
        </PopoverContent>
      </Popover>
      {presets.length > 0 ? (
        <ChipSet role="group" aria-label="기간 빠르게 선택">
          {presets.map((preset) => {
            const range = preset.range()
            const active = sameDay(range.from, value?.from) && sameDay(range.to, value?.to)
            return (
              <Chip
                key={preset.label}
                pressed={active}
                disabled={disabled}
                onPressedChange={() => onChange?.(preset.range())}
              >
                {preset.label}
              </Chip>
            )
          })}
        </ChipSet>
      ) : null}
    </div>
  )
}

export { DatePicker, DateRangePicker, defaultRangePresets, formatDate, type RangePreset }
