# React · shadcn 레지스트리 (Tier 2)

제주 디자인 시스템은 두 가지 방식으로 서비스에 붙는다.

| | Tier 1 — CSS 클래스 | Tier 2 — React 레지스트리 |
|---|---|---|
| 대상 | JSP · Jinja2 · FastAPI 템플릿 · 정적 HTML | React · Next.js · Vite + Tailwind CSS v4 |
| 설치 | `design/*.css`, `jeju-behaviors.js`를 복사해 링크 | `npx shadcn add @jeju/...`로 컴포넌트 소스를 프로젝트에 복사 |
| 동작 | `data-jeju-*` 훅 + 의존성 없는 JS | Radix 프리미티브(`radix-ui`) |
| 값의 원천 | `design/jeju-tokens.css` | 같은 파일의 사본(`styles/jeju-tokens.css`) |

두 방식 모두 값은 `design/jeju-tokens.css` 하나에서 온다. Tier 2의 shadcn 변수(`--primary`, `--border` 등)는 전부 `var(--jeju-*)`로 연결되어 있고, 컨트롤 높이·글자 크기도 프로필 토큰을 따른다. 그래서 `<html data-jeju-profile="public">` 한 줄로 React 화면도 대민 치수(48px 컨트롤, 17px 본문)로 바뀐다.

레지스트리는 npm 패키지가 아니라 `public/r/*.json` 정적 파일이다. 내부 정적 서버로 서빙할 수 있어 망분리 환경에서도 쓸 수 있다.

## 1. 레지스트리 주소 등록

전제: React 19(18도 대부분 동작하지만 `ref`를 넘기는 곳은 19 기준), Tailwind CSS v4, shadcn CLI 4.x.

프로젝트에 `components.json`이 없으면 먼저 만든다.

```bash
# 새 프로젝트
npx shadcn@latest init -t vite -b radix -p nova -n my-app --no-monorepo -y   # Next.js는 -t next
# 기존 프로젝트
npx shadcn@latest init -b radix -p nova -y
```

`components.json`에 `@jeju` 레지스트리를 넣는다. 이름은 반드시 `@jeju`여야 한다(항목끼리 `@jeju/...`로 서로를 참조한다).

```jsonc
{
  "registries": {
    // 내부망: 이 저장소 루트에서 정적 서버를 띄운다 (예: python -m http.server 8765)
    "@jeju": "http://<내부호스트>:8765/public/r/{name}.json"
  }
}
```

shadcn CLI는 `file://`나 로컬 경로 형태의 레지스트리 주소를 지원하지 않으므로 HTTP로 서빙한다.

## 2. 한 번에 설치

```bash
npx shadcn add @jeju/jeju-style -o
```

`-o`(덮어쓰기)는 새 프로젝트에서도 필요하다. `shadcn init`이 기본 `button.tsx`를 먼저 만들어 두기 때문에, 없으면 덮어쓸지 묻고 설치가 멈춘다.

들어오는 것:

- `styles/jeju-tokens.css` — 정본 토큰 사본
- 전역 CSS의 `:root`에 shadcn 변수 → `var(--jeju-*)` 연결, 본문 글꼴·크기·색
- `components/ui/` — 제주 아이콘(`jeju-icons`)과 P0 컴포넌트 33종: button · badge · card · input · label · textarea · native-select · select · checkbox · radio-group · switch · chip · toggle · dialog · alert-dialog · sheet · tabs · alert · breadcrumb · pagination · table · skeleton · spinner · accordion · dropdown-menu · tooltip · popover · separator · progress · sonner · field · empty

필요할 때 추가하는 것:

| 항목 | 내용 |
|---|---|
| `@jeju/calendar` | 달력(react-day-picker) |
| `@jeju/jeju-shell` | 업무 셸: GNB + LNB + 본문, 900px 이하 드로어 |
| `@jeju/jeju-page-head` | 페이지 제목(h1) · 설명 · 주요 액션 |
| `@jeju/jeju-stat` | KPI 묶음 |
| `@jeju/jeju-data-table` | 행정용 표: 정렬 · 행 선택 · 일괄 작업 · 페이지 크기 · 페이지 이동 · 고정 헤더 · 첫 열 고정 · 모바일 카드형 · 서버 조회형(`manual`) · 로딩·오류 상태 |
| `@jeju/jeju-async-state` | 로딩·오류 상태: `LoadingState` · `ErrorState` · `AsyncState` |
| `@jeju/jeju-detail-panel` | 상세 보기 사이드 패널: `DetailPanel` · `DetailList` |
| `@jeju/jeju-fonts` | 글꼴 선언 `public/fonts/jeju-fonts.css`(글꼴 파일은 승인 뒤 같은 폴더에 둔다) |
| `@jeju/jeju-date-picker` | 날짜 선택, 기간 선택 + 프리셋 |
| `@jeju/jeju-search` | 돋보기 검색 입력 |
| `@jeju/jeju-file-upload` | 끌어다 놓기 · 파일 목록 · 개별 삭제 · 용량 제한 |
| `@jeju/jeju-error-summary` | 제출 실패 시 오류 요약 → 해당 입력으로 이동 |
| `@jeju/jeju-steps` · `@jeju/jeju-wizard` | 단계 표시 · 신청 마법사 |
| `@jeju/jeju-public-shell` | 대민 셸: masthead · 헤더(모바일 메뉴) · 본문 · 히어로 · 카드 · 기관 식별 · 푸터 |
| `@jeju/jeju-service-search` | 대민 서비스 검색: 검색어 · 분류 칩 · 결과 수 · 결과 없음 |
| `@jeju/jeju-eligibility-check` | 신청 자격 자가 확인: 예/아니요 질문 → 결과 안내 |
| `@jeju/jeju-doc-list` | 서식 내려받기 |
| `@jeju/jeju-contact` | 문의·방문 안내(전화 · 운영 시간 · 주소 · 지도 링크) |
| `@jeju/jeju-related-links` | 함께 찾는 서비스 |
| `@jeju/jeju-common` | 브랜드 마크 자리표시자 · 본문 바로가기 링크 |

기준 화면 예제(Tier 1 예제의 React판)도 설치할 수 있다: `@jeju/jeju-example-work` · `@jeju/jeju-example-form` · `@jeju/jeju-example-public` · `@jeju/jeju-example-gallery`.

이미 설치한 컴포넌트를 새 버전으로 바꿀 때는 `-o`(덮어쓰기)를 붙인다.

## 3. 손으로 하는 세 가지

CLI가 하지 못하는 일이다. 빠뜨리면 검사기(S6·S7)가 알려 준다.

**① 전역 CSS에서 토큰 파일을 불러온다.** Vite는 `src/index.css`, Next.js는 `app/globals.css`다. `layer(base)`로 불러와야 컴포넌트의 Tailwind 유틸리티가 토큰 파일의 전역 규칙보다 우선한다.

```css
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";
@import "../styles/jeju-tokens.css" layer(base);
```

**② 프리셋이 만든 다크 모드 흔적을 지운다.** `.dark { ... }` 블록과 `@fontsource-variable/geist` import를 지운다. Vite 템플릿이면 `src/components/theme-provider.tsx`와 `main.tsx`의 `ThemeProvider`도 지운다(d 키로 다크 모드가 켜진다). 다크 모드는 계약 범위 밖이다. `@custom-variant dark` 한 줄은 테마를 다시 적용할 때 CLI가 되살리지만 다크 팔레트가 없으면 아무 효과가 없다.

**③ 글꼴은 자체 호스팅한다.** 외부 CDN을 링크하지 않는다. `npx shadcn add @jeju/jeju-fonts`로 `public/fonts/jeju-fonts.css`를 받고, 승인된 `PretendardGOVVariable.woff2`를 같은 폴더에 둔 뒤 `index.html`(Next.js는 `app/layout.tsx`)에서 `<link rel="stylesheet" href="/fonts/jeju-fonts.css">`로 불러온다. 토큰의 글꼴 체인이 그대로 이어받는다. 파일이 없으면 Noto Sans KR → 맑은 고딕 순으로 대체되고 gate가 S8 WARN을 낸다. 반입 절차는 저장소의 `design/fonts/README.md`에 있다.

## 4. 대민 화면

```html
<html lang="ko" data-jeju-profile="public">
```

업무 화면은 속성을 붙이지 않는다. 한 앱 안에서 업무와 대민을 섞지 않는다.

## 5. 쓰는 법 — shadcn 기본과 다른 점

API와 조립법은 shadcn 문서와 같다. 다른 것은 다음뿐이다.

| 컴포넌트 | 제주 규칙 |
|---|---|
| Button | `variant` 이름을 Tier 1과 맞췄다. `default`(Blue) · `secondary`(Green strong) · `accent`(Orange strong) · `outline` · `ghost` · `destructive` · `link`. 높이는 `--jeju-control-h*` 토큰 |
| Badge | 상태 변형 `info` · `success` · `warning` · `danger` · `neutral`. 항상 문구와 함께 쓴다 |
| Alert | `info` · `success` · `warning` · `danger`. 정적인 안내문에는 `role="note"`를 넘긴다 |
| Label | `required`를 주면 "필수" 문구가 붙는다 |
| Table | `TableHead`·`TableCell`의 `num`으로 숫자 열 오른쪽 정렬. 헤더 상단 2px Primary |
| Tabs | 기본이 밑줄형(`line`)이다. 상자형은 `variant="default"` |
| Checkbox | `checked="indeterminate"`로 부분 선택 표시 |
| Switch | 옆에 "켜짐/꺼짐" 상태 문구를 함께 둔다 |
| Chip | 제주 고유. `Chip`(필터, aria-pressed) · `RemovableChip`(조건 제거, `removeLabel` 필수) |
| 누를 수 있는 영역 | 작은 버튼 · 칩 · 경로 링크 · 가로 배치 선택 라벨이 `--jeju-control-h-sm` · `--jeju-chip-h` · `--jeju-target-min`을 따른다. 대민에서 44px |
| 아이콘 | `lucide-react` 대신 `@/components/ui/jeju-icons`(`SearchIcon`, `JejuIcon name="search"` 등). `design/jeju-icons.svg`에서 생성되며 크기는 `--jeju-icon` 토큰 |
| Toaster | 3개 상한 · 5초 · 반전 표면. 중요한 결과는 화면에도 남긴다 |

Tailwind 유틸에서 토큰을 직접 쓸 때는 `h-(--jeju-control-h)`, `text-(length:--jeju-text-sm)`, `bg-(--jeju-success-tint)`처럼 쓴다. `bg-[#0173bc]` 같은 색 리터럴과 `bg-blue-500` 같은 기본 팔레트는 쓰지 않는다.

### 서버 조회형 표

목록을 서버에서 한 페이지씩 받아 올 때는 `manual`을 켠다. 표는 받은 `data`를 그대로 한 페이지로 보여 주고 정렬 · 자르기를 하지 않는다. 대신 정렬 · 페이지 · 페이지 크기 변경을 콜백으로 알린다.

```tsx
const [sort, setSort] = React.useState<DataTableSort | null>(null)
const [page, setPage] = React.useState(1)
const [pageSize, setPageSize] = React.useState(20)
const { rows, total, isLoading, isError, reload } = useRequestList({ sort, page, pageSize }) // 서비스의 조회 훅

<DataTable
  manual
  columns={columns}
  data={rows}
  totalCount={total}
  getRowId={(row) => row.id}
  caption="요청 목록"
  sort={sort}
  onSortChange={(next) => {
    setSort(next)
    setPage(1)
  }}
  page={page}
  onPageChange={setPage}
  pageSize={pageSize}
  onPageSizeChange={setPageSize}
  loading={isLoading}
  error={isError ? "요청 목록을 불러오지 못했습니다. 잠시 뒤 다시 시도해 주세요." : null}
  onRetry={reload}
/>
```

- 정렬을 바꾸면 호출한 쪽이 1페이지로 돌린다. 페이지 크기를 바꾸면 표가 `onPageChange(1)`을 함께 보낸다.
- 불러오는 동안에는 이전 `total`을 유지한다. 페이지 링크 수가 흔들리지 않고 포커스도 유지된다.
- `loading`이면 스켈레톤 행 · `aria-busy` · "목록을 불러오는 중입니다." 알림이, `error`면 표 안 오류 상태와 다시 시도 버튼이 나온다.

### 로딩·오류 상태와 상세 패널

```tsx
<AsyncState
  status={status} // "loading" | "error" | "empty" | "ready"
  error={<ErrorState title="처리 현황을 불러오지 못했습니다" onRetry={reload} />}
  empty={<Empty>…</Empty>}
>
  <Table>…</Table>
</AsyncState>

// 표의 관리번호 셀: aria-label은 보이는 글자로 시작한다(WCAG 2.5.3)
<button type="button" aria-label={row.id + " 상세 보기"} onClick={() => setDetail(row)}>{row.id}</button>

<DetailPanel
  open={detail !== null}
  onOpenChange={(open) => !open && setDetail(null)}
  title={detail ? detail.id + " " + detail.name : "대상자 상세"}
  footer={<Button variant="outline" onClick={() => setDetail(null)}>닫기</Button>}
>
  {detail ? <DetailList items={[{ label: "지역", value: detail.district }]} /> : null}
</DetailPanel>
```

`DetailPanel`은 전용 Trigger 없이 상태로 열어도 닫힐 때 연 버튼으로 포커스를 돌려준다. 표 안 여는 버튼의 전체 스타일은 `jeju-example-work`에 있다(누르는 영역 `min-h-(--jeju-target-min)`).

### 인쇄

- 셸 · 데이터 표 · 표 컨테이너 · 토스트에 `print:` 유틸리티가 들어 있다. 인쇄하면 머리 · 메뉴 · 선택 열 · 일괄 작업 · 페이지 크기 · 페이지 이동이 빠지고, 표는 가로 스크롤과 고정 헤더를 풀어 끝까지 나온다.
- `@jeju/jeju-theme`이 전역 CSS에 `@media print`를 넣는다. 오른쪽 상세 패널(`DetailPanel`)이 열려 있으면 패널 내용만 인쇄하고, 배경을 흰색으로 두고, 포커스 표시를 지운다. 이미 설치한 프로젝트는 `npx shadcn add @jeju/jeju-theme -o`로 다시 받는다.
- 인쇄 버튼은 `window.print()`를 부른다(`jeju-example-work`의 "목록 인쇄"). 인쇄에만 보일 기관 · 조건 · 출력 일시는 `hidden print:block`, 화면에만 둘 요소는 `print:hidden`으로 표시한다.

## 6. 검사

```bash
python <이 저장소>/design/check_design.py --gate <React 프로젝트 루트>
```

| 규칙 | 확인 내용 |
|---|---|
| S1 | 소스(tsx 포함)에 정본에 없는 색 리터럴이 없는가 |
| S2 | 외부 CDN CSS·스크립트가 없는가 |
| S6 | `styles/jeju-tokens.css`가 정본과 같은가(LF 기준) |
| S7 | 전역 CSS가 토큰을 불러오고 `--primary`가 `var(--jeju-*)`인가. `.dark` 팔레트·Geist 잔재는 WARN |
| S8 | `public/fonts/jeju-fonts.css`가 참조하는 글꼴 파일이 있는가. 없으면 WARN(대체 글꼴로 표시), 외부 주소면 FAIL |

## 7. 레지스트리를 고칠 때

```text
registry/jeju/ui/*.tsx              → registry:ui     (shadcn 공식 소스 + 제주 토큰)
registry/jeju/blocks/<이름>/*.tsx    → registry:block  (제주 블록)
registry/jeju/examples/*.tsx        → registry:block  (기준 화면 예제)
design/jeju-icons.svg               → registry/jeju/ui/jeju-icons.tsx (생성, 직접 고치지 않음)
design/jeju-tokens.css              → @jeju/jeju-tokens (정본을 그대로 싣는다)
tools/build_registry.py             → registry.json, public/r/*.json (생성, 커밋한다)
```

```bash
python tools/build_registry.py          # 생성
python tools/build_registry.py --check  # 생성물이 최신인지 확인
npm run check:all                       # J13~J16 포함 전체 검사
```

소스 규칙(검사기 J14가 잡는다):

- 색은 테마 변수(`bg-primary`, `text-muted-foreground`)나 `var(--jeju-*)`만 쓴다. hex, Tailwind 기본 팔레트, `dark:` 변형을 쓰지 않는다.
- 컨트롤 치수는 `h-(--jeju-control-h)`, `h-(--jeju-input-h)`, `size-(--jeju-choice-size)`처럼 토큰으로 준다. 그래야 대민 프로필이 적용된다.
- 포커스는 `focus-visible:shadow-(--jeju-focus-ring)`, 겹침 순서는 `z-(--jeju-z-menu)` 같은 토큰을 쓴다.
- 아이콘은 `@/components/ui/jeju-icons`, `cn`은 `@/lib/utils`에서 가져온다.
- 배경색으로만 상태를 보여 주는 컨트롤(스위치·체크박스·진행률·현재 페이지·눌린 칩)에는 `forced-colors:` 변형으로 Windows 고대비 표시를 함께 준다.

새 항목을 추가하면 `tools/build_registry.py`의 `META`에 제목·설명을, `design/components.tsv`의 `react` 열에 항목 이름을 넣는다(J16). npm 의존성과 항목 간 의존성은 import 문에서 자동으로 읽는다.

## 8. 설계 결정

- **shadcn 공식 소스 + 토큰.** Tier 1 CSS를 TSX로 옮겨 적으면 리터럴 치수가 컴포넌트마다 흩어지고 shadcn 생태계의 블록을 그대로 쓸 수 없다(경기도의회 ADR 0011의 교훈). 공식 소스를 가져와 색·치수·아이콘만 제주 규칙으로 바꿨다.
- **테마 변수의 의미는 shadcn을 따른다.** `--secondary`, `--accent`는 shadcn 관례대로 중립색(표면·hover)에 연결했다. 대신 제주 Button은 Tier 1과 같은 이름으로 `secondary`=Green, `accent`=Orange 변형을 제공한다.
- **데이터 표는 추가 의존성 없이.** 행정 목록에 필요한 정렬·선택·페이지 기능을 React 상태로 직접 구현했다. 복잡한 열 조작이 필요한 서비스는 TanStack Table을 따로 조합할 수 있다.
- **아이콘은 sprite 하나에서.** Tier 1과 Tier 2가 같은 아이콘을 쓰도록 `jeju-icons.svg`에서 React 컴포넌트를 생성한다.
- **토큰 파일은 `layer(base)`로.** 토큰 파일의 전역 `:focus-visible` 규칙은 유지하면서 컴포넌트 유틸리티가 이를 덮을 수 있게 한다.

## 9. 검증 기록

2026-09-24(v0.6.0), 같은 절차로 레지스트리 61항목 설치:

- `tsc -b` 오류 0, `vite build` 성공, gate FAIL 0(S8 WARN 1건)
- Microsoft Edge 143개 점검 통과: v0.5 점검 전체 + Tier 1 서버 목록(정렬 · 페이지 링크, 조건 검색, 상세 불러오기, 새로 그린 뒤 Tab 위치) · standalone 서버 목록 · 인쇄(Tier 1 목록 · 상세 패널 · 업무 예제 · 대민 · React 업무 예제 · React 상세 패널) · Tier 1 입력 높이, 넘침 0, 콘솔 오류 0
- WebKit 26.6(Safari 엔진, `tools/e2e/verify-browsers.mjs`) 13개 점검 통과: React 4화면 · Tier 1 5종 넘침(390 · 1440), 프로필 치수, 상세 패널 · 메뉴 키보드, 서버 목록, 상세 불러오기와 다시 시도 포커스, 대민 서비스 검색, React 정렬 · 인쇄 · 로딩·오류 상태
- Firefox는 이 PC에서 Playwright용 실행 파일이 Visual C++ 런타임 문제로 뜨지 않아 확인하지 못했다. CI(Ubuntu)는 Firefox를 함께 돌린다.

v0.5.0 기록:

2026-09-24(v0.5.0), 같은 절차로 레지스트리 61항목 설치:

- `tsc -b` 오류 0, `vite build` 성공, gate S1~S8 FAIL 0(S8 WARN 1건: 글꼴 파일 미배치, 예상한 결과)
- 116개 점검 통과: v0.4 점검 전체 + 상세 패널(React · Tier 1 390/1440px · standalone: 480px 또는 화면 폭, Esc, 연 버튼으로 포커스 복귀), 로딩·오류 상태(React · Tier 1: `aria-busy`, status/alert 문구, 다시 시도 뒤 포커스가 상태 영역으로), 서버 조회형 표(정렬 · 페이지 이동 때 서버 요청, 스켈레톤, 실패 뒤 다시 시도로 복구, 포커스가 건수 문구로), 넘침 0, 콘솔 오류 0

v0.4.0 기록:

2026-09-24(v0.4.0), CI와 같은 절차(`tools/e2e/prepare-consumer.mjs`)로 새 프로젝트를 만들어 레지스트리 58항목 설치:

- `tsc -b` 오류 0, `vite build` 성공, gate S1~S7 통과
- 109개 점검 통과: React 4화면 · Tier 1 4화면 · standalone 4파일 × 5개 뷰포트 넘침 0, 누를 수 있는 영역(업무 24px · 대민 44px), 대민 치수(작은 버튼 · 칩 44px, 도움말 · 배지 13px), 서비스 검색 · 자격 확인 · 서식 내려받기 동작, 콘솔 오류 0

v0.3.0 기록:

2026-09-24, Vite 8 · React 19 · TypeScript 6(strict) · Tailwind CSS 4 · shadcn CLI 4.21 · Microsoft Edge(Playwright):

- 빈 프로젝트에서 `npx shadcn add @jeju/jeju-style`와 블록·예제 설치 → `tsc -b` 오류 0, `vite build` 성공
- 설치된 소스는 레지스트리 소스와 같다(CLI가 `rsc: false`에서 `"use client"`만 제거)
- 예제 4화면 × 390·768·1024·1440·1920px: body 가로 넘침 0, 콘솔 오류·경고 0
- 계산 스타일·키보드·ARIA 43개 점검 통과: 업무 36px·14px / 대민 48·56px·17px, 표 헤더 2px Primary, 포커스 링 토큰, 정렬 aria-sort·아이콘, 전체 선택 indeterminate, 메뉴·모달·드로어·확인 대화상자 Esc와 포커스 복귀, 툴팁 키보드 표시, 탭·아코디언 화살표 이동, 오류 요약 → 입력 이동, 마법사 단계 이동·포커스, 주요 색 조합 대비 4.5:1 이상
- Windows 고대비(forced-colors) 에뮬레이션에서 스위치·체크박스·라디오·현재 페이지 표시 확인
- `check_design.py --gate`로 소비 프로젝트 S1~S7 통과
