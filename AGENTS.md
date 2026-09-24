# AGENTS.md

이 저장소에서 UI를 만들거나 수정하는 코딩 에이전트는 다음 순서를 따른다.

1. `docs/contract.md`와 `DESIGN.md`를 먼저 읽는다.
2. 화면을 업무(work) 또는 대민(public) 프로필로 분류한다.
3. 기준 예제를 고른다. 목록은 `design/examples/work.html`, 서버가 한 페이지씩 그리는 목록은 `design/examples/list.html`, 입력은 `design/examples/form.html`, 대민은 `design/examples/public.html`, 개별 컴포넌트는 `design/examples/index.html`이다.
4. 값은 `design/jeju-tokens.css`의 `--jeju-*` 토큰을 사용한다.
5. 기존 `.jeju-*` 컴포넌트를 우선 재사용한다. 인벤토리는 `design/components.tsv`다.
6. 동적 UI는 `design/jeju-behaviors.js`의 `data-jeju-*` 훅을 재사용하고 같은 동작을 새로 구현하지 않는다.
7. 제주 브랜드 원색 3종을 서비스 코드에 하드코딩하지 않는다.
8. 외부 폰트/CDN을 필수 의존성으로 추가하지 않는다.
9. 접근성 포커스, label, 키보드 조작, 빈 상태·로딩·오류 상태(`.jeju-state` · `data-jeju-async`)를 함께 구현한다.
10. 변경 후 `npm run check:all`을 실행한다.
11. 서비스 적용 시 `python design/check_design.py --gate <서비스경로>`를 실행한다.
12. 누를 수 있는 요소는 업무 24px(간격 예외 허용), 대민 44px 이상이다. 치수는 `--jeju-target-min` · `--jeju-control-h-sm` 등 토큰으로 준다.
13. 글꼴은 `design/fonts/jeju-fonts.css`로 자체 호스팅한다. 글꼴 파일은 기관 반입 승인 대상이므로 임의로 내려받아 커밋하지 않는다(J18 · S8).
14. 토큰 파일을 바꾸면 `python tools/build_token_docs.py`로 `docs/tokens.md`를 다시 만든다(J19). 이 문서는 직접 고치지 않는다.
15. 화면을 만들면 인쇄 모양도 확인한다. 조작 요소는 인쇄에서 빠지고(`.jeju-no-print`, React `print:hidden`), 조회 조건 · 출력 일시는 남긴다.

React · Next.js · Vite 서비스는 Tier 1 CSS 대신 `@jeju` shadcn 레지스트리(Tier 2)를 쓴다. 절차는 `docs/react-registry.md`다. 이때 6번의 `data-jeju-*` 훅 대신 레지스트리 컴포넌트(Radix)가 동작을 맡는다.

레지스트리(`registry/jeju/`)를 고칠 때:

- 소스를 고친 뒤 `python tools/build_registry.py`로 `registry.json` · `public/r` · `jeju-icons.tsx`를 다시 생성하고 생성물도 함께 커밋한다.
- `registry/jeju/ui/jeju-icons.tsx`는 직접 고치지 않는다. `design/jeju-icons.svg`를 고친 뒤 생성한다.
- 색은 테마 변수나 `var(--jeju-*)`만, 치수는 `h-(--jeju-control-h)` 같은 토큰으로 준다. hex · Tailwind 기본 팔레트 · `dark:` · `lucide-react`를 쓰지 않는다(J14).
- 새 항목은 `tools/build_registry.py`의 `META`와 `design/components.tsv`의 `react` 열에 함께 등록한다(J16).

standalone(`tools/build_standalone.py`)은 예제·서비스 화면을 단일 HTML로 만든다. 예제 HTML이나 정본 CSS·JS를 바꾸면 `python tools/build_standalone.py --check`(J17)가 통과하는지 확인한다. 생성물 `dist/`는 커밋하지 않는다.

CI(`.github/workflows/check.yml`)와 로컬 브라우저 검증은 `tools/e2e/prepare-consumer.mjs`로 같은 소비 프로젝트를 만든다. 절차를 바꾸면 두 곳이 어긋나지 않게 이 스크립트를 고친다.

새 컴포넌트를 추가할 때는 CSS, 접근성·키보드 규약, 예제, `design/components.tsv`, `DESIGN.md`, 필요 시 `design/jeju-behaviors.js`를 함께 갱신한다. 인벤토리와 정본 CSS, 아이콘 sprite 참조는 검사기 J11·J12가 검증한다.
공통 컴포넌트를 추가하거나 바꾸면 React 레지스트리에 대응 항목이 필요한지도 함께 검토한다.

공통 규칙을 바꿀 때는 `docs/contract.md`, `DESIGN.md`, 예제, 검사기 간 의미가 어긋나지 않게 함께 갱신한다.
