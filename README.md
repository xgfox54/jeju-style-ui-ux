# Jeju Style UI·UX 디자인 가이드

제주특별자치도 업무·대민 웹서비스가 함께 쓰는 공통 디자인 시스템(표준안)이다. **디자인 토큰 · 공통 컴포넌트 · 동작 · 접근성 규칙 · 검사기 · AI 작업 지침**을 담는다. 파일·패키지 이름은 `Jejustyle_UIUX`다.

서비스에는 두 가지 방식으로 붙는다. JSP·Jinja2·정적 HTML은 **Tier 1**(CSS 클래스 + 의존성 없는 JS)을, React·Next.js·Vite + Tailwind CSS v4는 **Tier 2**(shadcn 레지스트리로 컴포넌트 소스 복사 설치)를 쓴다. 두 방식 모두 값은 `design/jeju-tokens.css` 하나에서 온다.

경기도의회 `gyeonggi-council/ggc-design-system`의 구조와 운영 원칙을 참고했지만, 브랜드·토큰명·컴포넌트명·문서는 제주특별자치도용으로 독립 설계했다.

## 받기

```bash
git clone https://gitlab.aigov.go.kr/memory365/jeju-style-ui-ux.git Jejustyle_UIUX
cd Jejustyle_UIUX
npm run check:all        # Python 3만 있으면 된다(외부 패키지 없음)
```

## 핵심 브랜드 컬러

| 역할 | HEX | RGB | 사용 원칙 |
|---|---:|---:|---|
| Jeju Blue | `#0173BC` | `1, 115, 188` | 주 브랜드, 링크, Primary |
| Jeju Green | `#00A074` | `0, 160, 116` | 자연·완료·긍정 계열 브랜드 강조 |
| Jeju Orange | `#F18101` | `241, 129, 1` | 포인트·주의·강조 |

세 색상은 **브랜드 원색 토큰으로 그대로 보존**한다. 다만 WCAG/KWCAG 텍스트 대비 때문에 Green/Orange의 흰 글자용 파생색을 별도 semantic token으로 사용한다.

- `--jeju-green-dark: #008762` — 흰색 대비 약 4.52:1
- `--jeju-orange-dark: #B46101` — 흰색 대비 약 4.52:1
- `--jeju-blue: #0173BC` — 흰색 대비 약 5.02:1

브랜드 원색을 임의로 교체한 것이 아니라 **원색과 접근성용 역할색을 분리**한 구조다.

## 구조

```
Jejustyle_UIUX/
├─ design/
│  ├─ jeju-tokens.css        # 값의 단일 원천
│  ├─ jeju-components.css    # 공통 컴포넌트 · 폼 시스템 · 표 확장
│  ├─ jeju-public.css        # 대민 셸
│  ├─ jeju-behaviors.js      # 탭·모달·드로어·아코디언·툴팁·메뉴·표·업로드·마법사·로딩 상태
│  ├─ jeju-icons.svg         # 공통 SVG 아이콘 sprite (39종)
│  ├─ fonts/                 # Pretendard GOV 자체 호스팅 선언(jeju-fonts.css)과 반입 절차
│  ├─ components.tsv         # 컴포넌트 인벤토리
│  ├─ check_design.py        # 디자인 규칙 검사기
│  └─ examples/
│     ├─ index.html          # 컴포넌트 갤러리
│     ├─ work.html           # 업무시스템 실물 예제(행정용 확장 표)
│     ├─ list.html           # 서버 조회형 목록 예제(JSP 등 서버 템플릿: 정렬·페이지 링크, 상세 불러오기, 인쇄)
│     ├─ form.html           # 업무 폼 시스템 실물 예제
│     └─ public.html         # 대민서비스 실물 예제(신청 마법사·FAQ)
├─ docs/
│  ├─ contract.md            # AUTHORITATIVE 운영 계약
│  ├─ krds-alignment.md      # KRDS 정렬 원칙
│  ├─ accessibility.md       # 색 대비·키보드·폼·컴포넌트 ARIA 기준
│  ├─ adoption-checklist.md  # 서비스 적용·검수 체크리스트
│  ├─ tokens.md              # 토큰 표(생성물: 업무·대민 값, 흰색 대비)
│  └─ react-registry.md      # React/shadcn 레지스트리(Tier 2) 안내
├─ registry/jeju/
│  ├─ ui/                    # shadcn 공식 소스 + 제주 토큰 (34종, jeju-icons.tsx는 생성물)
│  ├─ blocks/                # 업무 셸 · 데이터 표 · 상세 패널 · 로딩 상태 · 대민 서비스 등 19종
│  └─ examples/              # React 기준 화면 4종
├─ public/r/                 # 레지스트리 생성물(정적 서빙 대상, 커밋한다)
├─ tools/
│  ├─ build_registry.py      # 레지스트리 빌더(표준 라이브러리만 사용)
│  ├─ build_standalone.py    # 단일 HTML 생성기(망분리 전달용)
│  ├─ build_token_docs.py    # 토큰 문서 생성기(docs/tokens.md)
│  └─ e2e/                   # 브라우저 검증 · 소비 프로젝트 준비 스크립트
├─ .github/workflows/        # CI: 정적 검사 + 브라우저 검증
├─ registry.json             # 레지스트리 색인(생성물)
├─ skills/
│  └─ jeju-design/
│     └─ SKILL.md            # Codex/AI 작업 지침
├─ AGENTS.md                 # 저장소 기본 에이전트 규칙
├─ CHANGELOG.md              # 버전 이력
└─ DESIGN.md                 # AI 디자인 컨텍스트
```

## 빠른 시작

### Tier 1 — HTML · 서버 템플릿

HTML/JSP/Jinja/FastAPI 정적 템플릿 등에서는 아래 순서로 로드한다.

```html
<link rel="stylesheet" href="/design/jeju-tokens.css">
<link rel="stylesheet" href="/design/jeju-components.css">
<link rel="stylesheet" href="/app.css">
<script src="/design/jeju-behaviors.js" defer></script>
```

기관 승인을 받아 글꼴 파일을 둔 서비스는 토큰보다 먼저 `/design/fonts/jeju-fonts.css`를 불러온다. 파일이 없어도 대체 글꼴로 정상 표시된다. 절차는 `design/fonts/README.md`에 있다.

대민 페이지는 다음 프로필을 사용한다.

```html
<html lang="ko" data-jeju-profile="public">
<link rel="stylesheet" href="/design/jeju-public.css">
```

업무 화면은 속성을 붙이지 않는다.

공통 SVG 아이콘은 같은 출처의 sprite를 사용한다.

```html
<svg class="jeju-icon" aria-hidden="true">
  <use href="/design/jeju-icons.svg#jeju-icon-search"></use>
</svg>
```

실물 예제는 빌드 없이 다음 파일을 열어 확인할 수 있다. SVG sprite 참조 때문에 `file://` 대신 간단한 정적 서버로 여는 것을 권장한다.

```bash
python -m http.server 8777
```

- `design/examples/index.html` — 컴포넌트·토큰 갤러리
- `design/examples/work.html` — 행정 업무시스템 목록 화면
- `design/examples/list.html` — 서버가 한 페이지씩 그리는 목록(JSP 등). 정렬 · 페이지 이동이 주소 링크이고, 상세 패널이 서버에서 불러오는 상태를 보여 준다
- `design/examples/form.html` — 업무 폼 시스템
- `design/examples/public.html` — 대민 공공서비스

### Tier 2 — React · Next.js · Vite

이 저장소 루트를 정적 서버로 띄우고(`npm run registry:serve` 또는 `python -m http.server 8765`), 서비스의 `components.json`에 레지스트리를 등록한다.

```jsonc
{ "registries": { "@jeju": "http://<내부호스트>:8765/public/r/{name}.json" } }
```

```bash
npx shadcn add @jeju/jeju-style -o                   # 토큰 · 테마 · 아이콘 · P0 컴포넌트 33종 (init이 만든 기본 button.tsx를 덮어쓴다)
npx shadcn add @jeju/jeju-shell @jeju/jeju-data-table  # 필요한 블록
npx shadcn add @jeju/jeju-fonts                        # 글꼴 선언(public/fonts/jeju-fonts.css). 글꼴 파일은 승인 뒤 둔다
```

그다음 전역 CSS에 `@import "../styles/jeju-tokens.css" layer(base);`를 넣고 프리셋의 `.dark` 팔레트를 지운다. 자세한 절차와 shadcn 기본과 다른 점은 `docs/react-registry.md`에 있다.

### 단일 HTML(standalone) — 망분리 전달용

```bash
python tools/build_standalone.py                              # design/examples 4종 → dist/standalone/
python tools/build_standalone.py 화면.html --out 전달폴더       # 서비스 화면을 한 파일로
```

CSS · JS · 아이콘 sprite · 이미지가 HTML 한 파일에 들어가므로 서버 없이 더블클릭으로 열어도 같은 화면과 동작이 나온다.

## 공통 동작

`design/jeju-behaviors.js`는 의존성 없는 순수 JS이며 `window.JejuDesign`으로 노출된다.

- 탭, 모달(상세 보기 사이드 패널 포함), 드로어, 디스클로저
- 아코디언, 툴팁, 드롭다운 메뉴
- 스위치 상태 문구, 칩 토글·제거
- 표 정렬, 표 행 선택과 일괄 작업 바
- 파일 업로드 목록과 드래그 앤 드롭
- 단계 마법사
- 데이터를 받아 오는 영역의 상태(불러오는 중 · 오류 · 결과 없음 · 완료): `JejuDesign.setAsyncState(영역, 상태)`, 다시 시도는 `jeju:retry` 이벤트
- 서버에서 불러오기: `JejuDesign.load(영역, (signal) => fetch(...))` — 상태 전환 · 다시 시도 · 늦게 온 이전 응답 무시를 함께 처리한다
- 인쇄: `data-jeju-print`(인쇄 창 열기), `data-jeju-print-date`(출력 일시)
- 대민 서비스 검색(검색어 · 분류 칩 · 결과 수), 신청 자격 확인(예/아니요 → 결과 안내)
- `JejuDesign.toast(message)`, `JejuDesign.confirm(options)`

모달 여닫기(`data-jeju-dialog-open` · `data-jeju-dialog-close`)는 문서에서 위임 처리하므로, 서버가 목록 행을 다시 그려도 새 버튼이 그대로 동작한다.

인쇄하면 셸 · 버튼 · 검색 폼 · 페이지 이동이 빠지고 표는 끝까지 펼쳐진다. 화면에만 둘 요소는 `.jeju-no-print`, 인쇄에만 둘 요소(기관 · 조건 · 출력 일시)는 `.jeju-print-only`로 표시한다. 상세 패널이 열려 있으면 패널 내용만 인쇄된다.

## 관통 원칙

1. **값의 원천은 `design/jeju-tokens.css` 하나다.**
2. 서비스에서는 HEX 값을 복사하지 않고 `var(--jeju-*)`를 사용한다.
3. 제주 브랜드 3색은 원색 토큰으로 보존한다.
4. 접근성 때문에 필요한 경우 원색을 바꾸지 않고 별도 semantic strong 토큰을 둔다.
5. 업무 프로필은 고밀도·표/폼 중심, 대민 프로필은 KRDS 계열 크기와 접근성 패턴을 따른다.
6. 외부 폰트 CDN에 의존하지 않는다. 망분리 환경에서도 깨지지 않아야 한다.
7. 색 단독으로 상태를 표현하지 않는다.
8. `:focus-visible`을 제거하지 않는다.
9. AI가 UI를 생성해도 임의 색상·임의 spacing을 추가하지 않고 디자인 토큰을 사용한다.

## 검사

```bash
python design/check_design.py --canon
python design/check_design.py --report <서비스경로>
python design/check_design.py --gate <서비스경로>
python tools/build_registry.py         # React 레지스트리 생성
python tools/build_standalone.py       # 단일 HTML 생성
python tools/build_token_docs.py       # 토큰 문서(docs/tokens.md) 생성
npm run check:all
```

정본 검사 규칙은 J1~J19이다. 필수 파일, 브랜드 원색 고정, 역할색 대비, 대민 프로필 경계, 토큰 사용, 포커스 규칙, 문서·CSS의 미정의 토큰 참조, 예제 자산 경로, 프로필 혼용에 더해 다음을 확인한다.

- **J11** `components.tsv`에 선언한 클래스가 정본 CSS에 실제로 존재하는지
- **J12** 예제가 참조하는 SVG sprite 심볼이 `jeju-icons.svg`에 존재하는지
- **J13** React 레지스트리 생성물(`registry.json`, `public/r`, `jeju-icons.tsx`)이 소스와 같은지
- **J14** 레지스트리 소스에 hex · Tailwind 기본 팔레트 · `dark:` · lucide · 미정의 토큰이 없는지
- **J15** shadcn 테마 변수가 모두 정의된 `var(--jeju-*)` 토큰으로 연결되는지
- **J16** `components.tsv`의 react 열과 레지스트리 항목이 서로 맞는지
- **J17** 예제가 모두 로컬 참조 없는 단일 HTML로 만들어지는지
- **J18** 글꼴 선언(`design/fonts/jeju-fonts.css`)이 외부 주소 없이 같은 폴더만 참조하고, 글꼴 이름이 토큰의 첫 글꼴과 같으며, `font-display: swap`을 쓰는지
- **J19** 토큰 문서(`docs/tokens.md`)가 토큰 파일에서 만든 결과와 같은지

서비스 검사(`--gate`)는 색 리터럴(S1), 외부 CDN(S2), 포커스 제거(S3), CSS 순서(S4), 대민 CSS(S5)에 더해, React 프로젝트의 토큰 사본 일치(S6), 전역 CSS 설정(S7), 글꼴 파일 존재(S8, 없으면 WARN)를 확인한다.

브라우저 검증(`tools/e2e/`)은 화면 넘침, 프로필 치수, 키보드·ARIA, 대비, 누를 수 있는 영역(업무 24px · 대민 44px), 상세 패널 · 로딩·오류 상태 · 서버 조회형 표와 서버 목록의 동작과 포커스, 인쇄 모양, standalone 파일을 확인한다. 정적 검사와 브라우저 검증의 전체 절차는 `.github/workflows/check.yml`(GitHub Actions 형식)에 적어 두었다. 다른 CI나 로컬에서도 같은 명령을 차례로 실행하면 된다.

## 현재 단계

**v0.6.0 — server lists · print · token docs**

v0.5.0 위에 다음을 추가했다.

- 서버 조회형 목록 기준 예제(`list.html`): 주소로 주고받는 정렬 · 페이지 · 조건, 목록 제목 앵커로 키보드 위치 유지
- 불러오기 도우미 `JejuDesign.load`와 모달 여닫기 이벤트 위임
- 인쇄 스타일(Tier 1 · 대민 · React)과 인쇄 훅, 열린 상세 패널만 인쇄
- 토큰 문서 자동 생성(`docs/tokens.md`)과 검사 규칙 J19
- 다른 브라우저 점검(`tools/e2e/verify-browsers.mjs`, WebKit 13/13 통과)과 그 과정에서 찾은 Tier 1 입력 높이 차이 수정

v0.5.0에서는 로딩·오류 상태, 상세 보기 사이드 패널, React 서버 조회형 데이터 표, 글꼴 자체 호스팅 선언(J18 · S8)을 추가했다. v0.4.0에서는 누를 수 있는 영역 기준(업무 WCAG 24px · 대민 KRDS 44px)과 대민 가장 작은 글자 13px, 대민 서비스 컴포넌트 5종, standalone 생성기(J17), GitHub Actions CI를, v0.3.0에서는 shadcn 레지스트리 · 레지스트리 빌더 · 검사 규칙 J13~J16 · S6·S7을, v0.2.0에서는 아코디언 · 툴팁 · 스위치 · 체크박스 · 라디오 · 칩 · 메뉴 · 날짜 · 업로드 · 진행률 · 마법사, 업무 폼 시스템, 행정용 표, 아이콘 39종을 추가했다.

글꼴 파일 반입 승인, 공식 CI 로고·파비콘 파생물, 실제 보조기술 검수, 원격 CI 실행, Tier 1 달력형 날짜 선택은 다음 단계 후보다.

## 참고

구조적 참고: https://github.com/gyeonggi-council/ggc-design-system

이 프로젝트는 제주특별자치도의 공식 배포본이라는 지위를 자동으로 갖지 않는다. 실제 기관 표준으로 사용하려면 CI 원본·접근성 검증·기관 내부 승인 절차를 거쳐야 한다.
