# React 레지스트리 · 브라우저 검증

`verify-react.mjs`는 레지스트리를 설치한 소비 프로젝트에서 다음을 브라우저로 점검한다. CI(`.github/workflows/check.yml`)의 browser 작업도 같은 스크립트를 쓴다.

- React 기준 화면 4종(업무 목록 · 업무 폼 · 대민 · 갤러리), Tier 1 HTML 예제 5종, standalone 단일 HTML 5종의 가로 넘침(390 · 768 · 1024 · 1440 · 1920)
- 프로필 치수(업무 36px·14px, 대민 48·56px·17px, 대민 작은 버튼 · 칩 44px, 도움말 · 배지 13px), 표 헤더, 포커스 링 토큰
- 누를 수 있는 영역: 업무 WCAG 24px(간격 예외), 대민 KRDS 44px
- 정렬 · 행 선택 · 메뉴 · 드로어 · 모달 · 확인 대화상자 · 툴팁 · 탭 · 아코디언 · 오류 요약 · 마법사의 키보드와 ARIA
- 대민 서비스 검색 · 자격 확인 · 서식 내려받기(React · Tier 1 · standalone)
- 상세 패널 · 로딩·오류 상태 · 서버 조회형 표(React), 서버 목록의 정렬 · 페이지 링크 · 조건 검색 · 상세 불러오기(Tier 1 · standalone)
- 인쇄 모양(`emulateMedia print`): Tier 1 목록 · 상세 패널 · 업무 예제 · 대민, React 업무 예제 · 상세 패널
- standalone 파일을 네트워크 없이 file://로 열었을 때 아이콘 · CSS · JS · 외부 요청 0
- 주요 색 조합 대비, Windows 고대비(forced-colors) 스크린샷, 콘솔 오류·경고

## 준비 — 소비 프로젝트 만들기

`prepare-consumer.mjs`가 CI와 같은 절차를 수행한다. 저장소 루트에서 레지스트리를 먼저 서빙한다(`python -m http.server 8765`).

```bash
npx shadcn@latest init -t vite -b radix -p nova -n consumer --no-monorepo -y
node <저장소>/tools/e2e/prepare-consumer.mjs registry consumer
cd consumer
npx shadcn add @jeju/jeju-style -y -o
npx shadcn add $(node <저장소>/tools/e2e/prepare-consumer.mjs items) -y -o
node <저장소>/tools/e2e/prepare-consumer.mjs finish .
npm i -D playwright
```

`finish`는 전역 CSS에 토큰 import를 넣고, `.dark` 팔레트 · Geist 글꼴 · Vite 템플릿의 다크 모드 ThemeProvider를 지우고, `App.tsx`(`#/work` · `#/form` · `#/public` · `#/gallery`)와 `verify-react.mjs`를 복사한다.

## 실행

```bash
# 저장소 루트: 레지스트리 · Tier 1 예제 서빙, standalone 생성
python tools/build_standalone.py
python -m http.server 8765
# 소비 프로젝트
npx tsc -b && npx vite build
npx vite preview --port 4173 --strictPort
JEJU_STANDALONE_DIR=<저장소>/dist/standalone node verify-react.mjs
```

기본 브라우저는 설치된 Microsoft Edge다. `JEJU_BROWSER=chrome` 또는 `JEJU_BROWSER=chromium`(Playwright 내장, `npx playwright install chromium` 필요)으로 바꿀 수 있다. 주소는 `JEJU_APP_URL`, `JEJU_TIER1_URL`로 바꾼다.

결과는 `shots/`에 스크린샷과 `results.json`으로 남고, 실패가 있으면 종료 코드가 1이다.

## 다른 브라우저

`verify-browsers.mjs`는 같은 환경(4173 · 8765)을 Firefox · WebKit(Safari 엔진)으로 열어 핵심만 다시 본다. 넘침(390 · 1440), 프로필 치수, 상세 패널 · 메뉴 키보드, 서버 목록, 상세 불러오기와 다시 시도 포커스, 대민 서비스 검색, React 정렬 · 인쇄 · 로딩·오류 상태다.

```bash
npx playwright install firefox webkit
node verify-browsers.mjs                      # 기본 firefox,webkit
JEJU_ENGINES=webkit node verify-browsers.mjs  # 하나만
```

WebKit은 버튼을 눌러도 포커스를 주지 않으므로 키보드 동작은 `focus()` 뒤 Enter로 확인한다. 결과는 `shots/browsers/`에 남는다. Windows에서 Firefox가 "side-by-side configuration" 오류로 뜨지 않으면 Visual C++ 재배포 패키지가 필요하다. CI(Ubuntu)는 두 엔진을 모두 돌린다.
