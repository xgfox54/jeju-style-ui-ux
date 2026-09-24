# 디자인 토큰 목록

> 자동 생성 문서다. `tools/build_token_docs.py`가 `design/jeju-tokens.css`(v0.5.0)에서 만든다. 직접 고치지 않는다. 값을 바꾸려면 토큰 파일을 고친 뒤 `python tools/build_token_docs.py`를 실행한다. 검사 규칙 J19가 이 문서와 토큰 파일이 같은지 확인한다.

- 토큰 131개. 대민 프로필(`data-jeju-profile="public"`)에서 값이 바뀌는 토큰 35개, 고대비 설정에서 바뀌는 토큰 5개
- 대민 열이 비어 있으면 업무와 같은 값이다. 대민 프로필은 색을 바꾸지 않고 치수와 글자 크기만 바꾼다.
- 흰색 대비는 그 색과 흰색(`#ffffff`)의 명도 대비다. 흰 배경 위 글자나 그 색 위의 흰 글자에 쓸 수 있는지 판단할 때 본다. 일반 크기 글자는 4.5:1 이상이어야 한다.
- 서비스 코드에서는 값을 복사하지 않고 `var(--jeju-*)`로 참조한다.

## 1. 제주 브랜드 원색

변경 시 기관 CI 근거가 필요하다.

| 토큰 | 업무(기본) | 대민 | 흰색 대비 | 설명 |
|---|---|---|---:|---|
| `--jeju-blue` | `#0173bc` |  | 5.02:1 | RGB 1, 115, 188 · white contrast ≈ 5.02:1 |
| `--jeju-green` | `#00a074` |  | 3.34:1 | RGB 0, 160, 116 · white contrast ≈ 3.34:1 |
| `--jeju-orange` | `#f18101` |  | 2.66:1 | RGB 241, 129, 1 · white contrast ≈ 2.66:1 |

## 2. 브랜드 tint / hover

| 토큰 | 업무(기본) | 대민 | 흰색 대비 | 설명 |
|---|---|---|---:|---|
| `--jeju-blue-dark` | `#005f9d` |  | 6.72:1 |  |
| `--jeju-blue-deep` | `#004f83` |  | 8.58:1 |  |
| `--jeju-blue-light` | `#eaf4fb` |  | 1.12:1 |  |
| `--jeju-blue-light-strong` | `#d6eaf7` |  | 1.24:1 |  |
| `--jeju-green-dark` | `#008762` |  | 4.52:1 | white contrast ≈ 4.52:1 |
| `--jeju-green-deep` | `#006f51` |  | 6.19:1 |  |
| `--jeju-green-light` | `#e7f7f2` |  | 1.11:1 |  |
| `--jeju-green-light-strong` | `#cfefe5` |  | 1.23:1 |  |
| `--jeju-orange-dark` | `#b46101` |  | 4.52:1 | white contrast ≈ 4.52:1 |
| `--jeju-orange-deep` | `#965100` |  | 6.05:1 |  |
| `--jeju-orange-light` | `#fff3e4` |  | 1.09:1 |  |
| `--jeju-orange-light-strong` | `#ffe5c2` |  | 1.22:1 |  |

## 3. semantic aliases

앱은 가능하면 이 역할 토큰을 우선 사용한다.

| 토큰 | 업무(기본) | 대민 | 흰색 대비 | 설명 |
|---|---|---|---:|---|
| `--jeju-primary` | `var(--jeju-blue)` → `#0173bc` |  | 5.02:1 |  |
| `--jeju-primary-hover` | `var(--jeju-blue-dark)` → `#005f9d` |  | 6.72:1 |  |
| `--jeju-primary-active` | `var(--jeju-blue-deep)` → `#004f83` |  | 8.58:1 |  |
| `--jeju-primary-tint` | `var(--jeju-blue-light)` → `#eaf4fb` |  | 1.12:1 |  |
| `--jeju-secondary` | `var(--jeju-green)` → `#00a074` |  | 3.34:1 |  |
| `--jeju-secondary-strong` | `var(--jeju-green-dark)` → `#008762` |  | 4.52:1 |  |
| `--jeju-secondary-tint` | `var(--jeju-green-light)` → `#e7f7f2` |  | 1.11:1 |  |
| `--jeju-accent` | `var(--jeju-orange)` → `#f18101` |  | 2.66:1 |  |
| `--jeju-accent-strong` | `var(--jeju-orange-dark)` → `#b46101` |  | 4.52:1 |  |
| `--jeju-accent-tint` | `var(--jeju-orange-light)` → `#fff3e4` |  | 1.09:1 |  |

## 4. 상태색

| 토큰 | 업무(기본) | 대민 | 흰색 대비 | 설명 |
|---|---|---|---:|---|
| `--jeju-success` | `#008762` |  | 4.52:1 |  |
| `--jeju-success-tint` | `#e7f7f2` |  | 1.11:1 |  |
| `--jeju-info` | `#0173bc` |  | 5.02:1 |  |
| `--jeju-info-tint` | `#eaf4fb` |  | 1.12:1 |  |
| `--jeju-warning` | `#a45500` |  | 5.42:1 |  |
| `--jeju-warning-tint` | `#fff3e4` |  | 1.09:1 |  |
| `--jeju-danger` | `#c43131` |  | 5.48:1 |  |
| `--jeju-danger-tint` | `#fdeaea` |  | 1.16:1 |  |

## 5. 폼 상태 역할색

비활성/읽기전용/반전 표면

| 토큰 | 업무(기본) | 대민 | 흰색 대비 | 설명 |
|---|---|---|---:|---|
| `--jeju-disabled-bg` | `#eef1f4` |  | 1.13:1 |  |
| `--jeju-disabled-border` | `#dbe2e8` |  | 1.31:1 |  |
| `--jeju-disabled-text` | `#59646f` |  | 6.04:1 |  |
| `--jeju-readonly-bg` | `#f2f5f7` |  | 1.09:1 |  |
| `--jeju-inverse-surface` | `#1f2933` |  | 14.76:1 |  |
| `--jeju-inverse-text` | `#ffffff` |  | 1.00:1 |  |
| `--jeju-on-fill` | `#ffffff` |  | 1.00:1 | Blue·strong 역할색·Danger 채움 위 글자 |

## 6. 텍스트

| 토큰 | 업무(기본) | 대민 | 흰색 대비 | 설명 |
|---|---|---|---:|---|
| `--jeju-text-strong` | `#151b23` |  | 17.31:1 |  |
| `--jeju-text` | `#1f2933` |  | 14.76:1 |  |
| `--jeju-text-body` | `#344354` |  | 10.11:1 |  |
| `--jeju-text-muted` | `#4e5f70` |  | 6.57:1 |  |
| `--jeju-text-subtle` | `#5d6d7c` |  | 5.32:1 |  |
| `--jeju-text-faint` | `#8a97a5` |  | 2.98:1 | 일반 텍스트 금지: 장식/아이콘/구분선용 |

## 7. 면과 선

| 토큰 | 업무(기본) | 대민 | 흰색 대비 | 설명 |
|---|---|---|---:|---|
| `--jeju-bg` | `#f2f5f7` |  | 1.09:1 |  |
| `--jeju-surface` | `#ffffff` |  | 1.00:1 |  |
| `--jeju-surface-inset` | `#f7f9fa` |  | 1.06:1 |  |
| `--jeju-control-bg` | `#f5f7f9` |  | 1.07:1 |  |
| `--jeju-row-hover` | `#f8fbfd` |  | 1.04:1 |  |
| `--jeju-border` | `#e1e7eb` |  | 1.25:1 |  |
| `--jeju-border-strong` | `#cfd8df` |  | 1.44:1 |  |
| `--jeju-shell-border` | `#dbe3e8` |  | 1.30:1 |  |
| `--jeju-hairline` | `#edf1f3` |  | 1.14:1 |  |

## 8. 타이포

| 토큰 | 업무(기본) | 대민 | 설명 |
|---|---|---|---|
| `--jeju-font` | `"Pretendard GOV", Pretendard, "Noto Sans KR", "Malgun Gothic", system-ui, -apple-system, BlinkMacSystemFont, sans-serif` |  |  |
| `--jeju-font-mono` | `ui-monospace, "Cascadia Mono", Consolas, "D2Coding", Menlo, monospace` |  |  |
| `--jeju-text-xs` | `12px` | `13px` | 대민: KRDS 가장 작은 글자(xsmall) |
| `--jeju-text-sm` | `13px` | `15px` |  |
| `--jeju-text-base` | `14px` | `17px` |  |
| `--jeju-text-md` | `16px` | `19px` |  |
| `--jeju-text-lg` | `18px` | `20px` |  |
| `--jeju-text-xl` | `20px` | `24px` |  |
| `--jeju-text-2xl` | `24px` | `32px` |  |
| `--jeju-text-3xl` | `30px` | `40px` |  |
| `--jeju-leading-tight` | `1.25` |  |  |
| `--jeju-leading-normal` | `1.5` |  |  |
| `--jeju-h1-size` | `var(--jeju-text-2xl)` → `24px` | → `32px` |  |
| `--jeju-h2-size` | `var(--jeju-text-lg)` → `18px` | → `20px` |  |
| `--jeju-h3-size` | `var(--jeju-text-md)` → `16px` | → `19px` |  |
| `--jeju-kpi-size` | `var(--jeju-text-3xl)` → `30px` | → `40px` |  |

## 9. spacing

임의 중간값 대신 이 스케일을 우선한다.

| 토큰 | 업무(기본) | 대민 | 설명 |
|---|---|---|---|
| `--jeju-space-1` | `4px` |  |  |
| `--jeju-space-2` | `8px` |  |  |
| `--jeju-space-3` | `12px` |  |  |
| `--jeju-space-4` | `16px` |  |  |
| `--jeju-space-5` | `20px` |  |  |
| `--jeju-space-6` | `24px` |  |  |
| `--jeju-space-7` | `32px` |  |  |
| `--jeju-space-8` | `40px` |  |  |
| `--jeju-space-9` | `48px` |  |  |
| `--jeju-space-10` | `64px` |  |  |
| `--jeju-space-11` | `80px` |  |  |

## 10. shape / elevation

| 토큰 | 업무(기본) | 대민 | 설명 |
|---|---|---|---|
| `--jeju-radius-xs` | `4px` |  |  |
| `--jeju-radius-sm` | `6px` |  |  |
| `--jeju-radius` | `10px` |  |  |
| `--jeju-radius-lg` | `14px` |  |  |
| `--jeju-radius-pill` | `999px` |  |  |
| `--jeju-shadow` | `0 1px 2px rgba(18, 38, 52, 0.05)` |  |  |
| `--jeju-shadow-primary` | `0 4px 12px rgba(1, 115, 188, 0.24)` |  |  |
| `--jeju-shadow-pop` | `0 14px 34px rgba(15, 31, 43, 0.16)` |  |  |
| `--jeju-overlay` | `rgba(15, 31, 43, 0.48)` |  |  |

## 11. 레이어 순서

겹치는 UI는 이 스케일만 사용한다.

| 토큰 | 업무(기본) | 대민 | 설명 |
|---|---|---|---|
| `--jeju-z-sticky` | `2` |  |  |
| `--jeju-z-drawer` | `1000` |  |  |
| `--jeju-z-menu` | `1100` |  |  |
| `--jeju-z-tooltip` | `1200` |  |  |
| `--jeju-z-toast` | `9000` |  |  |

## 12. focus

| 토큰 | 업무(기본) | 대민 | 설명 |
|---|---|---|---|
| `--jeju-focus-ring` | `0 0 0 3px rgba(1, 115, 188, 0.22)` |  |  |

## 13. shell

| 토큰 | 업무(기본) | 대민 | 설명 |
|---|---|---|---|
| `--jeju-gnb-h` | `64px` |  |  |
| `--jeju-lnb-w` | `256px` |  |  |
| `--jeju-lnb-w-icon` | `48px` |  |  |
| `--jeju-main-max` | `1320px` |  |  |
| `--jeju-main-max-wide` | `1440px` |  |  |
| `--jeju-side-panel-w` | `480px` |  | 상세 보기 사이드 패널 |

## 14. work profile: high-density

| 토큰 | 업무(기본) | 대민 | 설명 |
|---|---|---|---|
| `--jeju-control-h-sm` | `32px` | `44px` | 대민: KRDS 권장 터치 영역 44px 이상 |
| `--jeju-control-h` | `36px` | `48px` |  |
| `--jeju-control-h-lg` | `40px` | `56px` |  |
| `--jeju-input-h` | `36px` | `48px` |  |
| `--jeju-search-h` | `36px` | `48px` |  |
| `--jeju-control-font` | `14px` | `17px` |  |
| `--jeju-control-font-sm` | `13px` | `15px` |  |
| `--jeju-control-font-lg` | `14px` | `19px` |  |
| `--jeju-label-font` | `14px` | `17px` |  |
| `--jeju-table-font` | `14px` | `17px` |  |
| `--jeju-cell-pad` | `8px 12px` | `12px 16px` |  |
| `--jeju-row-pad` | `12px 16px` | `20px 24px` |  |
| `--jeju-card-pad` | `16px 20px` | `24px` |  |
| `--jeju-container-max` | `1280px` | `1248px` |  |

## 15. work profile: 선택/진행 컨트롤 치수

| 토큰 | 업무(기본) | 대민 | 설명 |
|---|---|---|---|
| `--jeju-choice-size` | `18px` | `24px` |  |
| `--jeju-switch-w` | `44px` | `56px` |  |
| `--jeju-switch-h` | `24px` | `30px` |  |
| `--jeju-progress-h` | `8px` | `12px` |  |
| `--jeju-step-dot` | `32px` | `40px` |  |
| `--jeju-menu-min-w` | `220px` | `260px` |  |
| `--jeju-tooltip-max-w` | `260px` | `300px` |  |

## 16. 누를 수 있는 영역

업무는 WCAG 2.2 SC 2.5.8(24px), 대민은 KRDS 권장(44px)

| 토큰 | 업무(기본) | 대민 | 설명 |
|---|---|---|---|
| `--jeju-target-min` | `24px` | `44px` |  |
| `--jeju-chip-h` | `30px` | `44px` |  |
| `--jeju-chip-remove` | `20px` | `28px` |  |
| `--jeju-feedback-font` | `12px` | `15px` | 입력 오류·확인 문장 |

## 17. icon

| 토큰 | 업무(기본) | 대민 | 설명 |
|---|---|---|---|
| `--jeju-icon` | `16px` | `20px` |  |
| `--jeju-icon-lg` | `20px` | `24px` |  |
| `--jeju-icon-stroke` | `2` |  |  |

## 18. 고대비 설정에서 바뀌는 값

운영체제나 브라우저에서 대비 높이기(`prefers-contrast: more`)를 켜면 다음 값으로 바뀐다.

| 토큰 | 기본 | 고대비 |
|---|---|---|
| `--jeju-text-muted` | `#4e5f70` | `#344354` |
| `--jeju-text-subtle` | `#5d6d7c` | `#4e5f70` |
| `--jeju-border` | `#e1e7eb` | `#cfd8df` |
| `--jeju-border-strong` | `#cfd8df` | `#aebcc7` |
| `--jeju-focus-ring` | `0 0 0 3px rgba(1, 115, 188, 0.22)` | `0 0 0 4px rgba(1, 115, 188, 0.42)` |
