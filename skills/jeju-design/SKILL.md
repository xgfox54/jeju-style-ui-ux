---
name: jeju-design
description: Jeju Style UI·UX 디자인 가이드(제주특별자치도 공통 디자인 시스템)를 사용해 업무·대민 UI를 설계/수정하고 일관성을 검증하는 스킬
---

# Jeju Design Skill

## 목적

제주특별자치도 UI를 만들거나 수정할 때 임의 디자인을 새로 만들지 않고 이 저장소의 토큰과 컴포넌트를 사용한다.

## 시작 순서

1. `docs/contract.md`를 읽는다.
2. 대상이 **업무(work)** 인지 **대민(public)** 인지 판정한다.
3. 가장 가까운 기준 예제를 찾는다.
   - 목록·검색 화면: `design/examples/work.html`
   - 서버(JSP 등)가 한 페이지씩 그리는 목록: `design/examples/list.html`
   - 입력·등록 화면: `design/examples/form.html`
   - 대민 화면: `design/examples/public.html`
   - 개별 컴포넌트: `design/examples/index.html`
4. `design/jeju-tokens.css`의 토큰명을 사용한다.
5. 기존 `.jeju-*` 컴포넌트를 먼저 조립한다. 인벤토리는 `design/components.tsv`다.
6. 공통 아이콘은 `design/jeju-icons.svg` sprite를 사용한다.
7. 동적 UI는 `design/jeju-behaviors.js`의 `data-jeju-*` 훅을 사용한다. 같은 동작을 새로 구현하지 않는다.
8. 새 규칙이 필요하면 서비스에 하드코딩하기보다 디자인 시스템 확장 여부를 검토한다.
9. `docs/adoption-checklist.md`로 적용 누락을 점검한다.
10. 검사기를 실행한다.

## 브랜드 규칙

- `#0173bc`, `#00a074`, `#f18101`은 제주 브랜드 원색이다.
- 원색 값을 서비스 CSS에 반복 기록하지 않는다.
- Green/Orange 채움 위 흰 글자가 필요하면 원색이 아니라 strong 역할 토큰을 사용한다.
- Blue는 Primary, Green은 Secondary/Success 계열, Orange는 Accent/Warning 계열에 우선 배치한다.
- 화면 전체를 세 색으로 동시에 채우지 않는다. Blue가 정보 구조의 주축이고 Green/Orange는 역할 기반 보조축이다.

## 업무 화면 처방

- GNB + LNB + 본문 구조
- 페이지 첫 화면은 제목/메타/주요 액션 다음에 검색·필터·표 또는 KPI
- 데이터 표는 숫자 오른쪽 정렬, 날짜 형식 통일
- 정렬이 필요하면 `th[data-sort]` + `.jeju-table__sort`, 행 선택이 필요하면 `[data-jeju-table-select]` 범위와 `.jeju-bulkbar`
- 모바일 대응이 필요한 표에는 `.jeju-table--stack`과 `td[data-label]`
- 상태는 배지 + 텍스트
- 긴 표는 자체 래퍼에서만 가로 스크롤
- 빈 상태는 “무엇이 없고 다음에 무엇을 하면 되는지”를 알려준다.
- 데이터를 받아 오는 영역은 `.jeju-async[data-jeju-async]` 안에 불러오는 중(`.jeju-state` · `.jeju-skeleton`) · 오류(`.jeju-state--error` + 다시 시도) · 결과 없음(`.jeju-empty`) · 완료를 모두 만들고 `JejuDesign.setAsyncState(영역, 상태)`로 바꾼다.
- 한 건의 상세는 목록을 떠나지 않고 사이드 패널(`dialog.jeju-modal--side` + `.jeju-detail-list`)로 본다. 여는 버튼은 `.jeju-table__link`이고 이름에 대상을 넣는다("IC-2609128 상세 보기").
- 서버가 정렬 · 페이지를 처리하는 목록은 `list.html`처럼 조건 · 정렬 · 쪽을 주소로 주고받는다. 정렬은 `th[aria-sort]` 안의 `a.jeju-table__sort`(숨김 글자로 동작), 쪽 번호는 `aria-label="2페이지"` 링크, 페이지 크기는 "적용" 버튼이 있는 GET 폼, 주소 끝에는 목록 제목 앵커를 붙인다.
- 상세를 서버에서 받아 올 때는 패널 본문의 `data-jeju-async` 영역에 `JejuDesign.load(영역, (signal) => fetch(...))`를 쓴다. 상태 전환 · 다시 시도를 따로 만들지 않는다.
- 인쇄를 고려한다. 화면에만 둘 요소는 `.jeju-no-print`, 인쇄물 첫 줄(기관 · 조건 · 출력 일시)은 `.jeju-print-only.jeju-print-header` + `data-jeju-print-date`, 인쇄 버튼은 `data-jeju-print`.

## 업무 폼 처방

- 구조는 `.jeju-form` > `.jeju-form-section` > `.jeju-form-grid` > `.jeju-field`
- 관련 입력 묶음은 `.jeju-fieldset` + `legend`
- 필수 표시는 별표가 아니라 “필수” 텍스트(`.jeju-required`)
- 오류는 `.is-error` + `aria-invalid` + `aria-describedby` + 구체적인 수정 방법
- 제출 실패 시 `.jeju-error-summary`를 폼 위에 두고 각 항목을 해당 입력으로 연결
- 비활성/읽기전용은 `disabled` / `readonly`와 역할색으로 구분

## 대민 화면 처방

- `data-jeju-profile="public"`
- `jeju-public.css` 로드
- 48px 기본 컨트롤
- 쉬운 용어, 충분한 여백, 명확한 H1
- 절차 안내는 `.jeju-steps` / `.jeju-wizard`, 자주 묻는 질문은 `.jeju-accordion`
- 서비스 찾기는 `.jeju-service-search`, 신청 가능 여부 자가 확인은 `.jeju-checklist`, 서식은 `.jeju-doc-list`, 문의·위치는 `.jeju-contact`, 관련 서비스는 `.jeju-related`(React는 같은 이름의 `@jeju/jeju-*` 블록)
- 누를 수 있는 요소는 44×44px 이상(`--jeju-target-min`), 글자는 13px 이상. 작은 아이콘 버튼은 누르는 영역만 넓힌다
- 공공기관 식별 영역과 푸터 유지
- 모바일 390px에서도 가로 오버플로 없이 동작

## React 화면 처방 (Tier 2)

- 대상이 React · Next.js · Vite + Tailwind CSS v4면 `docs/react-registry.md`를 따른다.
- `components.json`의 `registries`에 `@jeju`가 있는지 확인하고, 없으면 등록한 뒤 `npx shadcn add @jeju/jeju-style`로 시작한다.
- 전역 CSS에 `@import "../styles/jeju-tokens.css" layer(base);`가 있어야 한다. 프리셋의 `.dark` 팔레트는 지운다.
- 컴포넌트는 `@/components/ui/*`(레지스트리판)와 `@/components/jeju-*` 블록을 먼저 조립한다. 기준 화면은 `jeju-example-work` · `jeju-example-form` · `jeju-example-public`이다.
- 목록 화면은 `DataTable`(`@jeju/jeju-data-table`), 입력 화면은 `Field` + `ErrorSummary`, 절차 안내는 `Wizard`, 셸은 `WorkShell` / 대민 셸 블록을 쓴다.
- 서버에서 페이지 단위로 받는 목록은 `DataTable manual` + `totalCount` + `loading` · `error` · `onRetry`, 한 건 상세는 `DetailPanel` + `DetailList`, 그 밖의 불러오기 자리는 `AsyncState`(`@jeju/jeju-async-state`)를 쓴다.
- 아이콘은 `@/components/ui/jeju-icons`만 쓴다. 색은 `bg-primary` 같은 테마 변수나 `bg-(--jeju-success-tint)`처럼 토큰으로 쓴다.
- 버튼 변형은 Tier 1과 같다: `default`(Blue) · `secondary`(Green strong) · `accent`(Orange strong) · `outline` · `ghost` · `destructive`.
- 상태 배지는 `Badge variant="info|success|warning|danger|neutral"` + 문구, 스위치 옆에는 "켜짐/꺼짐" 문구를 둔다.
- 새 프로젝트의 첫 설치도 `npx shadcn add @jeju/jeju-style -o`로 한다(`init`이 만든 기본 button.tsx를 덮어써야 한다).
- 인쇄는 블록의 `print:` 유틸리티와 `jeju-theme`의 `@media print`가 맡는다. 새 조작 요소를 만들면 `print:hidden`을 붙인다.

## 망분리 전달

- 기관에 화면 시안을 보낼 때는 `python tools/build_standalone.py 화면.html --out 폴더`로 단일 HTML을 만든다. WARN이 없어야 한다.

## 글꼴

- 글꼴은 `design/fonts/jeju-fonts.css`(React `@jeju/jeju-fonts`)로 자체 호스팅한다. 외부 글꼴 CDN을 링크하지 않는다.
- 글꼴 파일(`PretendardGOVVariable.woff2`)은 기관 반입 승인 대상이다. 에이전트가 임의로 내려받아 저장소에 넣지 않는다. 파일이 없을 때 나오는 S8 WARN은 정상이다.

## 금지

- 새 HEX를 즉흥적으로 추가
- 외부 폰트 CDN
- `outline:none`만 두고 대체 포커스를 만들지 않기
- placeholder-only label
- 색만으로 승인/반려/경고를 구분
- 업무 화면과 대민 화면의 셸 혼합
- 중요 상태를 이모지 하나로 표시
- 필수 정보를 툴팁이나 hover에만 두기
- 데이터를 불러오는 자리에 스피너만 두고 오류 · 결과 없음 상태를 빠뜨리기
- 아코디언·메뉴·탭·모달을 직접 새로 구현
- React에서 `bg-blue-500` 같은 기본 팔레트, `bg-[#...]` 색 리터럴, `dark:` 변형, `lucide-react` 아이콘 사용
- shadcn 기본 레지스트리의 같은 이름 컴포넌트(`npx shadcn add button`)를 `@jeju` 항목과 섞어 쓰기

## 검증

```bash
python design/check_design.py --canon
python design/check_design.py --gate <서비스경로>
```

React 프로젝트는 루트(`components.json`이 있는 폴더)를 `--gate`에 넘긴다. 토큰 사본(S6)과 전역 CSS 설정(S7)까지 확인한다.

화면을 바꿨으면 `tools/e2e/README.md` 절차로 브라우저 검증을 돌린다. 누를 수 있는 영역(업무 24px · 대민 44px)까지 확인한다.

다른 브라우저는 `tools/e2e/verify-browsers.mjs`(WebKit · Firefox)로 핵심 동작을 다시 본다. 토큰 값을 바꿨으면 `python tools/build_token_docs.py`로 `docs/tokens.md`를 다시 만든다.

권장 뷰포트: 390 / 768 / 1024 / 1440 / 1920.

브라우저에서는 최소한 다음을 확인한다: body 가로 오버플로, 모바일 내비게이션, 키보드 포커스 이동, 아코디언·메뉴·탭·모달·드로어 동작, 표 정렬과 선택.
