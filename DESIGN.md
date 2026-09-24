# Jeju Style UI·UX 디자인 가이드 — DESIGN.md

제주특별자치도 업무·대민 서비스를 위한 공통 디자인 언어다. 구조적 운영 방식은 경기도의회 공개 디자인 시스템을 참고했지만, 제주 브랜드 3색과 `--jeju-*` 토큰으로 독립 설계한다.

- 값의 단일 원천: `design/jeju-tokens.css`
- 계약: `docs/contract.md`
- 컴포넌트: `design/jeju-components.css`
- 대민 셸: `design/jeju-public.css`
- 공통 동작: `design/jeju-behaviors.js`
- 아이콘: `design/jeju-icons.svg`
- 글꼴: `design/fonts/jeju-fonts.css`(자체 호스팅 선언), 반입 절차 `design/fonts/README.md`
- AI/Codex 지침: `skills/jeju-design/SKILL.md`
- 컴포넌트 예제: `design/examples/index.html`
- 업무 예제: `design/examples/work.html`
- 서버 조회형 목록 예제: `design/examples/list.html`
- 업무 폼 예제: `design/examples/form.html`
- 대민 예제: `design/examples/public.html`
- 접근성 기준: `docs/accessibility.md`
- 적용 체크리스트: `docs/adoption-checklist.md`
- 토큰 표(생성물): `docs/tokens.md` — `python tools/build_token_docs.py`로 만든다
- React 레지스트리(Tier 2): `docs/react-registry.md`, 소스 `registry/jeju/`, 생성물 `public/r/`

## 1. Visual Theme

### 브랜드 축

제주 UI는 세 개의 공식 포인트 색을 역할에 따라 쓴다.

| 축 | 토큰 | 역할 |
|---|---|---|
| Blue | `--jeju-blue` | 정보 구조의 주축, Primary, 링크, 선택 |
| Green | `--jeju-green` | 자연·완료·긍정·Secondary |
| Orange | `--jeju-orange` | 포인트·주의·강조 |

Blue를 기본 구조색으로 두고 Green/Orange는 역할 기반으로 제한한다. 세 색을 모든 컴포넌트에 균등 배분하지 않는다.

Green/Orange 원색은 흰 글자와 일반 텍스트 대비가 부족하므로 채움 버튼에는 `--jeju-green-dark`, `--jeju-orange-dark`를 쓴다. 브랜드 원색 자체는 바꾸지 않는다.

### 분위기

- 공공기관답게 명료하고 절제된 화면
- 제주 브랜드는 “색의 존재감”보다 **역할의 일관성**으로 드러낸다.
- 카드보다 정보 구조, 장식보다 업무 흐름을 우선한다.
- 기본 표면은 흰색과 저채도 회색.
- 카드·패널은 1px border + 14px radius를 기본으로 하고 과도한 그림자는 피한다.

## 2. Profiles

### Work

별도 속성이 없는 기본 프로필.

- 기본 컨트롤 36px
- 본문 14px
- 고밀도 표/폼/검색
- GNB 64px + LNB 256px
- KPI → 검색/필터 → 표/업무 목록 구조를 우선

### Public

`data-jeju-profile="public"`

- 기본 컨트롤 48px
- 본문 17px
- 터치와 읽기 쉬운 간격
- 대민 header/main/footer/identifier
- KRDS 계열 공공서비스 패턴 및 KWCAG 접근성 원칙 참고

프로필 간에 브랜드 색과 상태 의미는 같다. 치수와 정보 밀도만 달라진다. 대민 프로필은 선택 컨트롤 치수도 함께 확장한다.

| 토큰 | Work | Public |
|---|---:|---:|
| `--jeju-choice-size` | 18px | 24px |
| `--jeju-switch-w` / `--jeju-switch-h` | 44 / 24px | 56 / 30px |
| `--jeju-progress-h` | 8px | 12px |
| `--jeju-step-dot` | 32px | 40px |
| `--jeju-control-h-sm` | 32px | 44px |
| `--jeju-target-min` (누를 수 있는 최소 영역) | 24px | 44px |
| `--jeju-chip-h` / `--jeju-chip-remove` | 30 / 20px | 44 / 28px |
| `--jeju-text-xs` / `--jeju-feedback-font` | 12 / 12px | 13 / 15px |

누를 수 있는 영역 기준: 업무는 WCAG 2.2 SC 2.5.8(24×24px, 간격 예외 허용), 대민은 KRDS 권장(실제로 누를 수 있는 영역 44×44px 이상)을 따른다. 아이콘이 작아야 하는 곳(칩 제거 버튼)은 보이는 모양을 작게 두고 누르는 영역만 `--jeju-target-min`으로 넓힌다. 대민의 가장 작은 글자는 KRDS xsmall과 같은 13px이다.

## 3. Typography

기본 글꼴 체인:

`"Pretendard GOV", Pretendard, "Noto Sans KR", "Malgun Gothic", system-ui, sans-serif`

운영 환경에서는 Pretendard GOV를 자체 호스팅한다. 선언은 `design/fonts/jeju-fonts.css`(React는 `@jeju/jeju-fonts`)이고, 글꼴 파일은 라이선스 확인과 기관 반입 승인 뒤 같은 폴더에 둔다. 파일이 없으면 Noto Sans KR → 맑은 고딕으로 대체되어 화면은 깨지지 않는다. 외부 CDN은 쓰지 않는다(J18 · S8).

| 역할 | Work | Public |
|---|---:|---:|
| 본문 | 14px | 17px |
| 컨트롤 | 14px | 17px |
| H1 | 24px | 32px |
| KPI | 30px | 40px |

## 4. Component Language

### Button

- `.jeju-btn--primary`: Blue
- `.jeju-btn--secondary`: 접근성 Green
- `.jeju-btn--accent`: 접근성 Orange
- `.jeju-btn--outline`: 중립 보조 액션
- `.jeju-btn--danger`: 파괴적 액션
- 비활성은 `disabled` 또는 `aria-disabled`로 표시하고 `--jeju-disabled-bg`, `--jeju-disabled-border`, `--jeju-disabled-text` 역할색을 쓴다.

### Badge / Alert

상태색과 텍스트를 함께 쓴다.

- info: Blue
- success: Green
- warning: Orange
- danger: Red semantic

### Table

- 헤더 상단에 Primary 2px
- 숫자 `.num` 오른쪽 정렬
- 행 hover는 중립 배경
- 넓은 표는 `.jeju-table-wrap` 안에서만 가로 스크롤
- 정렬은 `th[data-sort]` + `.jeju-table__sort` 버튼으로 두고 `aria-sort`와 아이콘 모양을 함께 바꾼다.
- 서버가 정렬하는 목록은 같은 `.jeju-table__sort`를 링크로 둔다. 자세한 것은 아래 Server List.
- 고정 헤더는 `.jeju-table--sticky`, 첫 열 고정은 `.jeju-table--pinned-col`
- 행 선택은 `[data-jeju-select-all]` / `[data-jeju-select-row]`, 일괄 작업은 `.jeju-bulkbar`
- 560px 이하에서는 `.jeju-table--stack`으로 행을 카드처럼 쌓고 `td[data-label]` 값을 제목으로 노출한다.
- 한 건의 상세를 여는 관리번호 같은 값은 `button.jeju-table__link`로 두고 사이드 패널을 연다. 버튼 이름은 "IC-2609128 상세 보기"처럼 대상을 드러내고 보이는 글자로 시작한다.

### Forms

- label을 항상 제공
- 오류는 border 색 + 오류 문구 + `aria-invalid` + `aria-describedby`
- placeholder는 보조 힌트일 뿐 라벨을 대체하지 않음
- 상태 계층: 기본 / hover / focus-visible / `[readonly]` / `:disabled` / `.is-error` / `.is-success`
- 구조: `.jeju-form` > `.jeju-form-section` > `.jeju-form-grid` > `.jeju-field`
- 관련 입력 묶음은 `.jeju-fieldset` + `<legend>`
- 제출 실패 시 `.jeju-error-summary`를 폼 위에 두고 각 오류를 해당 필드로 연결한다.

### Choice

- 체크박스/라디오는 `.jeju-choice` 안에서 네이티브 input을 사용한다.
- 카드형 선택지는 `.jeju-choice--card`
- 스위치는 `.jeju-switch`를 쓰고 켜짐/꺼짐을 `.jeju-switch__state` 문구로도 알린다.

### Chip

- 필터 토글은 `button.jeju-chip[aria-pressed]`
- 적용된 조건 제거는 `.jeju-chip--removable` + `.jeju-chip__remove`이며 제거 버튼에는 대상이 드러나는 접근성 이름을 준다.
- 칩 높이는 `--jeju-chip-h`, 제거 버튼은 `--jeju-chip-remove`(누르는 영역은 `--jeju-target-min`)를 따른다.

### Accordion / Tooltip / Menu

- 아코디언 제목은 heading 안의 버튼이고 `aria-expanded` / `aria-controls`로 패널을 제어한다. `data-jeju-accordion="single"`이면 한 번에 하나만 열린다.
- 툴팁은 보조 설명 전용이다. 필수 정보를 툴팁에만 두지 않는다.
- 드롭다운 메뉴는 `aria-haspopup="menu"` 버튼과 `role="menu"` 목록으로 구성한다.

### Date / Upload / Progress / Steps

- 날짜는 Tier 1에서 브라우저 기본 `input[type="date"]`를 쓰고 기간은 `.jeju-date-range`로 묶는다. 달력형 선택이 필요하면 React(Tier 2)의 `@jeju/jeju-date-picker`를 쓴다.
- 업로드는 `.jeju-upload`로 드래그 영역과 버튼을 함께 제공하고, 선택한 파일 목록과 개별 삭제를 노출한다.
- 진행률은 `role="progressbar"`와 숫자 텍스트를 함께 둔다.
- 단계는 `.jeju-steps`이며 완료·현재 단계·예정을 문구로도 전달한다. 동작하는 단계 이동은 `.jeju-wizard`로 감싼다.

### Loading · Error

- 목록 · 상세처럼 데이터를 받아 오는 자리는 `.jeju-async` + `data-jeju-async`로 감싸고 불러오는 중 · 오류 · 결과 없음 · 완료 네 상태를 미리 만든다(`data-jeju-async-view`). 한 번에 하나만 보인다.
- 불러오는 중: `.jeju-state` + 스피너 + 문구. 자리를 잡아 둘 때는 `.jeju-skeleton`을 더한다. 영역에는 `aria-busy="true"`가 붙는다.
- 오류: `.jeju-state--error` + 경고 아이콘 + 무엇이 안 됐는지 + 다음 행동(다시 시도 · 문의). 다시 시도 버튼은 `data-jeju-async-retry`이고 영역에 `jeju:retry` 이벤트를 보낸다.
- 결과 없음은 기존 `.jeju-empty`를 쓴다.
- 상태가 바뀌면 숨김 live 영역(`data-jeju-async-live`)이 보이는 상태의 `data-announce` 문구를 읽어 준다. 사라지는 버튼에 포커스가 있었으면 영역으로 포커스를 옮긴다.
- 서버에서 받아 오는 경우 `JejuDesign.load(영역, (signal) => …)`에 요청을 넘긴다. 상태 전환 · 다시 시도 · 이전 요청 취소를 함께 처리한다. 결과가 없으면 작업에서 `false`를 돌려준다.
- React는 `AsyncState` · `LoadingState` · `ErrorState`(`@jeju/jeju-async-state`), 표는 `DataTable`의 `loading` · `error`를 쓴다.

### Side Panel

- 목록을 떠나지 않고 한 건의 상세를 볼 때 `dialog.jeju-modal.jeju-modal--side`를 쓴다. 폭은 `--jeju-side-panel-w`(480px)이고 좁은 화면에서는 화면 폭 전체를 쓴다.
- 여닫기는 기존 모달 훅(`data-jeju-dialog-open` · `data-jeju-dialog-close`)을 그대로 쓴다. 포커스 가두기 · Esc · 연 버튼으로 포커스 복귀가 함께 동작한다.
- 내용은 `.jeju-detail-list`(`dl`: 항목 이름 · 값)로 둔다. 560px 이하에서는 이름 아래에 값을 둔다.
- 처리 버튼은 `.jeju-modal__foot`에 둔다. 긴 편집은 패널에서 하지 않고 별도 입력 화면으로 보낸다.
- React는 `DetailPanel` · `DetailList`(`@jeju/jeju-detail-panel`)를 쓴다.

### Server List

JSP 등 서버 템플릿이 한 페이지씩 그리는 목록이다. 기준 예제는 `design/examples/list.html`이다.

- 조회 조건 · 정렬 · 페이지 · 페이지 크기는 모두 주소의 조회 조건(`?district=…&sort=…&dir=…&size=…&page=…`)으로 주고받는다. 주소만으로 같은 화면을 다시 열 수 있어야 한다.
- 정렬: `th[aria-sort]` 안에 `a.jeju-table__sort` 링크. 링크 글자 뒤에 숨김 글자로 동작("오름차순으로 정렬")을 붙이고, 현재 정렬은 `aria-sort`와 아이콘(chevron-up/down, 미정렬은 sort)으로 알린다. 정렬을 바꾸면 1쪽으로 간다.
- 페이지: `nav.jeju-pagination` 안의 링크. 쪽 번호 링크는 `aria-label="2페이지"`, 현재 쪽은 `aria-current="page"`. 이전 · 다음이 없으면 `role="link" aria-disabled="true"`로 두고, 쪽이 많으면 `.jeju-pagination__gap`으로 줄인다.
- 조회 조건은 `form[method=get][role=search]`, 페이지 크기는 작은 GET 폼과 "적용" 버튼. 고르기만 해도 페이지가 바뀌게 하지 않는다.
- 링크와 폼 주소 끝에 목록 제목 앵커(`#목록제목id`)를 붙인다. 새로 그린 뒤 다음 Tab이 목록 안에서 시작한다.
- 결과 요약("총 57건 중 11–20건 · 요청일 내림차순")을 표 위에 두고, 문서 제목에 쪽 번호를 넣는다.
- 한 건의 상세는 `.jeju-table__link`로 사이드 패널을 열고, 패널 본문의 `data-jeju-async` 영역에서 `JejuDesign.load`로 불러온다. 서버가 행을 다시 그려도 여닫기 훅은 위임 처리라 그대로 동작한다.

### Print

- 인쇄하면 셸(GNB · LNB) · 버튼 모음 · 검색 폼 · 페이지 이동 · 선택 열 · 일괄 작업 바가 빠진다. 표는 가로 스크롤과 고정 헤더를 풀어 끝까지 펼치고 머리글 행을 쪽마다 반복한다.
- 화면에만 둘 요소는 `.jeju-no-print`, 인쇄에만 둘 요소는 `.jeju-print-only`. 인쇄물 첫 줄은 `.jeju-print-header`에 기관 · 조회 조건 · 출력 일시(`data-jeju-print-date`)를 둔다.
- 인쇄 버튼은 `data-jeju-print`. 상세 패널이 열려 있을 때 인쇄하면 패널 내용만 나온다.
- 상태 배지는 인쇄에서 배경이 빠져도 보이도록 테두리를 갖는다. 색만으로 상태를 전달하지 않는 원칙은 인쇄에서도 같다.
- 대민 화면은 알림 띠 · 메뉴 · 검색 · 푸터를 빼고 기관 식별을 남기며, 외부 링크 뒤에 주소를 적는다.
- React는 블록에 들어 있는 `print:` 유틸리티와 `jeju-theme`의 `@media print`가 같은 결과를 만든다.

### Shell

업무: `.jeju-gnb` + `.jeju-shell` + `.jeju-lnb` + `.jeju-main`

대민: `.jeju-masthead` + `.jeju-public-header` + `.jeju-public-main` + `.jeju-public-footer` + `.jeju-identifier`

경로 표시는 두 프로필 공통으로 `.jeju-breadcrumb`를 쓴다.

### Public Services

대민 서비스 화면에서 반복되는 패턴이다. 모두 `jeju-public.css`에 있고 React 블록이 같은 모양으로 대응한다.

- 서비스 검색 `.jeju-service-search`: 보이는 질문형 라벨 + 검색 상자 + 분류 칩(한 번에 하나) + 결과 수(`role="status"`) + 서비스 카드 목록 + 결과 없음 상태. 동작은 `data-jeju-service-search`.
- 신청 자격 확인 `.jeju-checklist`: 질문마다 `fieldset` + 예/아니요 라디오. 결과는 `.jeju-alert` 색(안내·가능·상담 필요)과 문구로 함께 알리고 맞지 않는 항목 이름을 밝힌다. 자가 확인이며 최종 판단이 아니라는 안내를 둔다. 동작은 `data-jeju-checklist`.
- 서식 내려받기 `.jeju-doc-list`: 문서명 · 형식 태그 · 크기 · 개정일 + 내려받기 버튼. 버튼 이름에 문서명과 형식·크기를 넣는다.
- 문의·방문 안내 `.jeju-contact`: 담당 부서 · 전화(tel:) · 운영 시간 · 주소를 `dl`로 두고 전화 걸기 · 지도 링크를 제공한다. 지도는 끼워 넣지 않고 외부 지도 서비스로 연결한다.
- 함께 찾는 서비스 `.jeju-related`: 관련 서비스 링크 목록.

## 5. Layout

- spacing: 4/8/12/16/20/24/32/40/48/64/80
- 업무 최대폭: 1320px, wide 1440px
- 대민 컨테이너: 1248px
- 상세 보기 사이드 패널 폭: `--jeju-side-panel-w`
- 겹치는 UI의 z-index는 `--jeju-z-sticky` → `--jeju-z-drawer` → `--jeju-z-menu` → `--jeju-z-tooltip` → `--jeju-z-toast` 순서만 사용한다.
- 모바일 기준 검증: 390px
- 표와 코드만 자체 스크롤, body 가로 스크롤은 금지

## 6. Accessibility

- KWCAG/WCAG AA 목표
- 일반 텍스트 4.5:1
- `:focus-visible` 유지
- `forced-colors` 대응
- `prefers-contrast`, `prefers-reduced-motion` 대응
- 색 단독 상태 전달 금지
- 키보드 조작 규약은 `docs/accessibility.md` 9절 참조

## 7. AI Prompt Guide

AI로 화면을 만들 때 다음 조건을 첫 지시문에 포함한다.

```text
Jeju Style UI·UX 디자인 가이드(DESIGN.md)를 따른다.
- 프로필: [업무|대민]
- 색은 var(--jeju-*) 토큰만 사용하고 새 HEX를 만들지 않는다.
- Blue가 주 구조색, Green/Orange는 역할 기반 보조색이다.
- 업무 화면은 고밀도 표/폼 중심, 대민은 48px 컨트롤과 쉬운 정보 구조를 사용한다.
- 기존 .jeju-* 컴포넌트를 먼저 조립하고 새 위젯을 만들지 않는다.
- 빈 상태·오류·로딩 상태를 함께 설계한다(.jeju-state · data-jeju-async).
- 서버가 한 페이지씩 그리는 목록은 design/examples/list.html처럼 정렬 · 페이지를 주소 링크로 만든다.
- 외부 폰트 CDN, 색 단독 상태표시, placeholder-only label을 사용하지 않는다.
- 작업 후 check_design.py로 검사한다.
```

React 화면이면 다음을 덧붙인다.

```text
- React 컴포넌트는 @jeju 레지스트리(components/ui, components/jeju-*)를 먼저 쓴다. shadcn 기본 레지스트리의 같은 이름 항목을 섞지 않는다.
- 아이콘은 @/components/ui/jeju-icons, 색은 bg-primary 같은 테마 변수나 var(--jeju-*)만 쓴다.
- 치수는 h-(--jeju-control-h)처럼 토큰으로 준다. bg-blue-500, bg-[#...], dark: 를 쓰지 않는다.
```

## 8. React (Tier 2)

React · Next.js · Vite + Tailwind CSS v4 서비스는 shadcn 레지스트리로 컴포넌트 소스를 복사 설치한다. 컴포넌트는 shadcn 공식 소스(Radix)에 제주 토큰을 입힌 것이라 API는 shadcn 문서와 같고, 모양은 Tier 1과 같다.

- 설치: `npx shadcn add @jeju/jeju-style` → 토큰 사본 · 테마 · 아이콘 · P0 UI 33종. 글꼴 선언은 `@jeju/jeju-fonts`
- 테마: shadcn 변수(`--primary`, `--border` …)는 모두 `var(--jeju-*)`로 연결한다. 다크 팔레트는 없다.
- 프로필: 컨트롤 높이·글자 크기가 토큰을 따르므로 `data-jeju-profile="public"`이 React 화면에도 적용된다.
- 변형 이름: Button은 Tier 1과 같게 `secondary`=Green strong, `accent`=Orange strong. Badge·Alert는 `info` · `success` · `warning` · `danger`(+ Badge `neutral`).
- 블록: 업무 셸, 페이지 머리, KPI, 행정용 데이터 표(서버 조회형 포함), 상세 보기 패널, 로딩·오류 상태, 날짜·기간 선택, 검색, 파일 업로드, 오류 요약, 단계·마법사, 대민 셸, 대민 서비스 5종.
- 인쇄: 셸 · 데이터 표 · 토스트에 `print:` 유틸리티가 들어 있고, `jeju-theme`의 전역 CSS가 열린 상세 패널만 인쇄한다.
- 기준 화면: `@jeju/jeju-example-work` · `jeju-example-form` · `jeju-example-public` · `jeju-example-gallery`
- 고치는 법과 규칙: `docs/react-registry.md` 7절. 생성은 `python tools/build_registry.py`, 검사는 J13~J16.

## 8-1. Standalone (망분리 전달용 단일 HTML)

`python tools/build_standalone.py`는 CSS · JS · 아이콘 sprite · 이미지를 HTML 한 파일에 넣는다. 서버 없이 열어도 같은 화면과 동작이 나오므로 망분리 기관에 화면 시안을 보내거나 검수용으로 전달할 때 쓴다. 생성물은 `dist/standalone/`이며 커밋하지 않는다. J17이 예제 4종의 자기완결성을 검사한다.

## 9. Extension Roadmap

v0.3.0에서 React/shadcn registry를, v0.4.0에서 대민 서비스 컴포넌트 · 터치 영역 기준 · standalone 생성기 · CI를, v0.5.0에서 로딩·오류 상태 · 상세 보기 사이드 패널 · 서버 조회형 표 · 글꼴 자체 호스팅 선언을, v0.6.0에서 서버 조회형 목록 패턴 · 불러오기 도우미 · 인쇄 스타일 · 토큰 문서 자동 생성을 추가했다. v0.7 이후 후보:

1. 실제 보조기술(NVDA · 센스리더 · VoiceOver) 검수, 실기기 Safari(iOS) 확인, Firefox 점검 결과 확인(CI 또는 런타임을 갖춘 PC)
2. 원격 저장소에서 CI 실제 실행
3. 글꼴 파일 반입 승인 뒤 부분 글꼴(subset) 생성 절차와 S8 WARN 해소
4. 공식 제주 CI 로고/파비콘 매핑
5. Tier 1 달력형 날짜 선택
6. 공문 · 신청서 등 A4 서식 출력 템플릿(인쇄 전용 레이아웃)
7. 토큰 문서를 예제 갤러리의 색 견본 · 치수 표와 연결
