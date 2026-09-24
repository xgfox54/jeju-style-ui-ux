"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { CheckIcon, ChevronDownIcon, ChevronUpIcon, SortIcon } from "@/components/ui/jeju-icons"
import { ErrorState } from "@/components/jeju-async-state"

// 행정용 목록 표. Tier 1 work.html의 표 기능을 React로 옮겼다.
// 정렬(aria-sort + 아이콘 모양), 행 선택(전체 선택 indeterminate), 일괄 작업 바, 페이지 크기, 페이지 이동,
// 고정 헤더, 첫 열 고정, 560px 이하 카드형 전환(td의 data-label)을 지원한다. 추가 의존성은 없다.
//
// 서버 조회형(manual): 정렬 · 페이지 · 페이지 크기를 표 안에서 처리하지 않고 onSortChange · onPageChange ·
// onPageSizeChange로 알린다. 호출한 쪽이 서버에서 해당 페이지만 받아 data로 넘기고 전체 건수는 totalCount로 준다.
// loading이면 스켈레톤 행과 aria-busy, error면 표 안에 오류 상태와 다시 시도 버튼을 보여 준다.

type SortDirection = "ascending" | "descending"

type DataTableSort = { key: string; direction: SortDirection }

type DataTableColumn<T> = {
  key: string
  header: string
  cell?: (row: T) => React.ReactNode
  sortValue?: (row: T) => string | number
  sortable?: boolean
  num?: boolean
  className?: string
}

type DataTableProps<T> = {
  columns: DataTableColumn<T>[]
  data: T[]
  getRowId: (row: T) => string
  caption: string
  rowLabel?: (row: T) => string
  selectable?: boolean
  bulkActions?: (selectedIds: string[], clearSelection: () => void) => React.ReactNode
  tools?: React.ReactNode
  description?: React.ReactNode
  pageSizeOptions?: number[]
  initialPageSize?: number
  stickyHeader?: boolean
  pinFirstColumn?: boolean
  stackOnMobile?: boolean
  footer?: (rows: T[]) => React.ReactNode
  emptyTitle?: string
  emptyDescription?: React.ReactNode
  className?: string
  manual?: boolean
  totalCount?: number
  sort?: DataTableSort | null
  onSortChange?: (sort: DataTableSort) => void
  page?: number
  onPageChange?: (page: number) => void
  pageSize?: number
  onPageSizeChange?: (pageSize: number) => void
  loading?: boolean
  error?: React.ReactNode
  onRetry?: () => void
}

function readValue<T>(row: T, column: DataTableColumn<T>): string | number {
  if (column.sortValue) return column.sortValue(row)
  const raw = (row as Record<string, unknown>)[column.key]
  if (typeof raw === "number") return raw
  return raw == null ? "" : String(raw)
}

function pageWindow(current: number, total: number): Array<number | "gap"> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: Array<number | "gap"> = [1]
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  if (start > 2) pages.push("gap")
  for (let page = start; page <= end; page += 1) pages.push(page)
  if (end < total - 1) pages.push("gap")
  pages.push(total)
  return pages
}

const stackClasses =
  "max-[560px]:[&_thead]:sr-only max-[560px]:[&_tbody_tr]:block max-[560px]:[&_tbody_tr]:border-b max-[560px]:[&_tbody_tr]:border-border max-[560px]:[&_tbody_tr]:py-2 max-[560px]:[&_tbody_tr:last-child]:border-b-0 max-[560px]:[&_tbody_td]:flex max-[560px]:[&_tbody_td]:items-center max-[560px]:[&_tbody_td]:justify-between max-[560px]:[&_tbody_td]:gap-4 max-[560px]:[&_tbody_td]:border-0 max-[560px]:[&_tbody_td]:px-3.5 max-[560px]:[&_tbody_td]:py-1.5 max-[560px]:[&_tbody_td]:text-right max-[560px]:[&_tbody_td]:before:shrink-0 max-[560px]:[&_tbody_td]:before:text-left max-[560px]:[&_tbody_td]:before:text-(length:--jeju-text-sm) max-[560px]:[&_tbody_td]:before:font-extrabold max-[560px]:[&_tbody_td]:before:text-muted-foreground max-[560px]:[&_tbody_td]:before:content-[attr(data-label)] max-[560px]:[&_tfoot_tr]:block max-[560px]:[&_tfoot_td]:flex max-[560px]:[&_tfoot_td]:justify-between max-[560px]:[&_tfoot_td]:px-3.5 max-[560px]:[&_tfoot_td]:before:content-[attr(data-label)]"

const stickyCell =
  "sticky bg-card group-hover/row:bg-(--jeju-row-hover) group-data-[state=selected]/row:bg-(--jeju-primary-tint) max-[560px]:static max-[560px]:bg-transparent max-[560px]:shadow-none print:static print:shadow-none"

function DataTable<T>({
  columns,
  data,
  getRowId,
  caption,
  rowLabel,
  selectable = false,
  bulkActions,
  tools,
  description,
  pageSizeOptions = [20, 50, 100],
  initialPageSize,
  stickyHeader = false,
  pinFirstColumn = false,
  stackOnMobile = true,
  footer,
  emptyTitle = "조건에 맞는 자료가 없습니다",
  emptyDescription = "검색 조건을 줄이거나 초기화한 뒤 다시 조회해 주세요.",
  className,
  manual = false,
  totalCount,
  sort: sortProp,
  onSortChange,
  page: pageProp,
  onPageChange,
  pageSize: pageSizeProp,
  onPageSizeChange,
  loading = false,
  error,
  onRetry,
}: DataTableProps<T>) {
  const [localSort, setLocalSort] = React.useState<DataTableSort | null>(null)
  const [selected, setSelected] = React.useState<Set<string>>(() => new Set())
  const [localPageSize, setLocalPageSize] = React.useState(initialPageSize ?? pageSizeOptions[0] ?? 20)
  const [localPage, setLocalPage] = React.useState(1)
  const pageSizeId = React.useId()
  const summaryRef = React.useRef<HTMLParagraphElement>(null)

  const sortControlled = manual || sortProp !== undefined
  const sort = sortControlled ? sortProp ?? null : localSort
  const pageSize = pageSizeProp ?? localPageSize
  const page = pageProp ?? localPage

  const setSort = (next: DataTableSort) => {
    if (!sortControlled) setLocalSort(next)
    onSortChange?.(next)
  }
  const setPage = (next: number) => {
    setLocalPage(next)
    onPageChange?.(next)
  }
  const setPageSize = (next: number) => {
    setLocalPageSize(next)
    onPageSizeChange?.(next)
  }

  const sorted = React.useMemo(() => {
    if (manual || !sort) return data
    const column = columns.find((item) => item.key === sort.key)
    if (!column) return data
    const factor = sort.direction === "descending" ? -1 : 1
    return [...data].sort((a, b) => {
      const left = readValue(a, column)
      const right = readValue(b, column)
      if (typeof left === "number" && typeof right === "number") return (left - right) * factor
      return String(left).localeCompare(String(right), "ko", { numeric: true }) * factor
    })
  }, [columns, data, sort, manual])

  const total = manual ? totalCount ?? data.length : sorted.length
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const currentPage = Math.min(page, pageCount)
  const start = (currentPage - 1) * pageSize
  const rows = manual ? data : sorted.slice(start, start + pageSize)
  const blocked = loading || !!error
  const rowIds = rows.map(getRowId)
  const selectedOnPage = rowIds.filter((id) => selected.has(id)).length
  const headerChecked =
    rows.length > 0 && selectedOnPage === rows.length
      ? true
      : selectedOnPage > 0
        ? "indeterminate"
        : false

  const clearSelection = React.useCallback(() => setSelected(new Set()), [])

  const toggleSort = (key: string) => {
    setSort({
      key,
      direction: sort?.key === key && sort.direction === "ascending" ? "descending" : "ascending",
    })
  }

  const toggleRow = (id: string, checked: boolean) => {
    setSelected((current) => {
      const next = new Set(current)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  const toggleAll = (checked: boolean) => {
    setSelected((current) => {
      const next = new Set(current)
      rowIds.forEach((id) => (checked ? next.add(id) : next.delete(id)))
      return next
    })
  }

  const goTo = (target: number) => (event: React.MouseEvent) => {
    event.preventDefault()
    if (target < 1 || target > pageCount || target === currentPage) return
    setPage(target)
  }

  const firstDataColumn = columns[0]?.key
  const pinData = pinFirstColumn ? (selectable ? "left-12" : "left-0") : ""
  const columnCount = columns.length + (selectable ? 1 : 0)
  const selectedIds = Array.from(selected)
  const shownFrom = total === 0 || rows.length === 0 ? 0 : start + 1
  const shownTo = start + rows.length

  // 다시 시도 버튼은 오류 행과 함께 사라지므로, 먼저 건수 문구로 포커스를 옮겨 키보드 위치를 잃지 않게 한다.
  const retry = onRetry
    ? () => {
        summaryRef.current?.focus({ preventScroll: true })
        onRetry()
      }
    : undefined

  return (
    <div data-slot="data-table" className={cn("grid min-w-0 gap-3", className)}>
      <p className="sr-only" aria-live="polite">
        {selectedIds.length > 0 ? selectedIds.length + "건 선택됨" : ""}
      </p>
      <p className="sr-only" role="status">
        {loading ? "목록을 불러오는 중입니다." : ""}
      </p>

      {selectable && selectedIds.length > 0 ? (
        <div
          data-slot="bulk-bar"
          className="flex flex-wrap items-center gap-3 rounded-lg border border-primary bg-(--jeju-primary-tint) px-3.5 py-2.5 font-bold text-primary print:hidden"
        >
          <CheckIcon />
          <span>
            <span className="tabular-nums">{selectedIds.length}</span>건 선택됨
          </span>
          <span className="ml-auto flex flex-wrap gap-2 max-[560px]:ml-0 max-[560px]:w-full">
            {bulkActions?.(selectedIds, clearSelection)}
            <Button variant="ghost" size="sm" onClick={clearSelection}>
              선택 해제
            </Button>
          </span>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p
          ref={summaryRef}
          tabIndex={-1}
          data-slot="data-table-summary"
          className="m-0 text-(length:--jeju-text-sm) text-muted-foreground"
        >
          {description ??
            (loading
              ? "목록을 불러오는 중입니다."
              : "총 " + total.toLocaleString("ko-KR") + "건 중 " + shownFrom + "–" + shownTo + "건 표시")}
        </p>
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <span className="inline-flex items-center gap-2 text-(length:--jeju-text-sm) text-muted-foreground">
            <label htmlFor={pageSizeId}>페이지당</label>
            <NativeSelect
              id={pageSizeId}
              size="sm"
              value={String(pageSize)}
              onChange={(event) => {
                setPageSize(Number(event.target.value))
                setPage(1)
              }}
            >
              {pageSizeOptions.map((option) => (
                <NativeSelectOption key={option} value={option}>
                  {option}건
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </span>
          {tools}
        </div>
      </div>

      <Table
        aria-busy={loading || undefined}
        containerClassName={cn(
          stickyHeader && "max-h-[420px] overflow-auto max-[560px]:max-h-none print:max-h-none print:overflow-visible"
        )}
        className={cn(stackOnMobile && stackClasses)}
      >
        <TableCaption className="sr-only">{caption}</TableCaption>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {selectable ? (
              <TableHead
                className={cn(
                  "w-12 min-w-12 print:hidden",
                  stickyHeader && "sticky top-0 z-(--jeju-z-sticky)",
                  pinFirstColumn && "sticky left-0 z-3"
                )}
              >
                <Checkbox
                  aria-label="현재 페이지 전체 선택"
                  checked={headerChecked}
                  onCheckedChange={(value) => toggleAll(value === true)}
                  disabled={rows.length === 0 || blocked}
                />
              </TableHead>
            ) : null}
            {columns.map((column) => {
              const direction = sort?.key === column.key ? sort.direction : undefined
              return (
                <TableHead
                  key={column.key}
                  num={column.num}
                  scope="col"
                  aria-sort={column.sortable ? direction ?? "none" : undefined}
                  className={cn(
                    stickyHeader && "sticky top-0 z-(--jeju-z-sticky) shadow-[inset_0_-1px_0_var(--jeju-border)] print:static print:shadow-none",
                    pinFirstColumn && column.key === firstDataColumn && cn("sticky z-3 shadow-[inset_-1px_0_0_var(--jeju-border)] print:static print:shadow-none", pinData),
                    column.className
                  )}
                >
                  {column.sortable ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(column.key)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-(--jeju-radius-xs) border-0 bg-transparent p-0 font-extrabold text-inherit outline-none focus-visible:shadow-(--jeju-focus-ring) [&_svg]:size-3.5 [&_svg]:text-(--jeju-text-faint)",
                        direction && "text-primary [&_svg]:text-primary"
                      )}
                    >
                      {column.header}
                      {direction === "ascending" ? (
                        <ChevronUpIcon />
                      ) : direction === "descending" ? (
                        <ChevronDownIcon />
                      ) : (
                        <SortIcon className="print:hidden" />
                      )}
                    </button>
                  ) : (
                    column.header
                  )}
                </TableHead>
              )
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            Array.from({ length: Math.min(pageSize, 5) }, (_, index) => (
              <TableRow key={"skeleton-" + index} className="hover:bg-transparent" aria-hidden="true">
                {selectable ? (
                  <TableCell className="w-12 min-w-12 print:hidden">
                    <Skeleton className="size-(--jeju-choice-size)" />
                  </TableCell>
                ) : null}
                {columns.map((column) => (
                  <TableCell key={column.key} data-label={column.header}>
                    <Skeleton className={cn("h-4", column.num ? "ml-auto w-10" : "w-3/4 max-w-40")} />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : error ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={columnCount} className="max-[560px]:before:content-none">
                <ErrorState description={error} onRetry={retry} className="py-8" />
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={columnCount} className="max-[560px]:before:content-none">
                <Empty className="py-8">
                  <EmptyHeader>
                    <EmptyTitle>{emptyTitle}</EmptyTitle>
                    <EmptyDescription>{emptyDescription}</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => {
              const id = getRowId(row)
              const isSelected = selected.has(id)
              return (
                <TableRow
                  key={id}
                  className="group/row"
                  data-state={isSelected ? "selected" : undefined}
                >
                  {selectable ? (
                    <TableCell
                      data-label="선택"
                      className={cn(
                        "w-12 min-w-12 max-[560px]:justify-start! max-[560px]:gap-3 print:hidden",
                        pinFirstColumn && cn(stickyCell, "left-0 z-1")
                      )}
                    >
                      <Checkbox
                        aria-label={(rowLabel ? rowLabel(row) : id) + " 선택"}
                        checked={isSelected}
                        onCheckedChange={(value) => toggleRow(id, value === true)}
                      />
                    </TableCell>
                  ) : null}
                  {columns.map((column) => (
                    <TableCell
                      key={column.key}
                      num={column.num}
                      data-label={column.header}
                      className={cn(
                        pinFirstColumn && column.key === firstDataColumn && cn(stickyCell, "z-1 shadow-[inset_-1px_0_0_var(--jeju-border)]", pinData),
                        column.className
                      )}
                    >
                      {column.cell ? column.cell(row) : String(readValue(row, column))}
                    </TableCell>
                  ))}
                </TableRow>
              )
            })
          )}
        </TableBody>
        {footer && rows.length > 0 && !blocked ? <TableFooter>{footer(rows)}</TableFooter> : null}
      </Table>

      {pageCount > 1 ? (
        <Pagination className="justify-start print:hidden">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                aria-disabled={currentPage === 1 || undefined}
                onClick={goTo(currentPage - 1)}
              />
            </PaginationItem>
            {pageWindow(currentPage, pageCount).map((item, index) =>
              item === "gap" ? (
                <PaginationItem key={"gap-" + index}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={item}>
                  <PaginationLink
                    href="#"
                    isActive={item === currentPage}
                    aria-label={item + "페이지"}
                    onClick={goTo(item)}
                  >
                    {item}
                  </PaginationLink>
                </PaginationItem>
              )
            )}
            <PaginationItem>
              <PaginationNext
                href="#"
                aria-disabled={currentPage === pageCount || undefined}
                onClick={goTo(currentPage + 1)}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      ) : null}
    </div>
  )
}

export { DataTable, type DataTableColumn, type DataTableProps, type DataTableSort }
