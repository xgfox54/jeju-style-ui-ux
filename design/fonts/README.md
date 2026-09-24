# 글꼴 — Pretendard GOV 자체 호스팅

제주 디자인 시스템의 기본 글꼴은 `--jeju-font` 토큰의 첫 번째인 **Pretendard GOV**다. 망분리 환경에서도 같은 글꼴로 보이도록 외부 CDN 대신 기관 서버에 파일을 두고 `jeju-fonts.css`로 불러온다.

## 이 폴더에 둘 파일

| 파일 | 설명 |
|---|---|
| `jeju-fonts.css` | `@font-face` 선언(저장소에 포함) |
| `PretendardGOVVariable.woff2` | 가변 글꼴 파일(기관 승인 후 배치) |

파일을 두기 전에는 `local()`로 PC에 설치된 Pretendard GOV를 먼저 찾고, 없으면 토큰의 대체 글꼴(Noto Sans KR → 맑은 고딕)로 표시된다. 화면이 깨지지는 않는다.

## 배치 절차

1. Pretendard GOV 배포본에서 `PretendardGOVVariable.woff2`를 받는다. 배포처와 버전을 기관 내부 기록에 남긴다.
2. 라이선스(SIL Open Font License 1.1)를 확인하고, 라이선스 전문(`OFL.txt`)을 이 폴더에 함께 둔다.
3. 정보화 부서의 소프트웨어 반입 절차를 거친다.
4. 파일을 이 폴더에 두고 브라우저에서 글꼴이 바뀌는지 확인한다.
5. 용량을 줄이려면 한글 완성형 2,350자 + 영문·숫자·기호로 부분 글꼴(subset)을 만들어 같은 이름으로 바꿔 둘 수 있다.

## 불러오기

Tier 1(HTML · 서버 템플릿) — 토큰보다 먼저 둔다.

```html
<link rel="stylesheet" href="/design/fonts/jeju-fonts.css">
<link rel="stylesheet" href="/design/jeju-tokens.css">
```

Tier 2(React) — `npx shadcn add @jeju/jeju-fonts`가 `public/fonts/jeju-fonts.css`를 넣는다. 글꼴 파일을 `public/fonts/`에 두고 `index.html`(Next.js는 `app/layout.tsx`)에서 불러온다.

```html
<link rel="stylesheet" href="/fonts/jeju-fonts.css">
```

## 검사

- **J18**(정본): `jeju-fonts.css`가 외부 주소 없이 같은 폴더의 파일만 참조하고, `font-family`가 토큰의 첫 글꼴과 같으며, `font-display: swap`을 쓰는지 확인한다.
- **S8**(서비스): 서비스에 복사한 `jeju-fonts.css`가 참조하는 글꼴 파일이 실제로 있는지 확인한다. 없으면 WARN(대체 글꼴로 표시됨)이다.

저장소의 예제 HTML은 글꼴 파일이 없는 상태에서도 오류 없이 열리도록 `jeju-fonts.css`를 불러오지 않는다.
