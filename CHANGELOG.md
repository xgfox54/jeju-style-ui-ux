# 변경 이력

## v0.6.0 공개 배포 — 이름 정리 (2026-09-24)

- 배포 이름을 **Jeju Style UI·UX 디자인 가이드**로, 파일·패키지 이름을 `Jejustyle_UIUX`로 정했다(`package.json`, README, DESIGN.md, 예제 갤러리 제목, standalone 머리말).
- 공개 저장소: https://gitlab.aigov.go.kr/memory365/jeju-style-ui-ux
- 토큰 · CSS 클래스 · 파일(`jeju-*`) · 레지스트리 항목(`@jeju/*`) 이름은 바꾸지 않았다. 이미 적용한 서비스는 고칠 것이 없다.

## v0.6.0 — server lists · print · token docs

### 서버 조회형 목록 (Tier 1 · JSP 등 서버 템플릿)

- 새 기준 예제 `design/examples/list.html`(서비스 연계 요청 57건). 조회 조건 · 정렬 · 페이지 이동 · 페이지 크기를 모두 주소(`?district=&status=&q=&sort=&dir=&size=&page=`)로 주고받는다. 화면은 서버가 그릴 마크업 그대로이고, `list-demo.js`가 서버 역할을 흉내 낸다.
- 정렬은 `th[aria-sort]` 안의 링크 `a.jeju-table__sort`다. 숨김 글자로 누르면 어떻게 되는지("오름차순으로 정렬")를 알리고, 현재 정렬은 `aria-sort`와 아이콘 모양으로 함께 보여 준다.
- 페이지 이동은 링크(`aria-label="2페이지"`, 현재 쪽 `aria-current="page"`)다. 첫 쪽의 이전 · 끝 쪽의 다음은 `aria-disabled="true"`이고, 쪽이 많으면 `.jeju-pagination__gap`(…)으로 줄인다.
- 조회 조건과 페이지 크기는 GET 폼이다. 페이지 크기는 고른 뒤 "적용"을 눌러야 바뀐다(고르기만 해도 페이지가 바뀌지 않게, WCAG 3.2.2).
- 링크와 폼 주소 끝에 목록 제목 앵커(`#list-title`)를 붙였다. 페이지를 새로 불러온 뒤 다음 Tab이 목록 안에서 시작한다.
- 문서 제목에 쪽 번호("(2/6쪽)")를 넣는다.
- `.jeju-table__sort`의 누르는 높이를 `--jeju-target-min`으로 맞췄다(버튼 · 링크 공통). 페이지 이동에 hover · 비활성 모양을 더했다.

### 불러오기 도우미 `JejuDesign.load(영역, 작업)`

- 작업을 부르는 동안 불러오는 중, 끝나면 완료(`false`를 돌려주면 결과 없음), 실패하면 오류로 바꾼다. 다시 시도 버튼은 마지막 작업을 다시 부른다.
- 새 요청이 오면 이전 요청을 `AbortSignal`로 취소하고, 늦게 도착한 이전 응답은 화면에 반영하지 않는다. 실패하면 `jeju:async-error` 이벤트를 보낸다.
- 서버 목록 예제의 상세 패널이 이 도우미로 상세를 불러온다(0.6초 지연, 실패 스위치).

### 모달 여닫기 이벤트 위임

- `data-jeju-dialog-open` · `data-jeju-dialog-close`를 문서에서 한 번만 위임 처리한다. 서버가 목록 행을 AJAX로 다시 그려도 새 버튼이 그대로 동작하고, `initAll`을 여러 번 불러도 중복 등록되지 않는다.

### 인쇄

- Tier 1 `@media print`: 셸 · 버튼 모음 · 검색 폼(`form[role=search]`) · 페이지 이동 · 선택 열 · 일괄 작업 바를 숨긴다. 표는 가로 스크롤과 고정 헤더를 풀어 끝까지 펼치고, 머리글 행을 쪽마다 반복하며, 행이 쪽 경계에서 잘리지 않게 한다. 배지는 배경 없이도 보이게 테두리를 준다.
- 새 클래스 `.jeju-print-only`(인쇄에만 보임) · `.jeju-no-print`(화면에만 보임) · `.jeju-print-header`(기관 · 조건 · 출력 일시 한 줄).
- 상세 패널이 열려 있으면 패널 내용만 인쇄한다(패널은 `body` 바로 아래에 둔다).
- 훅 `data-jeju-print`(누르면 인쇄 창), `data-jeju-print-date`(인쇄 직전에 출력 일시를 채움). 업무 예제의 "목록 인쇄" 메뉴를 연결했다.
- 대민: 알림 띠 · 메뉴 · 검색 · 푸터를 숨기고 기관 식별은 남기며, 본문의 외부 링크 뒤에 주소를 적는다.
- React: 셸 · 데이터 표 · 표 컨테이너 · 토스트에 `print:` 유틸리티를 넣고, `jeju-theme`의 전역 CSS에 `@media print`(열린 상세 패널만 인쇄, 흰 배경, 포커스 표시 제거)를 더했다. `shadcn add`가 전역 CSS에 그대로 넣는다.

### 토큰 문서 자동 생성

- `tools/build_token_docs.py` → `docs/tokens.md`: 토큰 131개를 토큰 파일의 절 제목대로 묶어 업무 값 · 대민 값(다른 토큰을 거쳐 바뀌는 값 포함) · 흰색 대비 · 설명을 표로 만든다. 고대비 설정에서 바뀌는 값도 따로 적는다.
- 검사 규칙 J19: 문서가 토큰 파일과 같은지 확인한다. `npm run tokens:build` · `tokens:check`.

### 도구

- 검사기와 standalone 생성기가 `design/examples`의 예제를 목록 고정 없이 모두 다룬다(지금 5종). standalone은 `?`로 시작하는 같은 페이지 주소를 파일로 보지 않는다.
- 다른 브라우저 점검 `tools/e2e/verify-browsers.mjs`(Firefox · WebKit): 넘침 · 프로필 치수 · 키보드와 포커스 · 서버 목록 · 상세 불러오기 · 인쇄의 핵심 13개. `prepare-consumer.mjs`가 함께 복사한다.
- CI: 정적 작업에 토큰 문서 신선도를 추가하고, 브라우저 작업에서 Firefox · WebKit 점검을 함께 돌린다. 규칙 범위 표기를 J1~J19 · S1~S8로 고쳤다.

### 고친 것

- Tier 1 한 줄 입력 · 선택 상자가 본문 줄 높이(1.5)를 물려받아 업무 화면에서 36px이 아니라 39~41px로, Safari에서는 선택 상자가 48px로 그려지던 문제를 고쳤다. 높이를 `--jeju-input-h`로 고정해 Edge · WebKit 모두 업무 36px · 대민 48px이 됐다(React는 원래 36px). 다른 브라우저 점검을 만들다 찾았다.

### 검증

- `npm run check:all` · `registry:check` · `standalone:check` · `tokens:check` 통과.
- CI와 같은 절차의 새 프로젝트에 레지스트리 61항목 설치: `tsc -b` 오류 0, `vite build` 성공, gate FAIL 0(S8 WARN 1건: 글꼴 파일 미배치, 예상한 결과).
- Microsoft Edge(Playwright) 143개 점검 통과(v0.5보다 27개 늘었다): 서버 목록 · standalone 목록의 넘침(5개 폭)과 누를 수 있는 영역, 정렬 링크 · 새로 그린 뒤 Tab 위치 · 2쪽 · 페이지 크기 · 조건 검색, 상세 불러오기(빠른 연속 요청 · 실패 · 키보드로 다시 시도 · 포커스 복귀), 인쇄(서버 목록 · 상세 패널 · 업무 예제 · 대민 · React 업무 예제 · React 상세 패널), Tier 1 입력 높이. 콘솔 오류 0.
- WebKit 26.6(Safari 엔진) 13개 점검 통과. Firefox는 이 PC에서 Playwright용 실행 파일이 Visual C++ 런타임 문제로 뜨지 않아 로컬 확인을 못 했고, CI에 넣어 두었다.

## v0.5.0 — async states · side panel · server table · fonts

### 로딩·오류 상태 (Tier 1 · Tier 2)

- `.jeju-state` · `.jeju-state--error`: 목록이나 상세를 불러오는 자리에 불러오는 중 · 실패 상태를 같은 모양으로 보여 준다. 오류 상태는 무엇이 안 됐는지와 다음 행동(다시 시도 · 문의)을 함께 쓴다.
- `.jeju-skeleton`(`--short` · `--block`): 불러오는 동안 자리를 잡아 두는 막대. 움직임 줄이기 설정에서는 멈추고, Windows 고대비에서는 점선 테두리로 보인다.
- `data-jeju-async` 영역: 불러오는 중 · 오류 · 결과 없음 · 완료 중 하나만 보이고, 불러오는 동안 `aria-busy`를 켜며, 바뀐 상태를 숨김 live 영역에 문구로 알린다. 스크립트는 `JejuDesign.setAsyncState(영역, 상태)`로 상태를 바꾸고, 다시 시도 버튼(`data-jeju-async-retry`)은 `jeju:retry` 이벤트를 보낸다.
- 다시 시도 버튼처럼 포커스가 있던 요소가 상태 전환으로 사라지면 포커스를 상태 영역으로 옮긴다. 키보드 사용자가 문서 처음으로 튕기지 않는다.
- React `@jeju/jeju-async-state`: `LoadingState` · `ErrorState` · `AsyncState`.

### 상세 보기 사이드 패널

- 토큰 `--jeju-side-panel-w`(480px)를 추가했다.
- `dialog.jeju-modal--side` + `.jeju-detail-list`: 목록에서 한 건을 골라 화면을 떠나지 않고 상세를 본다. 기존 모달 훅(`data-jeju-dialog-open`)을 그대로 써서 포커스 가두기 · Esc 닫기 · 연 버튼으로 포커스 복귀가 동작한다. 좁은 화면에서는 화면 폭 전체를 쓴다.
- 표 안에서 상세를 여는 버튼 `.jeju-table__link`(누르는 영역 `--jeju-target-min`). 업무 예제(`work.html`)는 관리번호를 누르면 그 행의 상세 패널이 열린다.
- React `@jeju/jeju-detail-panel`: `DetailPanel` · `DetailList`. Radix Sheet는 전용 Trigger로 열었을 때만 포커스를 돌려주므로, 표 안 버튼처럼 상태로 여는 경우에도 연 요소로 포커스를 돌려주게 했다. React 업무 예제도 관리번호로 패널을 연다.

### 서버 조회형 데이터 표 (Tier 2)

- `DataTable`에 `manual` 모드를 추가했다. 정렬 · 페이지 · 페이지 크기 변경을 `onSortChange` · `onPageChange` · `onPageSizeChange`로 알리고, 호출한 쪽이 서버에서 해당 페이지만 받아 `data`로, 전체 건수를 `totalCount`로 넘긴다.
- `loading`이면 스켈레톤 행 · `aria-busy` · "목록을 불러오는 중입니다." 알림을, `error`면 표 안에 오류 상태와 다시 시도 버튼(`onRetry`)을 보여 준다. 다시 시도하면 포커스가 건수 문구로 옮겨 간다.
- 제어형 `sort` · `page` · `pageSize`와 `DataTableSort` 타입을 내보낸다. 전체 데이터를 넘기는 기존 사용법은 그대로 동작한다.
- React 갤러리 예제에 가짜 API(57건, 0.5초 지연, 실패 스위치)로 움직이는 서버 조회형 표와 로딩·오류 상태 예제를 넣었다.

### 글꼴 자체 호스팅

- `design/fonts/jeju-fonts.css`: Pretendard GOV `@font-face`. PC에 설치된 글꼴(`local()`)을 먼저 찾고, 없으면 같은 폴더의 `PretendardGOVVariable.woff2`를 쓰며 `font-display: swap`이다. 글꼴 파일은 라이선스(SIL OFL 1.1) 확인과 기관 반입 승인 뒤 둔다. 절차는 `design/fonts/README.md`에 있다.
- React `@jeju/jeju-fonts`: `public/fonts/jeju-fonts.css`로 설치한다.
- 검사 규칙 J18(정본 글꼴 CSS가 외부 주소 없이 같은 폴더만 참조하는지, 글꼴 이름이 토큰의 첫 글꼴과 같은지, swap을 쓰는지)과 S8(서비스에 글꼴 파일이 있는지. 없으면 WARN, 외부 주소면 FAIL)을 추가했다.
- standalone 생성기는 글꼴 파일이 없으면 참조를 그대로 두고 WARN을 낸다.

### 검증

- `npm run check:all` · `registry:check` · `standalone:check` 통과.
- CI와 같은 절차로 만든 Vite 8 · React 19 · TypeScript 6 · Tailwind 4 · shadcn 4.21 프로젝트에 레지스트리 61항목 설치: `tsc -b` 오류 0, `vite build` 성공, gate S1~S8 FAIL 0(S8은 글꼴 파일이 없어 WARN 1건, 예상한 결과).
- Microsoft Edge(Playwright) 116개 점검 통과. v0.4 점검 전체에 더해 상세 패널(React · Tier 1 390/1440px · standalone: 열기, 480px 또는 화면 폭, Esc, 포커스 복귀), 로딩·오류 상태(React · Tier 1: `aria-busy`, status/alert 문구, 다시 시도 뒤 포커스 위치), 서버 조회형 표(정렬 · 페이지 이동 때 서버 요청, 스켈레톤, 실패 뒤 다시 시도)를 확인했다. 가로 넘침 0, 콘솔 오류 0.

## v0.4.0 — public services · standalone · CI

### 대민 터치 영역 · 글자 크기

- 기준을 정했다. 업무 화면은 WCAG 2.2 SC 2.5.8(최소 24×24px, 간격 예외 허용), 대민 화면은 KRDS 권장(실제로 누를 수 있는 영역 44×44px 이상)과 KRDS 가장 작은 글자 13px(xsmall)을 따른다.
- 토큰 추가: `--jeju-target-min`(업무 24px / 대민 44px), `--jeju-chip-h`(30 / 44px), `--jeju-chip-remove`(20 / 28px), `--jeju-feedback-font`(입력 오류·확인 문장, 12 / 15px).
- 대민 프로필 조정: `--jeju-control-h-sm` 40 → 44px, `--jeju-text-xs` 12 → 13px.
- Tier 1: 칩 높이 · 칩 제거 버튼(보이는 원은 작게, 누르는 영역은 `--jeju-target-min`) · 툴팁 도움말 버튼 · 경로 표시 링크 · 선택 행(`.jeju-choice`) · 대민 브랜드 링크 · 페이지 번호 버튼 · 검색 입력 높이를 토큰으로 맞췄다. 배지 글자 12px 고정값과 오류 문장 크기를 토큰으로 바꿨다.
- Tier 2: chip · field(가로 배치 라벨 최소 높이, 오류 문장) · breadcrumb 링크 · 대민 셸 브랜드 링크 · 파일 업로드 안내 문장을 같은 토큰으로 맞췄다.
- v0.3에서 남았던 Tier 1 색 리터럴 `#d9ecf8`(유틸리티 바), `#f5f7f8`(대민 푸터)을 토큰으로 바꿨다.

### 대민 서비스 컴포넌트 (Tier 1 · Tier 2)

- 서비스 검색 `.jeju-service-search` / `@jeju/jeju-service-search`: 검색어와 분류 칩(한 번에 하나)으로 목록을 거르고 결과 수를 `role="status"`로 알린다. 결과가 없으면 빈 상태와 초기화 버튼.
- 신청 자격 확인 `.jeju-checklist` / `@jeju/jeju-eligibility-check`: 예/아니요 질문으로 자가 확인. 결과를 알림 색(안내·가능·상담 필요)과 문구로 함께 보여 주고, 맞지 않는 항목 이름을 알려 준다.
- 서식 내려받기 `.jeju-doc-list` / `@jeju/jeju-doc-list`: 버튼 이름에 문서명 · 형식 · 크기가 들어간다.
- 문의·방문 안내 `.jeju-contact` / `@jeju/jeju-contact`: 전화(tel:) · 운영 시간 · 주소 · 외부 지도 링크(지도를 끼워 넣지 않음).
- 함께 찾는 서비스 `.jeju-related` / `@jeju/jeju-related-links`.
- `jeju-behaviors.js`에 `initServiceSearch`, `initChecklists`를 추가했다.
- 대민 예제(`public.html`, `jeju-example-public`)에 다섯 컴포넌트를 모두 넣었다. `jeju-search`에 보이는 라벨 옵션(`hideLabel={false}`)을 추가했다.

### standalone · CI

- `tools/build_standalone.py`(표준 라이브러리만 사용): CSS · JS · 아이콘 sprite · 이미지를 HTML 한 파일에 넣는다. 예제 4종은 `dist/standalone/`에, 서비스 화면은 `python tools/build_standalone.py page.html --out DIR`로 만든다. 서버 없이 더블클릭으로 열어도 같은 화면과 동작이 나온다.
- 검사 규칙 J17: 예제 4종이 로컬 참조 없는 단일 파일로 만들어지는지 확인한다.
- `.github/workflows/check.yml`: 정적 검사(J1~J17 · 예제 gate · 레지스트리 신선도 · standalone 산출물)와 브라우저 검증(빈 Vite 프로젝트에 레지스트리 설치 → 타입 검사 · 빌드 · gate S1~S7 · Playwright).
- `tools/e2e/prepare-consumer.mjs`: 소비 프로젝트 준비 절차(레지스트리 등록 · 설치 목록 · 전역 CSS 정리 · 다크 모드 제거 · 검증 앱 복사)를 CI와 로컬이 함께 쓴다.
- 브라우저 검증에 대상 크기 검사, 대민 서비스 컴포넌트 동작, standalone(file://, 네트워크 차단) 검사를 더했다.

### 검증

- `npm run check:all` · `registry:check` · `standalone:check` 통과.
- CI와 같은 절차로 새 Vite 8 · React 19 · TypeScript 6 · Tailwind 4 · shadcn 4.21 프로젝트를 만들어 레지스트리 58항목을 설치: `tsc -b` 오류 0, `vite build` 성공, gate S1~S7 통과.
- Microsoft Edge(Playwright) 109개 점검 통과: React 예제 4화면 · Tier 1 예제 4화면 · standalone 4파일 × 390~1920px 가로 넘침 0, 대상 크기(업무 24px · 대민 44px), 대민 치수(작은 버튼 · 칩 44px, 도움말 · 배지 13px), 서비스 검색 · 자격 확인 · 서식 내려받기 동작, 콘솔 오류 0.
- 이 과정에서 새 프로젝트의 첫 설치에도 `-o`가 필요하다는 점(`init`이 기본 button.tsx를 만든다)을 확인해 안내서와 CI에 반영했다.

## v0.3.0 — React/shadcn registry

### React 레지스트리(Tier 2)

- `npx shadcn add @jeju/...`로 설치하는 정적 레지스트리 `public/r/*.json` 53항목을 추가했다. 내부 정적 서버로 서빙해 망분리 환경에서도 쓸 수 있다.
- 기반 항목: `jeju-tokens`(정본 토큰 사본), `jeju-theme`(shadcn 변수 → `var(--jeju-*)`, hex·다크 팔레트 없음), `jeju-style`(한 번에 설치).
- UI 34종: shadcn 공식 소스(Radix)에 제주 토큰을 입혔다. 컨트롤 높이·글자 크기가 프로필 토큰을 따르므로 `data-jeju-profile="public"`이 React 화면에도 적용된다. 제주 고유 `chip`과 sprite에서 생성한 `jeju-icons`를 포함한다.
- 블록 12종: 업무 셸, 페이지 머리, KPI, 행정용 데이터 표(정렬·선택·일괄 작업·페이지·고정 헤더·첫 열 고정·모바일 카드형, 추가 의존성 없음), 날짜·기간 선택, 검색, 파일 업로드, 오류 요약, 단계, 신청 마법사, 대민 셸, 공통 조각.
- 기준 화면 예제 4종: 업무 목록 · 업무 폼 · 대민 · 컴포넌트 갤러리(Tier 1 예제의 React판).
- v0.2에서 남았던 달력형 날짜 선택(Date picker)과 기간 프리셋을 React 쪽에서 제공한다.
- 빌더 `tools/build_registry.py`(Python 표준 라이브러리만 사용): sprite → React 아이콘 생성, import 문에서 의존성 추출, `registry.json`·`public/r` 생성, `--check`로 최신 여부 확인.
- 안내서 `docs/react-registry.md`: 설치, 손으로 하는 세 가지, shadcn과 다른 점, 검사, 레지스트리 수정 규칙, 설계 결정, 검증 기록.

### 토큰 · Tier 1

- `--jeju-on-fill`(채움색 위 글자) 토큰을 추가하고 Tier 1 CSS의 `#fff` 글자색을 이 토큰으로 바꿨다. 값은 같다.
- 본문에 `word-break: keep-all`을 적용해 한국어가 어절 중간에서 줄바꿈되지 않게 했다(Tier 1·Tier 2 공통).

### 검사기

- 정본 J13 레지스트리 생성물 신선도, J14 레지스트리 소스 규칙(hex·Tailwind 기본 팔레트·`dark:`·lucide 금지, 미정의 토큰), J15 테마 변수가 모두 정의된 토큰인지, J16 `components.tsv` react 열과 레지스트리 항목 대응.
- 서비스 S6 React 프로젝트의 토큰 사본이 정본과 같은지, S7 전역 CSS의 토큰 import · `--primary` 연결 · 다크 팔레트 잔재.
- `components.tsv`에 `react` 열을 추가하고 Tier 2 전용 항목(select, popover, sheet, separator, skeleton, toggle)을 등록했다.

### 검증

- `npm run check:all` 통과.
- 새 Vite 8 · React 19 · TypeScript 6 · Tailwind CSS 4 · shadcn CLI 4.21 프로젝트에 레지스트리를 설치해 `tsc -b` 오류 0, `vite build` 성공.
- Microsoft Edge(Playwright)에서 React 예제 4화면과 Tier 1 예제 4화면 × 390 / 768 / 1024 / 1440 / 1920 뷰포트 가로 넘침 없음, 콘솔 오류·경고 없음.
- 계산 스타일·키보드·ARIA·대비 43개 점검 통과, Windows 고대비 에뮬레이션에서 선택 상태 표시 확인.
- 소비 프로젝트 `check_design.py --gate` S1~S7 통과.

## v0.2.0 — component expansion

### 추가된 공통 컴포넌트

- 아코디언 `.jeju-accordion` (단일/다중 열기, 화살표 키 이동)
- 툴팁 `.jeju-tooltip` (포커스 표시, Esc 닫기, 포인터 유지)
- 드롭다운 메뉴 `.jeju-menu` (roving focus, Esc 시 포커스 복귀)
- 체크박스·라디오 `.jeju-choice`, 카드형 선택지 `.jeju-choice--card`
- 스위치 `.jeju-switch` (상태 문구 병기)
- 칩 `.jeju-chip` (필터 토글, 조건 제거)
- 날짜 입력 `.jeju-date-range`, 기간 프리셋 `.jeju-date-presets`
- 파일 업로드 `.jeju-upload` (드래그 앤 드롭, 파일 목록, 개별 삭제)
- 진행률 `.jeju-progress`
- 단계 `.jeju-steps`, 마법사 `.jeju-wizard`
- 경로 표시 `.jeju-breadcrumb`를 대민 전용에서 공통으로 이동
- 접근성 유틸 `.jeju-visually-hidden`

### 업무 폼 시스템

- `.jeju-form`, `.jeju-form-section`, `.jeju-form-grid`, `.jeju-fieldset`, `.jeju-form-actions`
- 상태 계층: 기본 / hover / focus / readonly / disabled / 필수 / 오류 / 성공
- 오류 요약 `.jeju-error-summary`
- 다단 폼에서 입력 높이가 이웃 필드에 따라 늘어나던 문제 수정

### 데이터 표 확장

- 정렬 `.jeju-table__sort` + `aria-sort` + 아이콘 모양 변경
- 행 선택, 전체 선택 indeterminate, 일괄 작업 바 `.jeju-bulkbar`
- 고정 헤더 `.jeju-table--sticky`, 첫 열 고정 `.jeju-table--pinned-col`
- 목록 도구 모음 `.jeju-table-toolbar`, 페이지 크기 `.jeju-pagesize`
- 560px 이하 카드형 전환 `.jeju-table--stack`

### 토큰

- 폼 상태 역할색: `--jeju-disabled-bg`, `--jeju-disabled-border`, `--jeju-disabled-text`, `--jeju-readonly-bg`
- 반전 표면: `--jeju-inverse-surface`, `--jeju-inverse-text`
- 선택 컨트롤 치수: `--jeju-choice-size`, `--jeju-switch-w`, `--jeju-switch-h`, `--jeju-progress-h`, `--jeju-step-dot`
- 레이어 스케일: `--jeju-z-sticky`, `--jeju-z-drawer`, `--jeju-z-menu`, `--jeju-z-tooltip`, `--jeju-z-toast`
- `--jeju-radius-xs`, `--jeju-shadow-pop`, `--jeju-overlay`, `--jeju-menu-min-w`, `--jeju-tooltip-max-w`

### 아이콘

10종에서 39종으로 확장했다. chevron 4방향, arrow, minus, help, upload, file, folder, edit, delete, calendar, clock, filter, sort, refresh, settings, user, users, building, location, phone, mail, print, external-link, more, lock, unlock을 추가했다.

### 예제

- `design/examples/form.html` 신규: 업무 폼 시스템 전체 상태
- `design/examples/work.html`: 행정용 확장 표, 필터 칩, 목록 도구 메뉴
- `design/examples/public.html`: 신청 절차 마법사, FAQ 아코디언, 서류 업로드
- `design/examples/index.html`: v0.2 컴포넌트 갤러리, 확인 대화상자

### 검사기

- J11: `components.tsv` 클래스가 정본 CSS에 존재하는지 검사
- J12: 예제의 SVG sprite 심볼이 `jeju-icons.svg`에 존재하는지 검사
- J3에 반전 표면 대비 검사 추가
- 대민 프로필 허용 override에 선택 컨트롤 치수 토큰 추가

### 검증

- `npm run check:all` 통과
- Chromium에서 4개 예제 x 390 / 768 / 1024 / 1440 / 1920 뷰포트 확인, body 가로 오버플로 없음
- 아코디언, 툴팁, 메뉴, 스위치, 칩, 표 정렬·선택, 파일 업로드, 마법사, 모바일 드로어, 모달·확인 대화상자 동작 확인

## v0.1.0 — foundation

- 제주 브랜드 토큰과 업무/대민 프로필
- P0 공통 컴포넌트, 접근성 기본 규칙, Vanilla JS 동작
- 업무/대민 실물 예제, 공통 SVG 아이콘 sprite
- 디자인 검사기(J1~J10), 적용 체크리스트, Codex/AI 지침
