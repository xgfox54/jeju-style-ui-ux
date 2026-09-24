"use client"

import * as React from "react"
import type { DateRange } from "react-day-picker"
import { toast } from "sonner"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChipSet, RemovableChip } from "@/components/ui/chip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { TableCell, TableRow } from "@/components/ui/table"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import {
  DownloadIcon,
  MoreIcon,
  PlusIcon,
  PrintIcon,
  RefreshIcon,
  SearchIcon,
  SettingsIcon,
  WarningIcon,
} from "@/components/ui/jeju-icons"
import { DataTable, type DataTableColumn } from "@/components/jeju-data-table"
import { DateRangePicker, formatDate } from "@/components/jeju-date-picker"
import { DetailList, DetailPanel } from "@/components/jeju-detail-panel"
import { PageHead } from "@/components/jeju-page-head"
import { SearchField } from "@/components/jeju-search"
import { UtilityBar, WorkShell } from "@/components/jeju-shell"
import { Stat, StatGrid } from "@/components/jeju-stat"

// 업무 화면 기준 예제: 통합돌봄 대상자 현황(Tier 1 design/examples/work.html의 React판).
type Status = "연계 중" | "완료" | "검토 필요" | "접수" | "자료 보완"

type Client = {
  id: string
  name: string
  district: string
  service: string
  status: Status
  owner: string
  updated: string
  links: number
}

const statusVariant = {
  "연계 중": "info",
  완료: "success",
  "검토 필요": "warning",
  접수: "neutral",
  "자료 보완": "danger",
} as const

const districts = ["동부", "서부", "남부", "북부"]
const services = ["식사지원·안부확인", "주거지원", "방문건강", "이동지원", "식사지원", "안부확인"]
const statuses: Status[] = ["연계 중", "완료", "검토 필요", "연계 중", "접수", "자료 보완"]
const owners = ["돌봄관리팀", "복지지원팀", "돌봄관리팀", "복지지원팀", "미배정", "돌봄관리팀"]
const surnames = ["김", "이", "박", "최", "정", "강", "조", "윤", "장", "임"]

const clients: Client[] = Array.from({ length: 36 }, (_, index) => {
  const day = 22 - (index % 22)
  return {
    id: "IC-" + String(2609128 - index),
    name: surnames[index % surnames.length] + "○○",
    district: districts[(index * 3 + (index > 3 ? 1 : 0)) % districts.length],
    service: services[index % services.length],
    status: statuses[index % statuses.length],
    owner: owners[index % owners.length],
    updated: "2026-09-" + String(day).padStart(2, "0"),
    links: (index * 7 + 4) % 13 + 1,
  }
})

const baseColumns: DataTableColumn<Client>[] = [
  { key: "id", header: "관리번호", sortable: true },
  { key: "name", header: "대상자" },
  { key: "district", header: "지역", sortable: true },
  { key: "service", header: "주요 서비스" },
  {
    key: "status",
    header: "상태",
    cell: (row) => <Badge variant={statusVariant[row.status]}>{row.status}</Badge>,
  },
  { key: "owner", header: "담당" },
  { key: "updated", header: "최근 처리일", sortable: true },
  { key: "links", header: "연계 건수", sortable: true, num: true },
]

const nav = {
  title: "통합돌봄",
  label: "업무 메뉴",
  items: [
    { label: "대상자 현황", href: "#/work", current: true },
    { label: "서비스 연계", href: "#/work" },
    { label: "제공기관 관리", href: "#/work" },
    { label: "실적·통계", href: "#/work" },
    { label: "대상자 등록", href: "#/form" },
    { label: "기준정보", href: "#/work" },
  ],
}

type Filters = {
  district: string
  status: string
  range?: DateRange
  keyword: string
}

const emptyFilters: Filters = { district: "전체", status: "전체", range: undefined, keyword: "" }

export default function JejuExampleWork() {
  const [draft, setDraft] = React.useState<Filters>(emptyFilters)
  const [applied, setApplied] = React.useState<Filters>(emptyFilters)
  const [detail, setDetail] = React.useState<Client | null>(null)

  // 관리번호를 누르면 목록을 떠나지 않고 상세 보기 사이드 패널을 연다.
  const columns = React.useMemo<DataTableColumn<Client>[]>(
    () =>
      baseColumns.map((column) =>
        column.key === "id"
          ? {
              ...column,
              cell: (row: Client) => (
                <button
                  type="button"
                  aria-label={row.id + " 상세 보기"}
                  onClick={() => setDetail(row)}
                  className="inline-flex min-h-(--jeju-target-min) cursor-pointer items-center border-0 bg-transparent p-0 font-bold text-primary underline underline-offset-2 outline-none hover:text-(--jeju-primary-hover) focus-visible:shadow-(--jeju-focus-ring)"
                >
                  {row.id}
                </button>
              ),
            }
          : column
      ),
    []
  )

  const rows = React.useMemo(
    () =>
      clients.filter((client) => {
        if (applied.district !== "전체" && client.district !== applied.district) return false
        if (applied.status !== "전체" && client.status !== applied.status) return false
        if (applied.keyword && !(client.name + client.id).includes(applied.keyword.trim())) return false
        if (applied.range?.from && client.updated < formatDate(applied.range.from)) return false
        if (applied.range?.to && client.updated > formatDate(applied.range.to)) return false
        return true
      }),
    [applied]
  )

  const removeFilter = (key: keyof Filters) => {
    const next = { ...applied, [key]: emptyFilters[key] }
    setApplied(next)
    setDraft(next)
  }

  const chips: Array<{ key: keyof Filters; text: string; label: string }> = []
  if (applied.district !== "전체")
    chips.push({ key: "district", text: "지역: " + applied.district, label: "지역 " + applied.district + " 조건 제거" })
  if (applied.status !== "전체")
    chips.push({ key: "status", text: "상태: " + applied.status, label: "상태 " + applied.status + " 조건 제거" })
  if (applied.range?.from)
    chips.push({
      key: "range",
      text: "처리일: " + formatDate(applied.range.from) + " ~ " + formatDate(applied.range.to ?? applied.range.from),
      label: "처리일 조건 제거",
    })
  if (applied.keyword)
    chips.push({ key: "keyword", text: "검색어: " + applied.keyword, label: "검색어 " + applied.keyword + " 조건 제거" })

  return (
    <TooltipProvider>
      <WorkShell
        brand={{ name: "통합돌봄 업무관리", href: "#/work" }}
        systemName="제주특별자치도"
        nav={nav}
        wide
        utility={
          <UtilityBar>
            <strong>제주특별자치도 업무 UI 표준 예제</strong>
            <span>Work profile · React registry</span>
          </UtilityBar>
        }
      >
        <PageHead
          title="통합돌봄 대상자 현황"
          description="대상자의 접수·연계·완료 상태를 확인하고 필요한 업무를 처리합니다."
          actions={
            <>
              <Button variant="outline" onClick={() => toast.info("엑셀 파일을 만들고 있습니다.")}>
                <DownloadIcon />
                엑셀 내려받기
              </Button>
              <Button asChild>
                <a href="#/form">
                  <PlusIcon />
                  대상자 등록
                </a>
              </Button>
            </>
          }
        />

        <StatGrid aria-label="업무 현황">
          <Stat label="전체 대상자" value="1,284" meta="기준일 현재" />
          <Stat label="신규 접수" value="42" meta="이번 주" />
          <Stat label="서비스 연계 중" value="317" meta="진행 중" />
          <Stat label="검토 필요" value="9" meta="우선 확인" />
        </StatGrid>

        <section aria-labelledby="search-title" className="mt-7">
          <h2 id="search-title" className="mt-0 mb-3 text-(length:--jeju-h2-size) font-bold text-(--jeju-text-strong)">
            검색·필터
          </h2>
          <form
            className="grid grid-cols-[repeat(4,minmax(0,1fr))_auto] items-end gap-3 rounded-xl border border-border bg-card p-4 max-[1180px]:grid-cols-2 max-[560px]:grid-cols-1"
            onSubmit={(event) => {
              event.preventDefault()
              setApplied(draft)
            }}
            onReset={() => {
              setDraft(emptyFilters)
              setApplied(emptyFilters)
            }}
          >
            <div className="grid gap-1.5">
              <Label htmlFor="district">지역</Label>
              <NativeSelect
                id="district"
                className="w-full"
                value={draft.district}
                onChange={(event) => setDraft({ ...draft, district: event.target.value })}
              >
                {["전체", ...districts].map((value) => (
                  <NativeSelectOption key={value}>{value}</NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="status">진행상태</Label>
              <NativeSelect
                id="status"
                className="w-full"
                value={draft.status}
                onChange={(event) => setDraft({ ...draft, status: event.target.value })}
              >
                {["전체", "접수", "연계 중", "검토 필요", "자료 보완", "완료"].map((value) => (
                  <NativeSelectOption key={value}>{value}</NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
            <div className="grid content-start gap-1.5">
              <Label id="range-label">최근 처리일</Label>
              <DateRangePicker
                labelId="range-label"
                value={draft.range}
                onChange={(range) => setDraft({ ...draft, range })}
                presets={[]}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="keyword">검색어</Label>
              <SearchField
                id="keyword"
                label="검색어"
                placeholder="대상자명 또는 관리번호"
                value={draft.keyword}
                onChange={(event) => setDraft({ ...draft, keyword: event.target.value })}
              />
            </div>
            <div className="flex gap-2 max-[1180px]:col-span-2 max-[1180px]:justify-end max-[560px]:col-span-1">
              <Button variant="outline" type="reset">
                초기화
              </Button>
              <Button type="submit">
                <SearchIcon />
                검색
              </Button>
            </div>
          </form>
          {chips.length > 0 ? (
            <ChipSet className="mt-3" aria-label="적용한 검색 조건">
              {chips.map((chip) => (
                <RemovableChip key={chip.key} removeLabel={chip.label} onRemove={() => removeFilter(chip.key)}>
                  {chip.text}
                </RemovableChip>
              ))}
            </ChipSet>
          ) : null}
        </section>

        <section aria-labelledby="list-title" className="mt-7">
          <PageHead
            level={2}
            title={<span id="list-title">대상자 목록</span>}
            description="열 제목 버튼을 눌러 정렬하고, 행을 선택해 일괄 처리할 수 있습니다."
            actions={
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreIcon />
                    목록 도구
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => toast.success("목록을 새로 불러왔습니다.")}>
                    <RefreshIcon />
                    새로고침
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <SettingsIcon />
                    표시 항목 설정
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => window.print()}>
                    <PrintIcon />
                    목록 인쇄
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            }
          />
          <DataTable
            columns={columns}
            data={rows}
            getRowId={(row) => row.id}
            rowLabel={(row) => row.id}
            caption="통합돌봄 대상자 목록. 관리번호, 대상자, 지역, 주요 서비스, 상태, 담당, 최근 처리일, 연계 건수 열로 구성되어 있습니다."
            selectable
            stickyHeader
            pinFirstColumn
            bulkActions={(ids, clear) => (
              <>
                <Button variant="outline" size="sm" onClick={() => toast.info(ids.length + "건에 담당자를 배정합니다.")}>
                  담당자 배정
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    toast.success(ids.length + "건을 연계 완료로 처리했습니다.")
                    clear()
                  }}
                >
                  연계 완료 처리
                </Button>
              </>
            )}
            footer={(visible) => (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={columns.length} data-label="합계">
                  표시 중인 {visible.length}건 합계
                </TableCell>
                <TableCell num data-label="연계 건수">
                  {visible.reduce((sum, row) => sum + row.links, 0)}
                </TableCell>
              </TableRow>
            )}
          />
        </section>

        <section aria-labelledby="state-title" className="mt-7">
          <h2 id="state-title" className="mt-0 mb-3 text-(length:--jeju-h2-size) font-bold text-(--jeju-text-strong)">
            업무 상태 표현 원칙
          </h2>
          <Alert variant="warning" role="note">
            <WarningIcon />
            <AlertTitle>검토 필요</AlertTitle>
            <AlertDescription>
              색만으로 구분하지 않고 항상 상태 문구를 함께 표시합니다. 정렬 상태도 aria-sort와 아이콘 모양으로 함께 전달합니다.
            </AlertDescription>
          </Alert>
        </section>
      </WorkShell>
      <DetailPanel
        open={detail !== null}
        onOpenChange={(open) => {
          if (!open) setDetail(null)
        }}
        title={detail ? detail.id + " " + detail.name : "대상자 상세"}
        description="목록을 떠나지 않고 대상자 정보를 확인합니다."
        footer={
          <>
            <Button variant="outline" onClick={() => setDetail(null)}>
              닫기
            </Button>
            <Button
              onClick={() => {
                toast.info((detail?.id ?? "") + " 담당자 배정 화면으로 이동합니다.")
                setDetail(null)
              }}
            >
              담당자 배정
            </Button>
          </>
        }
      >
        {detail ? (
          <DetailList
            items={[
              { label: "관리번호", value: detail.id },
              { label: "대상자", value: detail.name },
              { label: "지역", value: detail.district },
              { label: "주요 서비스", value: detail.service },
              { label: "상태", value: <Badge variant={statusVariant[detail.status]}>{detail.status}</Badge> },
              { label: "담당", value: detail.owner },
              { label: "최근 처리일", value: detail.updated },
              { label: "연계 건수", value: detail.links + "건" },
            ]}
          />
        ) : null}
      </DetailPanel>
      <Toaster />
    </TooltipProvider>
  )
}

