"use client"

import * as React from "react"
import { toast } from "sonner"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Toggle } from "@/components/ui/toggle"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { CheckIcon, DownloadIcon, InfoIcon, PlusIcon, PrintIcon, RefreshIcon, WarningIcon } from "@/components/ui/jeju-icons"
import { AsyncState, ErrorState, LoadingState, type AsyncStatus } from "@/components/jeju-async-state"
import { DataTable, type DataTableColumn, type DataTableSort } from "@/components/jeju-data-table"
import { PageHead } from "@/components/jeju-page-head"
import { WorkShell } from "@/components/jeju-shell"

// 컴포넌트 갤러리(Tier 1 design/examples/index.html의 React판). 브랜드 색과 기본 컴포넌트 상태를 한 화면에서 확인한다.
const nav = {
  title: "디자인 시스템",
  label: "예제 메뉴",
  items: [
    { label: "컴포넌트 갤러리", href: "#/gallery", current: true },
    { label: "업무 목록 예제", href: "#/work" },
    { label: "업무 폼 예제", href: "#/form" },
    { label: "대민 예제", href: "#/public" },
  ],
}

const swatches = [
  { name: "Jeju Blue", token: "--jeju-blue", role: "Primary · 링크 · 선택" },
  { name: "Jeju Green", token: "--jeju-green", role: "Secondary · 완료(장식·짙은 글자)" },
  { name: "Jeju Orange", token: "--jeju-orange", role: "Accent · 주의(장식·짙은 글자)" },
  { name: "Green strong", token: "--jeju-green-dark", role: "흰 글자용 역할색" },
  { name: "Orange strong", token: "--jeju-orange-dark", role: "흰 글자용 역할색" },
]

// 서버 조회형 표 데모용 가짜 API. 실제 서비스에서는 fetch("/api/clients?sort=...&page=...")로 바꾼다.
type Row = { id: string; name: string; team: string; count: number }
const allRows: Row[] = Array.from({ length: 57 }, (_, index) => ({
  id: "SR-" + String(26001 + index),
  name: ["식사 지원", "안부 확인", "병원 동행", "주거 개선", "가사 지원"][index % 5],
  team: ["돌봄관리팀", "복지지원팀", "건강관리팀"][index % 3],
  count: (index * 17) % 41 + 1,
}))

function fakeFetch(query: { sort: DataTableSort | null; page: number; pageSize: number; fail: boolean }) {
  return new Promise<{ rows: Row[]; total: number }>((resolve, reject) => {
    window.setTimeout(() => {
      if (query.fail) return reject(new Error("서버가 응답하지 않습니다."))
      const sorted = [...allRows]
      if (query.sort) {
        const { key, direction } = query.sort
        const factor = direction === "descending" ? -1 : 1
        sorted.sort((a, b) => {
          const left = a[key as keyof Row]
          const right = b[key as keyof Row]
          return (typeof left === "number" && typeof right === "number" ? left - right : String(left).localeCompare(String(right), "ko")) * factor
        })
      }
      const start = (query.page - 1) * query.pageSize
      resolve({ rows: sorted.slice(start, start + query.pageSize), total: sorted.length })
    }, 500)
  })
}

const serverColumns: DataTableColumn<Row>[] = [
  { key: "id", header: "요청번호", sortable: true },
  { key: "name", header: "서비스", sortable: true },
  { key: "team", header: "담당" },
  { key: "count", header: "처리 건수", sortable: true, num: true },
]

function ServerTableDemo() {
  const [sort, setSort] = React.useState<DataTableSort | null>(null)
  const [page, setPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(10)
  const [failNext, setFailNext] = React.useState(false)
  const [attempt, setAttempt] = React.useState(0)
  const [state, setState] = React.useState<{ rows: Row[]; total: number; loading: boolean; error: string | null }>({
    rows: [],
    total: 0,
    loading: true,
    error: null,
  })

  React.useEffect(() => {
    let alive = true
    setState((current) => ({ ...current, loading: true, error: null }))
    fakeFetch({ sort, page, pageSize, fail: failNext })
      .then((result) => alive && setState({ ...result, loading: false, error: null }))
      .catch(() => alive && setState((current) => ({ ...current, loading: false, error: "요청 목록을 불러오지 못했습니다. 잠시 뒤 다시 시도해 주세요." })))
    return () => {
      alive = false
    }
  }, [sort, page, pageSize, failNext, attempt])

  return (
    <div className="grid gap-3">
      <div className="flex items-center gap-2.5">
        <Switch id="fail-next" checked={failNext} onCheckedChange={setFailNext} aria-describedby="fail-next-state" />
        <Label htmlFor="fail-next">다음 조회를 실패로 흉내</Label>
        <span id="fail-next-state" className="text-(length:--jeju-text-xs) font-extrabold text-muted-foreground">
          {failNext ? "켜짐" : "꺼짐"}
        </span>
      </div>
      <DataTable
        manual
        columns={serverColumns}
        data={state.rows}
        totalCount={state.total}
        getRowId={(row) => row.id}
        caption="서버에서 한 페이지씩 받아 오는 요청 목록"
        sort={sort}
        onSortChange={(next) => {
          setSort(next)
          setPage(1)
        }}
        page={page}
        onPageChange={setPage}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
        pageSizeOptions={[10, 20, 50]}
        loading={state.loading}
        error={state.error}
        onRetry={() => {
          setFailNext(false)
          setAttempt((value) => value + 1)
        }}
      />
    </div>
  )
}

function AsyncDemo() {
  const [status, setStatus] = React.useState<AsyncStatus>("ready")
  const load = () => {
    setStatus("loading")
    window.setTimeout(() => setStatus("ready"), 900)
  }
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap gap-2" role="group" aria-label="예시 상태 바꾸기">
        <Button variant="outline" size="sm" onClick={load}>
          <RefreshIcon />
          다시 불러오기
        </Button>
        <Button variant="outline" size="sm" onClick={() => setStatus("error")}>
          오류 상태
        </Button>
        <Button variant="outline" size="sm" onClick={() => setStatus("empty")}>
          결과 없음
        </Button>
      </div>
      <Card>
        <CardContent>
          <AsyncState
            status={status}
            loading={<LoadingState title="처리 현황을 불러오는 중입니다." lines={3} />}
            error={
              <ErrorState
                title="처리 현황을 불러오지 못했습니다"
                description="잠시 뒤 다시 시도해 주세요. 문제가 계속되면 정보화 담당 부서에 문의해 주세요."
                onRetry={load}
              />
            }
            empty={
              <Empty>
                <EmptyHeader>
                  <EmptyTitle>조건에 맞는 처리 현황이 없습니다</EmptyTitle>
                  <EmptyDescription>기간을 넓히거나 검색 조건을 초기화해 보세요.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            }
          >
            <Table>
              <TableCaption className="sr-only">이번 주 처리 현황</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>업무</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead num>건수</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>신규 접수</TableCell>
                  <TableCell><Badge variant="neutral">접수</Badge></TableCell>
                  <TableCell num>42</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>서비스 연계</TableCell>
                  <TableCell><Badge variant="info">연계 중</Badge></TableCell>
                  <TableCell num>317</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </AsyncState>
        </CardContent>
      </Card>
    </div>
  )
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="mt-8 grid gap-3">
      <h2 id={id} className="m-0 text-(length:--jeju-h2-size) font-bold text-(--jeju-text-strong)">
        {title}
      </h2>
      {children}
    </section>
  )
}

export default function JejuExampleGallery() {
  const [notify, setNotify] = React.useState(true)
  const [loading, setLoading] = React.useState(false)

  return (
    <TooltipProvider>
      <WorkShell brand={{ name: "Jeju Style UI·UX", href: "#/gallery" }} systemName="React registry v0.6.0" nav={nav}>
        <PageHead
          title="컴포넌트 갤러리"
          description="제주 토큰으로 연결된 React 컴포넌트의 기본 상태를 확인합니다. 업무 프로필(36px) 기준입니다."
        />

        <Section id="brand-title" title="브랜드 색">
          <ul className="m-0 grid list-none grid-cols-5 gap-3 p-0 max-[1024px]:grid-cols-3 max-[560px]:grid-cols-1">
            {swatches.map((swatch) => (
              <li key={swatch.token} className="overflow-hidden rounded-xl border border-border bg-card">
                <div className="h-16" style={{ background: "var(" + swatch.token + ")" }} aria-hidden="true" />
                <div className="grid gap-0.5 p-3">
                  <strong className="text-(--jeju-text-strong)">{swatch.name}</strong>
                  <code className="text-(length:--jeju-text-xs) text-muted-foreground">{swatch.token}</code>
                  <span className="text-(length:--jeju-text-xs) text-(--jeju-text-subtle)">{swatch.role}</span>
                </div>
              </li>
            ))}
          </ul>
        </Section>

        <Section id="button-title" title="버튼">
          <div className="flex flex-wrap items-center gap-2">
            <Button>
              <PlusIcon />
              기본(Primary)
            </Button>
            <Button variant="secondary">
              <CheckIcon />
              완료 처리
            </Button>
            <Button variant="accent">주의 처리</Button>
            <Button variant="outline">
              <DownloadIcon />
              내려받기
            </Button>
            <Button variant="ghost">
              <PrintIcon />
              인쇄
            </Button>
            <Button variant="destructive">삭제</Button>
            <Button variant="link">링크형</Button>
            <Button disabled>비활성</Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm">작게</Button>
            <Button>기본</Button>
            <Button size="lg">크게</Button>
            <Button size="icon" variant="outline" aria-label="추가">
              <PlusIcon />
            </Button>
            <Toggle variant="outline" aria-label="굵게 보기" defaultPressed>
              필터 고정
            </Toggle>
          </div>
        </Section>

        <Section id="badge-title" title="상태 배지">
          <div className="flex flex-wrap gap-2">
            <Badge variant="info">연계 중</Badge>
            <Badge variant="success">완료</Badge>
            <Badge variant="warning">검토 필요</Badge>
            <Badge variant="danger">자료 보완</Badge>
            <Badge variant="neutral">접수</Badge>
            <Badge>신규</Badge>
          </div>
        </Section>

        <Section id="alert-title" title="알림">
          <div className="grid grid-cols-2 gap-3 max-[700px]:grid-cols-1">
            <Alert variant="info" role="note">
              <InfoIcon />
              <AlertTitle>안내</AlertTitle>
              <AlertDescription>처리 기준이 2026년 10월 1일부터 바뀝니다.</AlertDescription>
            </Alert>
            <Alert variant="success" role="note">
              <CheckIcon />
              <AlertTitle>완료</AlertTitle>
              <AlertDescription>12건을 연계 완료로 처리했습니다.</AlertDescription>
            </Alert>
            <Alert variant="warning" role="note">
              <WarningIcon />
              <AlertTitle>검토 필요</AlertTitle>
              <AlertDescription>담당자가 배정되지 않은 대상자가 3건 있습니다.</AlertDescription>
            </Alert>
            <Alert variant="danger" role="note">
              <WarningIcon />
              <AlertTitle>오류</AlertTitle>
              <AlertDescription>파일 형식이 맞지 않습니다. PDF 또는 JPG로 다시 올려 주세요.</AlertDescription>
            </Alert>
          </div>
        </Section>

        <Section id="tabs-title" title="탭 · 카드">
          <Tabs defaultValue="summary">
            <TabsList>
              <TabsTrigger value="summary">요약</TabsTrigger>
              <TabsTrigger value="history">처리 이력</TabsTrigger>
              <TabsTrigger value="files">첨부 서류</TabsTrigger>
            </TabsList>
            <TabsContent value="summary">
              <Card>
                <CardHeader>
                  <CardTitle>IC-2609128 김○○</CardTitle>
                  <CardDescription>동부 · 식사지원·안부확인</CardDescription>
                  <CardAction>
                    <Badge variant="info">연계 중</Badge>
                  </CardAction>
                </CardHeader>
                <CardContent>
                  <p className="m-0">최근 처리일 2026-09-22 · 연계 4건. 다음 방문은 2026-09-29로 예정되어 있습니다.</p>
                </CardContent>
                <CardFooter className="justify-end">
                  <Button variant="outline" size="sm">
                    상세 보기
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            <TabsContent value="history">
              <Card>
                <CardContent className="grid gap-2">
                  <p className="m-0">2026-09-22 식사지원 연계(돌봄관리팀)</p>
                  <Separator />
                  <p className="m-0">2026-09-15 안부확인 방문(복지지원팀)</p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="files">
              <Card>
                <CardContent className="grid gap-2" aria-busy="true">
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-5 w-1/2" />
                  <span className="inline-flex items-center gap-2 text-muted-foreground">
                    <Spinner /> 첨부 서류를 불러오는 중입니다.
                  </span>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </Section>

        <Section id="state-title" title="진행률 · 스위치 · 모달">
          <div className="grid grid-cols-3 items-start gap-4 max-[900px]:grid-cols-1">
            <div className="grid gap-2">
              <div className="flex justify-between text-(length:--jeju-text-sm) text-muted-foreground">
                <span>이번 달 처리율</span>
                <strong className="text-(--jeju-text-strong)">72%</strong>
              </div>
              <Progress value={72} aria-label="이번 달 처리율" />
              <Progress value={100} variant="success" aria-label="서류 확인율" />
              <Progress value={35} variant="warning" aria-label="기한 임박 비율" />
            </div>
            <div className="flex items-center gap-2.5">
              <Switch id="notify" checked={notify} onCheckedChange={setNotify} aria-describedby="notify-state" />
              <Label htmlFor="notify">처리 결과 알림</Label>
              <span id="notify-state" className="text-(length:--jeju-text-xs) font-extrabold text-muted-foreground">
                {notify ? "켜짐" : "꺼짐"}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">담당자 배정</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>담당자 배정</DialogTitle>
                    <DialogDescription>선택한 대상자 3건을 배정할 팀을 고릅니다.</DialogDescription>
                  </DialogHeader>
                  <p className="m-0">배정 후에는 담당 팀에 알림이 전송됩니다.</p>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">취소</Button>
                    </DialogClose>
                    <DialogClose asChild>
                      <Button onClick={() => toast.success("3건을 돌봄관리팀에 배정했습니다.")}>배정</Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Button
                variant="ghost"
                disabled={loading}
                onClick={() => {
                  setLoading(true)
                  window.setTimeout(() => setLoading(false), 1200)
                }}
              >
                {loading ? <Spinner label="저장 중" className="text-primary" /> : null}
                {loading ? "저장 중" : "저장 흉내"}
              </Button>
            </div>
          </div>
        </Section>
        <Section id="async-title" title="로딩·오류 상태">
          <AsyncDemo />
        </Section>

        <Section id="server-title" title="서버 조회형 표">
          <p className="m-0 text-muted-foreground">정렬 · 페이지 · 페이지 크기를 바꾸면 서버에서 해당 페이지만 다시 받아 옵니다(0.5초 지연 흉내).</p>
          <ServerTableDemo />
        </Section>
      </WorkShell>
      <Toaster />
    </TooltipProvider>
  )
}
