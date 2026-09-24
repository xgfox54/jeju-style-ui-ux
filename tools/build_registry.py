#!/usr/bin/env python3
"""Jeju Design System shadcn registry builder.

stdlib only. Usage:
  python tools/build_registry.py          # 생성: registry/jeju/ui/jeju-icons.tsx, registry.json, public/r/*.json
  python tools/build_registry.py --check  # 생성물이 소스와 같은지만 확인(다르면 exit 1)

소스:
  design/jeju-tokens.css          → @jeju/jeju-tokens (정본 파일을 그대로 싣는다)
  design/jeju-icons.svg           → registry/jeju/ui/jeju-icons.tsx (생성)
  registry/jeju/ui/*.tsx          → registry:ui
  registry/jeju/blocks/*/*.tsx    → registry:block
  registry/jeju/examples/*.tsx    → registry:block (기준 화면 예제)
의존성(npm · registryDependencies)은 각 파일의 import 문에서 읽는다.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DESIGN = ROOT / "design"
REGISTRY_SRC = ROOT / "registry" / "jeju"
REGISTRY_INDEX = ROOT / "registry.json"
OUT = ROOT / "public" / "r"
TOKENS = DESIGN / "jeju-tokens.css"
FONTS_CSS = DESIGN / "fonts" / "jeju-fonts.css"
SPRITE = DESIGN / "jeju-icons.svg"
ICONS_TSX = REGISTRY_SRC / "ui" / "jeju-icons.tsx"

NAMESPACE = "@jeju"
ITEM_SCHEMA = "https://ui.shadcn.com/schema/registry-item.json"
INDEX_SCHEMA = "https://ui.shadcn.com/schema/registry.json"

# 설치 시 버전을 고정해야 하는 npm 패키지. 목록에 없으면 소비 프로젝트의 최신 호환 버전을 쓴다.
PINNED_PACKAGES = {
    "react-day-picker": "react-day-picker@^9",
    "sonner": "sonner@^2",
}
IGNORED_PACKAGES = {"react", "react-dom"}

# 한 번에 착지하는 P0 묶음(@jeju/jeju-style). 무거운 항목(calendar)과 블록은 필요할 때 따로 추가한다.
STYLE_ITEMS = [
    "jeju-icons", "button", "badge", "card", "input", "label", "textarea", "native-select",
    "select", "checkbox", "radio-group", "switch", "chip", "toggle", "dialog", "alert-dialog",
    "sheet", "tabs", "alert", "breadcrumb", "pagination", "table", "skeleton", "spinner",
    "accordion", "dropdown-menu", "tooltip", "popover", "separator", "progress", "sonner",
    "field", "empty",
]

# shadcn 변수 → 제주 토큰. 값(hex)은 하나도 두지 않는다. 다크 팔레트는 만들지 않는다.
THEME_LIGHT = {
    "background": "var(--jeju-bg)",
    "foreground": "var(--jeju-text)",
    "card": "var(--jeju-surface)",
    "card-foreground": "var(--jeju-text)",
    "popover": "var(--jeju-surface)",
    "popover-foreground": "var(--jeju-text)",
    "primary": "var(--jeju-primary)",
    "primary-foreground": "var(--jeju-on-fill)",
    "secondary": "var(--jeju-surface-inset)",
    "secondary-foreground": "var(--jeju-text)",
    "muted": "var(--jeju-control-bg)",
    "muted-foreground": "var(--jeju-text-muted)",
    "accent": "var(--jeju-control-bg)",
    "accent-foreground": "var(--jeju-text-strong)",
    "destructive": "var(--jeju-danger)",
    "destructive-foreground": "var(--jeju-on-fill)",
    "border": "var(--jeju-border)",
    "input": "var(--jeju-border-strong)",
    "ring": "var(--jeju-primary)",
    "radius": "var(--jeju-radius)",
    "chart-1": "var(--jeju-primary)",
    "chart-2": "var(--jeju-secondary-strong)",
    "chart-3": "var(--jeju-accent-strong)",
    "chart-4": "var(--jeju-blue-deep)",
    "chart-5": "var(--jeju-text-subtle)",
    "sidebar": "var(--jeju-surface)",
    "sidebar-foreground": "var(--jeju-text)",
    "sidebar-primary": "var(--jeju-primary)",
    "sidebar-primary-foreground": "var(--jeju-on-fill)",
    "sidebar-accent": "var(--jeju-primary-tint)",
    "sidebar-accent-foreground": "var(--jeju-primary)",
    "sidebar-border": "var(--jeju-shell-border)",
    "sidebar-ring": "var(--jeju-primary)",
}

THEME_THEME = {
    "font-sans": "var(--jeju-font)",
    "font-heading": "var(--jeju-font)",
    "font-mono": "var(--jeju-font-mono)",
    "radius-sm": "var(--jeju-radius-sm)",
    "radius-md": "var(--jeju-radius-sm)",
    "radius-lg": "var(--jeju-radius)",
    "radius-xl": "var(--jeju-radius-lg)",
    "radius-2xl": "var(--jeju-radius-lg)",
    "radius-4xl": "var(--jeju-radius-pill)",
}

THEME_CSS = {
    "@layer base": {
        "body": {
            "font-family": "var(--jeju-font)",
            "font-size": "var(--jeju-text-base)",
            "line-height": "var(--jeju-leading-normal)",
            "background-color": "var(--jeju-bg)",
            "color": "var(--jeju-text)",
            "word-break": "keep-all",
            "overflow-wrap": "break-word",
        },
        "a": {"color": "var(--jeju-primary)", "text-underline-offset": "2px"},
    },
    # 인쇄: 조작 요소는 각 컴포넌트의 print: 유틸리티가 숨긴다. 여기서는 오른쪽 상세 패널이 열려 있으면 패널 내용만 인쇄하고,
    # 인쇄물에 포커스 표시가 남지 않게 한다. 층(layer) 밖 규칙이라 Tailwind 유틸리티보다 우선한다.
    "@media print": {
        "body": {"background-color": "var(--jeju-surface)"},
        'body:has(> [data-slot="sheet-content"][data-side="right"][data-state="open"]) > :not([data-slot="sheet-content"])': {
            "display": "none",
        },
        '[data-slot="sheet-content"][data-side="right"][data-state="open"]': {
            "position": "absolute",
            "inset": "0 0 auto 0",
            "width": "auto",
            "height": "auto",
            "max-width": "none",
            "overflow": "visible",
            "border": "0",
            "box-shadow": "none",
            "animation": "none",
            "transition": "none",
        },
        '[data-slot="sheet-content"] > [data-slot="sheet-close"], [data-slot="sheet-content"] [data-slot="sheet-footer"]': {
            "display": "none",
        },
        ":focus-visible": {"box-shadow": "none", "outline": "0"},
    },
}

META: dict[str, tuple[str, str]] = {
    # 기반
    "jeju-tokens": ("제주 디자인 토큰(정본 사본)", "design/jeju-tokens.css를 그대로 복사한다. 값의 유일한 원천이며 check_design.py --gate가 정본과 대조한다. CSS 첫 부분에서 @import로 불러온다."),
    "jeju-fonts": ("Pretendard GOV 자체 호스팅 선언", "public/fonts/jeju-fonts.css에 @font-face를 넣는다. 글꼴 파일은 기관 승인 후 public/fonts/에 둔다(design/fonts/README.md)."),
    "jeju-theme": ("제주 테마 — shadcn 변수를 --jeju-* 토큰으로 연결", "--primary, --background, --radius 등 shadcn 변수를 모두 var(--jeju-*)로 돌린다. hex 값과 다크 팔레트는 없다."),
    "jeju-style": ("제주 스타일 — 한 번에 설치", "토큰 · 테마 · 제주 아이콘 · P0 UI 컴포넌트를 한 번에 설치한다. 달력과 블록은 필요할 때 추가한다."),
    "jeju-icons": ("제주 아이콘(React)", "design/jeju-icons.svg에서 생성한 선형 아이콘. 크기는 --jeju-icon 토큰을 따르고 기본 aria-hidden이다."),
    # UI
    "accordion": ("아코디언", "heading 안의 버튼, 위/아래/Home/End 이동. Tier 1 .jeju-accordion과 같은 모양."),
    "alert": ("알림", "info/success/warning/danger 역할색. 제목으로 상태를 문구로도 밝힌다."),
    "alert-dialog": ("확인 대화상자", "파괴적 동작 확인용. 배경 클릭으로 닫히지 않는다."),
    "badge": ("배지", "상태 배지 info/success/warning/danger/neutral. 항상 문구와 함께 쓴다."),
    "breadcrumb": ("경로 표시", "현재 위치 탐색. aria-current=page."),
    "button": ("버튼", "default(Blue) · secondary(Green strong) · accent(Orange strong) · outline · ghost · destructive · link. 높이는 프로필 토큰."),
    "calendar": ("달력", "react-day-picker 기반 달력. 날짜 칸은 컨트롤 높이 토큰을 따른다."),
    "card": ("카드", "1px 테두리 · 14px 모서리 카드."),
    "checkbox": ("체크박스", "부분 선택(indeterminate) 표시를 지원한다."),
    "chip": ("칩", "제주 고유. 필터 칩(aria-pressed)과 제거 가능한 조건 칩."),
    "dialog": ("모달", "포커스 가둠 · Esc 닫기 · 포커스 복귀."),
    "dropdown-menu": ("드롭다운 메뉴", "화살표·Home·End 이동, Esc 시 트리거로 포커스 복귀."),
    "empty": ("빈 상태", "무엇이 없고 다음에 무엇을 하면 되는지 함께 안내한다."),
    "field": ("폼 필드", "FieldSet/Legend/Label/Description/Error. 오류 문장에 경고 아이콘을 붙인다."),
    "input": ("입력", "기본·hover·focus·readonly·disabled·오류 상태."),
    "label": ("라벨", "required를 주면 '필수' 문구를 붙인다."),
    "native-select": ("기본 선택 상자", "브라우저 기본 select. 폼 제출이 단순할 때 권장."),
    "pagination": ("페이지 이동", "현재 페이지는 aria-current와 Primary 채움으로 표시."),
    "popover": ("팝오버", "트리거 옆에 여는 보조 패널."),
    "progress": ("진행률", "role=progressbar. 숫자 문구를 함께 둔다."),
    "radio-group": ("라디오 그룹", "화살표 키로 선택을 옮긴다."),
    "select": ("선택 목록", "Radix Select. 커스텀 목록이 필요할 때 쓴다."),
    "separator": ("구분선", "가로·세로 구분선."),
    "sheet": ("시트(드로어)", "화면 가장자리 패널. 업무 셸의 모바일 메뉴에 쓴다."),
    "skeleton": ("스켈레톤", "로딩 자리표시."),
    "sonner": ("토스트", "sonner 래퍼. 3개 상한 · 5초. 제주 아이콘과 반전 표면 토큰."),
    "spinner": ("스피너", "role=status 로딩 표시."),
    "switch": ("스위치", "켜짐/꺼짐 문구를 옆에 함께 둔다."),
    "table": ("표", "헤더 상단 2px Primary, 숫자 열 num, 행 선택 색."),
    "tabs": ("탭", "기본은 밑줄형(line). 화살표 키 이동."),
    "textarea": ("여러 줄 입력", "최소 110px, 입력 상태는 input과 같다."),
    "toggle": ("토글 버튼", "눌림 상태를 aria-pressed로 알린다."),
    "tooltip": ("툴팁", "보조 설명. 포커스로 열리고 Esc로 닫힌다."),
    # 블록
    "jeju-common": ("제주 공통 조각", "브랜드 마크 자리표시자(공식 CI 아님)와 본문 바로가기 링크."),
    "jeju-shell": ("업무 셸", "GNB + LNB + 본문. 900px 이하에서 LNB가 드로어로 바뀐다."),
    "jeju-page-head": ("페이지 머리", "제목(h1) · 설명 · 주요 액션."),
    "jeju-stat": ("KPI", "4 → 2 → 1열 KPI 묶음."),
    "jeju-data-table": ("행정용 데이터 표", "정렬 · 행 선택 · 일괄 작업 · 페이지 크기 · 페이지 이동 · 고정 헤더 · 첫 열 고정 · 모바일 카드형 · 서버 조회형(manual) · 로딩/오류 상태. 추가 의존성 없음."),
    "jeju-steps": ("단계 표시", "완료·현재·예정을 문구로도 알린다. 700px 이하 세로형."),
    "jeju-wizard": ("신청 마법사", "단계 표시 + 진행률 + 이전/다음. 단계가 바뀌면 새 단계로 포커스를 옮긴다."),
    "jeju-file-upload": ("파일 업로드", "끌어다 놓기 · 파일 목록 · 파일별 삭제 · 용량 제한 안내."),
    "jeju-error-summary": ("오류 요약", "제출 실패 시 폼 위에 두고 각 항목을 해당 입력으로 연결한다."),
    "jeju-date-picker": ("날짜·기간 선택", "달력 팝오버와 기간 프리셋. YYYY-MM-DD 형식, 한국어 달력."),
    "jeju-search": ("검색 입력", "돋보기 아이콘이 붙은 검색 입력."),
    "jeju-public-shell": ("대민 셸", "masthead · 헤더(모바일 메뉴) · 본문 · 히어로 · 카드 · 기관 식별 · 푸터."),
    "jeju-service-search": ("대민 서비스 검색", "검색어와 분류 칩으로 서비스 목록을 거르고 결과 수를 문구로 알린다. 결과가 없으면 빈 상태와 초기화."),
    "jeju-eligibility-check": ("신청 자격 확인", "예/아니요 질문으로 신청 가능 여부를 자가 확인한다. 결과를 알림 색과 문구로 함께 보여 준다."),
    "jeju-doc-list": ("서식 내려받기", "문서명 · 형식 · 크기 · 개정일과 내려받기 버튼. 버튼 이름에 문서명과 형식이 들어간다."),
    "jeju-contact": ("문의·방문 안내", "담당 부서 · 전화 · 운영 시간 · 주소와 전화 걸기 · 지도 링크."),
    "jeju-related-links": ("함께 찾는 서비스", "관련 서비스 링크 목록. 링크마다 누를 수 있는 영역을 토큰 이상으로 둔다."),
    "jeju-async-state": ("로딩·오류 상태", "LoadingState(role=status · 스켈레톤) · ErrorState(role=alert · 다시 시도) · AsyncState(네 상태 중 하나만 표시)."),
    "jeju-detail-panel": ("상세 보기 사이드 패널", "목록을 떠나지 않고 한 건의 상세를 오른쪽 패널로 본다. DetailPanel · DetailList."),
    # 예제
    "jeju-example-work": ("예제: 업무 목록 화면", "통합돌봄 대상자 현황. Tier 1 work.html의 React판."),
    "jeju-example-form": ("예제: 업무 등록 폼", "대상자 등록. 폼 상태 계층과 오류 요약. Tier 1 form.html의 React판."),
    "jeju-example-public": ("예제: 대민 서비스 화면", "제주 돌봄서비스. Tier 1 public.html의 React판."),
    "jeju-example-gallery": ("예제: 컴포넌트 갤러리", "브랜드 색 · 버튼 · 배지 · 알림 · 탭 · 카드 · 진행률 · 스위치 · 모달. Tier 1 index.html의 React판."),
}

IMPORT_RE = re.compile(r"""(?:^|\n)\s*(?:import|export)\s[^"';]*?from\s+["']([^"']+)["']|(?:^|\n)\s*import\s+["']([^"']+)["']""")


class BuildError(Exception):
    pass


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def rel(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


# ---------------------------------------------------------------------------
# 아이콘: design/jeju-icons.svg → React 컴포넌트
# ---------------------------------------------------------------------------

def pascal(name: str) -> str:
    return "".join(part[:1].upper() + part[1:] for part in re.split(r"[-_]", name) if part)


def camel_attr(name: str) -> str:
    head, *rest = name.split("-")
    return head + "".join(part[:1].upper() + part[1:] for part in rest)


def build_icons() -> str:
    sprite = read(SPRITE)
    symbols = re.findall(r'<symbol\s+id="jeju-icon-([a-z0-9-]+)"\s+viewBox="([^"]+)"\s*>(.*?)</symbol>', sprite, flags=re.S)
    if not symbols:
        raise BuildError("jeju-icons.svg에서 symbol을 찾지 못했습니다.")
    lines = [
        "// 이 파일은 tools/build_registry.py가 design/jeju-icons.svg에서 생성한다. 직접 고치지 말고 sprite를 고친 뒤 다시 생성한다.",
        "// 장식 아이콘은 기본 aria-hidden이다. 의미가 있는 아이콘 버튼은 버튼에 접근성 이름(aria-label)을 준다.",
        'import * as React from "react"',
        "",
        'import { cn } from "@/lib/utils"',
        "",
        'type JejuIconProps = React.ComponentProps<"svg">',
        "",
        "function createIcon(name: string, viewBox: string, body: React.ReactNode) {",
        "  function JejuSvgIcon({ className, ...props }: JejuIconProps) {",
        "    return (",
        "      <svg",
        "        viewBox={viewBox}",
        '        fill="none"',
        '        stroke="currentColor"',
        '        strokeLinecap="round"',
        '        strokeLinejoin="round"',
        '        aria-hidden="true"',
        '        focusable="false"',
        '        data-icon={name}',
        '        className={cn("size-(--jeju-icon) shrink-0 [stroke-width:var(--jeju-icon-stroke)]", className)}',
        "        {...props}",
        "      >",
        "        {body}",
        "      </svg>",
        "    )",
        "  }",
        '  JejuSvgIcon.displayName = name + "-icon"',
        "  return JejuSvgIcon",
        "}",
        "",
    ]
    names = []
    for icon_id, viewbox, inner in symbols:
        elements = []
        for tag, attrs in re.findall(r"<(path|circle|rect|line|polyline|polygon|ellipse)\b([^>]*?)/?>", inner):
            pairs = re.findall(r'([a-zA-Z][\w-]*)="([^"]*)"', attrs)
            jsx_attrs = " ".join(f'{camel_attr(k)}="{v}"' for k, v in pairs)
            elements.append(f"<{tag} {jsx_attrs} />")
        if not elements:
            raise BuildError(f"아이콘 {icon_id}에 그릴 요소가 없습니다.")
        component = pascal(icon_id) + "Icon"
        names.append((icon_id, component))
        body = elements[0] if len(elements) == 1 else "<>" + "".join(elements) + "</>"
        lines.append(f'const {component} = createIcon("{icon_id}", "{viewbox}", {body})')
    lines += [
        "",
        "const jejuIcons = {",
        *[f'  "{icon_id}": {component},' for icon_id, component in names],
        "} as const",
        "",
        "type JejuIconName = keyof typeof jejuIcons",
        "",
        "function JejuIcon({ name, ...props }: JejuIconProps & { name: JejuIconName }) {",
        "  const Icon = jejuIcons[name]",
        "  return <Icon {...props} />",
        "}",
        "",
        "export {",
        "  JejuIcon,",
        "  jejuIcons,",
        "  type JejuIconName,",
        *[f"  {component}," for _, component in names],
        "}",
        "",
    ]
    return "\n".join(lines)


# ---------------------------------------------------------------------------
# 항목 수집
# ---------------------------------------------------------------------------

def discover() -> list[dict]:
    items: list[dict] = []
    for path in sorted((REGISTRY_SRC / "ui").glob("*.tsx")):
        items.append({"name": path.stem, "type": "registry:ui", "files": [(path, "registry:ui", None)]})
    for folder in sorted(p for p in (REGISTRY_SRC / "blocks").iterdir() if p.is_dir()):
        files = sorted(folder.glob("*.tsx"))
        if not files:
            raise BuildError(f"블록 폴더가 비어 있습니다: {rel(folder)}")
        items.append({"name": folder.name, "type": "registry:block", "files": [(f, "registry:component", None) for f in files]})
    for path in sorted((REGISTRY_SRC / "examples").glob("*.tsx")):
        items.append({"name": path.stem, "type": "registry:block", "files": [(path, "registry:component", None)]})
    return items


def package_name(spec: str) -> str:
    parts = spec.split("/")
    return "/".join(parts[:2]) if spec.startswith("@") else parts[0]


def resolve_imports(source: str, known: set[str], origin: str) -> tuple[set[str], set[str]]:
    deps: set[str] = set()
    reg: set[str] = set()
    for match in IMPORT_RE.finditer(source):
        spec = match.group(1) or match.group(2)
        if spec == "@/lib/utils":
            continue
        if spec.startswith("@/components/"):
            name = spec.rsplit("/", 1)[-1]
            if name not in known:
                raise BuildError(f"{origin}: 레지스트리에 없는 컴포넌트를 import합니다: {spec}")
            reg.add(f"{NAMESPACE}/{name}")
            continue
        if spec.startswith((".", "@/")):
            raise BuildError(f"{origin}: 지원하지 않는 import 경로입니다: {spec}")
        pkg = package_name(spec)
        if pkg in IGNORED_PACKAGES:
            continue
        deps.add(PINNED_PACKAGES.get(pkg, pkg))
    return deps, reg


def build_items(icon_source: str) -> list[dict]:
    discovered = discover()
    known = {item["name"] for item in discovered}
    if "jeju-icons" not in known:
        discovered.append({"name": "jeju-icons", "type": "registry:ui", "files": [(ICONS_TSX, "registry:ui", None)]})
        known.add("jeju-icons")

    items: list[dict] = [
        {
            "name": "jeju-tokens",
            "type": "registry:file",
            "files": [{"path": rel(TOKENS), "type": "registry:file", "target": "~/styles/jeju-tokens.css", "content": read(TOKENS)}],
        },
        {
            "name": "jeju-fonts",
            "type": "registry:file",
            "files": [{"path": rel(FONTS_CSS), "type": "registry:file", "target": "~/public/fonts/jeju-fonts.css", "content": read(FONTS_CSS)}],
        },
        {
            "name": "jeju-theme",
            "type": "registry:theme",
            "dependencies": ["shadcn", "tw-animate-css"],
            "registryDependencies": [f"{NAMESPACE}/jeju-tokens"],
            "cssVars": {"theme": THEME_THEME, "light": THEME_LIGHT},
            "css": THEME_CSS,
        },
    ]

    style_deps: set[str] = set()
    for entry in sorted(discovered, key=lambda item: item["name"]):
        deps: set[str] = set()
        reg: set[str] = set()
        files = []
        for path, file_type, target in entry["files"]:
            content = icon_source if path == ICONS_TSX else read(path)
            file_deps, file_reg = resolve_imports(content, known, rel(path))
            deps |= file_deps
            reg |= file_reg
            record = {"path": rel(path), "type": file_type, "content": content}
            if target:
                record["target"] = target
            files.append(record)
        reg.discard(f"{NAMESPACE}/{entry['name']}")
        if entry["type"] == "registry:block":
            reg.add(f"{NAMESPACE}/jeju-tokens")
        item = {"name": entry["name"], "type": entry["type"]}
        if deps:
            item["dependencies"] = sorted(deps)
        if reg:
            item["registryDependencies"] = sorted(reg)
        item["files"] = files
        items.append(item)
        if entry["name"] in STYLE_ITEMS:
            style_deps |= deps

    missing = [name for name in STYLE_ITEMS if name not in known]
    if missing:
        raise BuildError("jeju-style이 없는 항목을 참조합니다: " + ", ".join(missing))

    items.insert(2, {
        "name": "jeju-style",
        "type": "registry:style",
        "dependencies": sorted(style_deps),
        "registryDependencies": ["utils", f"{NAMESPACE}/jeju-tokens", f"{NAMESPACE}/jeju-theme"] + [f"{NAMESPACE}/{name}" for name in STYLE_ITEMS],
    })

    for item in items:
        if item["name"] not in META:
            raise BuildError(f"META에 제목·설명이 없습니다: {item['name']}")
        title, description = META[item["name"]]
        item["title"] = title
        item["description"] = description
    unused = sorted(set(META) - {item["name"] for item in items})
    if unused:
        raise BuildError("META에만 있고 소스가 없는 항목: " + ", ".join(unused))
    return items


ORDER = ["$schema", "name", "type", "title", "description", "dependencies", "registryDependencies", "files", "cssVars", "css"]


def ordered(item: dict, with_content: bool) -> dict:
    out: dict = {}
    for key in ORDER:
        if key == "$schema":
            if with_content:
                out[key] = ITEM_SCHEMA
            continue
        if key not in item:
            continue
        if key == "files":
            files = []
            for record in item["files"]:
                entry = {"path": record["path"], "type": record["type"]}
                if record.get("target"):
                    entry["target"] = record["target"]
                if with_content:
                    entry["content"] = record["content"]
                files.append(entry)
            out[key] = files
        else:
            out[key] = item[key]
    return out


def dump(data: dict) -> str:
    return json.dumps(data, ensure_ascii=False, indent=2) + "\n"


def build_outputs() -> dict[Path, str]:
    icon_source = build_icons()
    items = build_items(icon_source)
    index = {
        "$schema": INDEX_SCHEMA,
        "name": "jeju",
        "homepage": "README.md",
        "items": [ordered(item, with_content=False) for item in items],
    }
    outputs: dict[Path, str] = {
        ICONS_TSX: icon_source,
        REGISTRY_INDEX: dump(index),
        OUT / "registry.json": dump(index),
    }
    for item in items:
        outputs[OUT / f"{item['name']}.json"] = dump(ordered(item, with_content=True))
    return outputs


def stale_outputs() -> list[str]:
    """생성물이 소스와 다른 파일 목록. check_design.py(J13)가 부른다."""
    try:
        outputs = build_outputs()
    except BuildError as exc:
        return [f"빌드 실패: {exc}"]
    problems = []
    for path, content in outputs.items():
        if not path.exists():
            problems.append(f"없음: {rel(path)}")
        elif path.read_text(encoding="utf-8") != content:
            problems.append(f"오래됨: {rel(path)}")
    if OUT.exists():
        expected = {path.name for path in outputs if path.parent == OUT}
        for extra in sorted(p.name for p in OUT.glob("*.json") if p.name not in expected):
            problems.append(f"소스 없는 생성물: public/r/{extra}")
    return problems


def write_outputs() -> int:
    outputs = build_outputs()
    OUT.mkdir(parents=True, exist_ok=True)
    expected = {path.name for path in outputs if path.parent == OUT}
    for extra in OUT.glob("*.json"):
        if extra.name not in expected:
            extra.unlink()
    changed = 0
    for path, content in outputs.items():
        path.parent.mkdir(parents=True, exist_ok=True)
        if not path.exists() or path.read_text(encoding="utf-8") != content:
            with path.open("w", encoding="utf-8", newline="\n") as handle:
                handle.write(content)
            changed += 1
    items = sum(1 for path in outputs if path.parent == OUT and path.name != "registry.json")
    print(f"registry: {items}개 항목, 변경 파일 {changed}개")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Jeju shadcn registry builder")
    parser.add_argument("--check", action="store_true", help="생성물이 최신인지 확인만 한다")
    args = parser.parse_args()
    try:
        if args.check:
            problems = stale_outputs()
            for line in problems:
                print("FAIL", line)
            if problems:
                print("\n'python tools/build_registry.py'로 다시 생성하세요.")
                return 1
            print("PASS: 레지스트리 생성물이 최신입니다.")
            return 0
        return write_outputs()
    except BuildError as exc:
        print(f"FAIL: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
