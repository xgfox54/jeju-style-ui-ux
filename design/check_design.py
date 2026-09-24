#!/usr/bin/env python3
"""Jeju Design System consistency checker.

stdlib only. Usage:
  python design/check_design.py --canon
  python design/check_design.py --report PATH
  python design/check_design.py --gate PATH
"""

from __future__ import annotations

import argparse
import json
import math
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DESIGN = ROOT / "design"
TOKENS = DESIGN / "jeju-tokens.css"
REGISTRY_SRC = ROOT / "registry" / "jeju"
REGISTRY_OUT = ROOT / "public" / "r"

REQUIRED_CANON = [
    DESIGN / "jeju-tokens.css",
    DESIGN / "jeju-components.css",
    DESIGN / "jeju-public.css",
    DESIGN / "jeju-behaviors.js",
    DESIGN / "jeju-icons.svg",
    DESIGN / "components.tsv",
    DESIGN / "examples" / "index.html",
    DESIGN / "examples" / "work.html",
    DESIGN / "examples" / "public.html",
    DESIGN / "examples" / "form.html",
    DESIGN / "examples" / "list.html",
    DESIGN / "examples" / "examples.css",
    ROOT / "docs" / "contract.md",
    ROOT / "docs" / "accessibility.md",
    ROOT / "docs" / "adoption-checklist.md",
    ROOT / "DESIGN.md",
    ROOT / "AGENTS.md",
    ROOT / "skills" / "jeju-design" / "SKILL.md",
    ROOT / "docs" / "react-registry.md",
    ROOT / "tools" / "build_registry.py",
    ROOT / "registry.json",
    REGISTRY_OUT / "jeju-style.json",
    ROOT / "tools" / "build_standalone.py",
    DESIGN / "fonts" / "jeju-fonts.css",
    DESIGN / "fonts" / "README.md",
    ROOT / "tools" / "build_token_docs.py",
    ROOT / "docs" / "tokens.md",
]

BRAND = {
    "--jeju-blue": "#0173bc",
    "--jeju-green": "#00a074",
    "--jeju-orange": "#f18101",
}

PUBLIC_ALLOWED_OVERRIDES = {
    "--jeju-control-h-sm", "--jeju-control-h", "--jeju-control-h-lg",
    "--jeju-input-h", "--jeju-search-h",
    "--jeju-control-font", "--jeju-control-font-sm", "--jeju-control-font-lg",
    "--jeju-label-font", "--jeju-table-font",
    "--jeju-cell-pad", "--jeju-row-pad", "--jeju-card-pad",
    "--jeju-container-max",
    "--jeju-text-sm", "--jeju-text-base", "--jeju-text-md", "--jeju-text-lg",
    "--jeju-text-xl", "--jeju-text-2xl", "--jeju-text-3xl",
    "--jeju-icon", "--jeju-icon-lg",
    "--jeju-choice-size", "--jeju-switch-w", "--jeju-switch-h",
    "--jeju-progress-h", "--jeju-step-dot",
    "--jeju-menu-min-w", "--jeju-tooltip-max-w",
    "--jeju-text-xs", "--jeju-target-min", "--jeju-chip-h", "--jeju-chip-remove", "--jeju-feedback-font",
}

SCAN_SUFFIXES = {".css", ".html", ".htm", ".js", ".jsx", ".ts", ".tsx", ".vue", ".jsp", ".py"}
HEX_RE = re.compile(r"#[0-9a-fA-F]{6}\b")
VAR_RE = re.compile(r"(--jeju-[\w-]+)\s*:\s*([^;]+);")
TOKEN_REF_RE = re.compile(r"--jeju-[A-Za-z0-9_-]+")
LOCAL_ASSET_RE = re.compile(r"(?:href|src)=[\"']([^\"']+)[\"']", re.I)
# Tailwind 기본 팔레트 색(bg-blue-500, text-white, bg-black/10 …). 레지스트리 소스는 토큰 색만 쓴다.
PALETTE_RE = re.compile(
    r"(?<![\w-])(?:bg|text|border|ring|fill|stroke|from|via|to|outline|shadow|divide|decoration|caret|accent)-"
    r"(?:black|white|slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)"
    r"(?:-\d{2,3})?(?:/\d+)?(?![\w-])"
)
# shadcn 테마에서 반드시 토큰으로 연결해야 하는 변수
THEME_REQUIRED = {
    "background", "foreground", "card", "card-foreground", "popover", "popover-foreground",
    "primary", "primary-foreground", "secondary", "secondary-foreground", "muted", "muted-foreground",
    "accent", "accent-foreground", "destructive", "border", "input", "ring", "radius",
}


class Finding:
    def __init__(self, rule: str, level: str, message: str, path: Path | None = None):
        self.rule = rule
        self.level = level
        self.message = message
        self.path = path

    def __str__(self) -> str:
        loc = f" [{self.path}]" if self.path else ""
        return f"{self.level:<4} {self.rule}: {self.message}{loc}"


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="replace")


def hex_to_rgb(value: str) -> tuple[int, int, int]:
    value = value.lstrip("#")
    return tuple(int(value[i:i+2], 16) for i in (0, 2, 4))  # type: ignore[return-value]


def channel(v: int) -> float:
    c = v / 255.0
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def luminance(value: str) -> float:
    r, g, b = hex_to_rgb(value)
    return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)


def contrast(a: str, b: str) -> float:
    la, lb = luminance(a), luminance(b)
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)


def parse_literal_tokens(text: str) -> dict[str, str]:
    out: dict[str, str] = {}
    for name, value in VAR_RE.findall(text):
        m = HEX_RE.search(value)
        if m:
            out[name] = m.group(0).lower()
    return out


def extract_block(text: str, selector: str) -> str:
    start = text.find(selector)
    if start < 0:
        return ""
    brace = text.find("{", start)
    if brace < 0:
        return ""
    depth = 0
    for i in range(brace, len(text)):
        if text[i] == "{":
            depth += 1
        elif text[i] == "}":
            depth -= 1
            if depth == 0:
                return text[brace + 1:i]
    return ""


def strip_comments(text: str) -> str:
    text = re.sub(r"/\*.*?\*/", "", text, flags=re.S)
    text = re.sub(r"(^|\s)//[^\n]*", r"\1", text)
    text = re.sub(r"<pre\b[^>]*>.*?</pre>", "", text, flags=re.S | re.I)
    text = re.sub(r"<code\b[^>]*>.*?</code>", "", text, flags=re.S | re.I)
    return text


def canon_checks() -> list[Finding]:
    findings: list[Finding] = []

    for path in REQUIRED_CANON:
        if not path.exists():
            findings.append(Finding("J1", "FAIL", "필수 정본 파일이 없습니다.", path))

    if not TOKENS.exists():
        return findings

    token_text = read(TOKENS)
    literal = parse_literal_tokens(token_text)

    for name, expected in BRAND.items():
        actual = literal.get(name)
        if actual != expected:
            findings.append(Finding("J2", "FAIL", f"{name} 원색이 {expected}와 다릅니다: {actual}", TOKENS))

    for name in ("--jeju-blue", "--jeju-green-dark", "--jeju-orange-dark", "--jeju-success", "--jeju-info", "--jeju-warning", "--jeju-danger"):
        value = literal.get(name)
        if value and contrast(value, "#ffffff") < 4.5:
            findings.append(Finding("J3", "FAIL", f"{name}={value}의 흰색 대비가 {contrast(value, '#ffffff'):.2f}:1 입니다.", TOKENS))

    inverse_bg = literal.get("--jeju-inverse-surface")
    inverse_fg = literal.get("--jeju-inverse-text")
    if inverse_bg and inverse_fg and contrast(inverse_bg, inverse_fg) < 4.5:
        findings.append(Finding("J3", "FAIL", f"반전 표면 대비가 {contrast(inverse_bg, inverse_fg):.2f}:1 입니다.", TOKENS))

    public_block = extract_block(token_text, '[data-jeju-profile="public"]')
    if not public_block:
        findings.append(Finding("J4", "FAIL", "대민 프로필 블록이 없습니다.", TOKENS))
    else:
        public_names = {name for name, _ in VAR_RE.findall(public_block)}
        illegal = sorted(public_names - PUBLIC_ALLOWED_OVERRIDES)
        for name in illegal:
            findings.append(Finding("J4", "FAIL", f"대민 프로필이 색/의미 토큰을 덮어씁니다: {name}", TOKENS))

    components = DESIGN / "jeju-components.css"
    if components.exists():
        text = read(components)
        if "var(--jeju-" not in text:
            findings.append(Finding("J5", "FAIL", "컴포넌트가 제주 토큰을 사용하지 않습니다.", components))
        if ":focus-visible" not in token_text:
            findings.append(Finding("J6", "FAIL", "공통 :focus-visible 규칙이 없습니다.", TOKENS))

    defined_tokens = {name for name, _ in VAR_RE.findall(token_text)}
    docs = [
        ROOT / "README.md",
        ROOT / "DESIGN.md",
        ROOT / "docs" / "contract.md",
        ROOT / "docs" / "accessibility.md",
        ROOT / "docs" / "adoption-checklist.md",
        ROOT / "docs" / "react-registry.md",
        DESIGN / "fonts" / "README.md",
        ROOT / "skills" / "jeju-design" / "SKILL.md",
        ROOT / "AGENTS.md",
        ROOT / "CHANGELOG.md",
    ]
    for path in docs:
        if not path.exists():
            continue
        unknown = sorted(set(TOKEN_REF_RE.findall(read(path))) - defined_tokens)
        for name in unknown:
            findings.append(Finding("J7", "FAIL", f"문서가 정의되지 않은 토큰을 참조합니다: {name}", path))

    css_sources = [
        TOKENS,
        DESIGN / "jeju-components.css",
        DESIGN / "jeju-public.css",
        DESIGN / "examples" / "examples.css",
    ]
    for path in css_sources:
        if not path.exists():
            continue
        unknown = sorted(set(TOKEN_REF_RE.findall(read(path))) - defined_tokens)
        for name in unknown:
            findings.append(Finding("J8", "FAIL", f"CSS가 정의되지 않은 토큰을 참조합니다: {name}", path))

    example_dir = DESIGN / "examples"
    example_files = sorted(example_dir.glob("*.html"))
    for path in example_files:
        if not path.exists():
            continue
        text = read(path)
        for ref in LOCAL_ASSET_RE.findall(text):
            if ref.startswith(("#", "http://", "https://", "mailto:", "tel:", "data:", "javascript:")):
                continue
            asset = ref.split("#", 1)[0].split("?", 1)[0]
            if not asset:
                continue
            if not (path.parent / asset).resolve().exists():
                findings.append(Finding("J9", "FAIL", f"예제가 존재하지 않는 로컬 자산을 참조합니다: {ref}", path))

    public_example = example_dir / "public.html"
    if public_example.exists():
        text = read(public_example)
        if 'data-jeju-profile="public"' not in text or "jeju-public.css" not in text:
            findings.append(Finding("J10", "FAIL", "대민 예제는 public 프로필과 jeju-public.css를 함께 사용해야 합니다.", public_example))

    for path in example_files:
        if path.name != "public.html" and 'data-jeju-profile="public"' in read(path):
            findings.append(Finding("J10", "FAIL", "업무 예제에 public 프로필을 사용하면 안 됩니다.", path))

    findings.extend(inventory_checks())
    findings.extend(sprite_checks(example_files))
    findings.extend(registry_checks(defined_tokens))
    findings.extend(standalone_checks())
    findings.extend(font_checks(token_text))
    findings.extend(token_doc_checks())

    return findings


def inventory_checks() -> list[Finding]:
    findings: list[Finding] = []
    inventory = DESIGN / "components.tsv"
    if not inventory.exists():
        return findings

    canon_css = ""
    for path in (DESIGN / "jeju-components.css", DESIGN / "jeju-public.css"):
        if path.exists():
            canon_css += read(path)
    if not canon_css:
        return findings

    for line in read(inventory).splitlines()[1:]:
        columns = line.split("\t")
        if len(columns) < 2:
            continue
        for selector in columns[1].split():
            if not selector.startswith("."):
                continue
            if not re.search(re.escape(selector) + r"(?![\w-])", canon_css):
                findings.append(Finding("J11", "FAIL", f"인벤토리 클래스가 정본 CSS에 없습니다: {selector}", inventory))
    return findings


def sprite_checks(example_files: list[Path]) -> list[Finding]:
    findings: list[Finding] = []
    sprite = DESIGN / "jeju-icons.svg"
    if not sprite.exists():
        return findings

    symbols = set(re.findall(r'id="([^"]+)"', read(sprite)))
    for path in example_files:
        if not path.exists():
            continue
        for ref in re.findall(r'href="[^"]*jeju-icons\.svg#([^"]+)"', read(path)):
            if ref not in symbols:
                findings.append(Finding("J12", "FAIL", f"예제가 없는 아이콘 심볼을 참조합니다: {ref}", path))
    return findings


def registry_checks(defined_tokens: set[str]) -> list[Finding]:
    """React/shadcn 레지스트리(Tier 2) 정본 검사: J13~J16."""
    findings: list[Finding] = []
    if not REGISTRY_SRC.exists():
        return findings

    # J13 생성물 신선도: registry.json · public/r · jeju-icons.tsx가 소스와 같은가
    sys.path.insert(0, str(ROOT / "tools"))
    try:
        import build_registry  # type: ignore[import-not-found]

        for problem in build_registry.stale_outputs():
            findings.append(Finding("J13", "FAIL", "레지스트리 생성물이 소스와 다릅니다 — " + problem + " (python tools/build_registry.py)", REGISTRY_OUT))
    except Exception as exc:  # noqa: BLE001 - 검사기는 어떤 실패도 보고로 바꾼다
        findings.append(Finding("J13", "FAIL", f"레지스트리 빌더를 실행하지 못했습니다: {exc}", ROOT / "tools" / "build_registry.py"))
    finally:
        sys.path.pop(0)

    # J14 레지스트리 소스 규칙
    for path in sorted(REGISTRY_SRC.rglob("*.tsx")):
        text = strip_comments(read(path))
        literals = sorted({m.group(0).lower() for m in HEX_RE.finditer(text)})
        if literals:
            findings.append(Finding("J14", "FAIL", "레지스트리 소스에 색 리터럴이 있습니다: " + ", ".join(literals[:8]), path))
        if re.search(r"(?<![\w-])dark:", text):
            findings.append(Finding("J14", "FAIL", "다크 모드 변형(dark:)은 범위 밖입니다.", path))
        if "lucide-react" in text:
            findings.append(Finding("J14", "FAIL", "아이콘은 @/components/ui/jeju-icons를 씁니다(lucide-react 금지).", path))
        if re.search(r"from\s+[\"']cn[\"']", text):
            findings.append(Finding("J14", "FAIL", "cn은 @/lib/utils에서 가져옵니다.", path))
        palette = sorted(set(PALETTE_RE.findall(text)))
        if palette:
            findings.append(Finding("J14", "FAIL", "Tailwind 기본 팔레트 색 대신 토큰을 씁니다: " + ", ".join(palette[:6]), path))
        unknown = sorted(set(TOKEN_REF_RE.findall(text)) - defined_tokens)
        for name in unknown:
            findings.append(Finding("J14", "FAIL", f"정의되지 않은 토큰을 참조합니다: {name}", path))

    # J15 테마: shadcn 변수는 모두 정의된 --jeju-* 토큰으로만 연결한다
    theme_path = REGISTRY_OUT / "jeju-theme.json"
    if theme_path.exists():
        theme = json.loads(read(theme_path))
        css_vars = theme.get("cssVars", {})
        if "dark" in css_vars:
            findings.append(Finding("J15", "FAIL", "테마에 다크 팔레트가 있습니다.", theme_path))
        light = css_vars.get("light", {})
        for name in sorted(THEME_REQUIRED - set(light)):
            findings.append(Finding("J15", "FAIL", f"테마가 shadcn 변수를 연결하지 않습니다: --{name}", theme_path))
        for section in ("light", "theme"):
            for name, value in css_vars.get(section, {}).items():
                match = re.fullmatch(r"var\((--jeju-[\w-]+)\)", str(value).strip())
                if not match:
                    findings.append(Finding("J15", "FAIL", f"테마 값은 var(--jeju-*) 하나여야 합니다: --{name}: {value}", theme_path))
                elif match.group(1) not in defined_tokens:
                    findings.append(Finding("J15", "FAIL", f"테마가 정의되지 않은 토큰을 씁니다: --{name}: {value}", theme_path))

    # J16 인벤토리 react 열과 레지스트리 항목이 서로 맞는가
    inventory = DESIGN / "components.tsv"
    index_path = ROOT / "registry.json"
    if inventory.exists() and index_path.exists():
        items = {item["name"]: item["type"] for item in json.loads(read(index_path)).get("items", [])}
        lines = read(inventory).splitlines()
        header = lines[0].split("\t") if lines else []
        if "react" not in header:
            findings.append(Finding("J16", "FAIL", "components.tsv에 react 열이 없습니다.", inventory))
        else:
            col = header.index("react")
            listed: set[str] = set()
            for line in lines[1:]:
                cells = line.split("\t")
                names = cells[col].split() if len(cells) > col else []
                for name in names:
                    if name == "-":
                        continue
                    listed.add(name)
                    if name not in items:
                        findings.append(Finding("J16", "FAIL", f"react 열의 항목이 레지스트리에 없습니다: {name}", inventory))
            for name, kind in sorted(items.items()):
                if kind in {"registry:ui", "registry:block"} and not name.startswith("jeju-example-") and name not in listed:
                    findings.append(Finding("J16", "FAIL", f"레지스트리 항목이 인벤토리 react 열에 없습니다: {name}", inventory))
    return findings


def standalone_checks() -> list[Finding]:
    """J17: 예제가 모두 로컬 참조 없는 단일 HTML로 만들어지는가(tools/build_standalone.py)."""
    findings: list[Finding] = []
    builder = ROOT / "tools" / "build_standalone.py"
    if not builder.exists():
        return findings
    sys.path.insert(0, str(ROOT / "tools"))
    try:
        import build_standalone  # type: ignore[import-not-found]

        for problem in build_standalone.check_examples():
            findings.append(Finding("J17", "FAIL", "standalone 생성 실패 — " + problem, builder))
    except Exception as exc:  # noqa: BLE001
        findings.append(Finding("J17", "FAIL", f"standalone 생성기를 실행하지 못했습니다: {exc}", builder))
    finally:
        sys.path.pop(0)
    return findings


def token_doc_checks() -> list[Finding]:
    """J19: docs/tokens.md가 토큰 파일에서 만든 결과와 같은가(tools/build_token_docs.py)."""
    findings: list[Finding] = []
    builder = ROOT / "tools" / "build_token_docs.py"
    if not builder.exists():
        return findings
    sys.path.insert(0, str(ROOT / "tools"))
    try:
        import build_token_docs  # type: ignore[import-not-found]

        for problem in build_token_docs.check():
            findings.append(Finding("J19", "FAIL", problem, ROOT / "docs" / "tokens.md"))
    except Exception as exc:  # noqa: BLE001
        findings.append(Finding("J19", "FAIL", f"토큰 문서 생성기를 실행하지 못했습니다: {exc}", builder))
    finally:
        sys.path.pop(0)
    return findings


FONT_URL_RE = re.compile(r"url\(\s*[\"']?([^\"')]+)[\"']?\s*\)", re.I)


def font_checks(token_text: str) -> list[Finding]:
    """J18: 자체 호스팅 글꼴 선언이 외부 주소 없이 같은 폴더만 참조하고 토큰의 첫 글꼴과 이름이 같은가."""
    findings: list[Finding] = []
    path = DESIGN / "fonts" / "jeju-fonts.css"
    if not path.exists():
        return findings
    css = strip_comments(read(path))
    first_font = re.search(r"--jeju-font\s*:\s*[\"']?([^\"',;]+)", token_text)
    families = set(re.findall(r"font-family\s*:\s*[\"']([^\"']+)[\"']", css))
    if not families:
        findings.append(Finding("J18", "FAIL", "@font-face에 font-family가 없습니다.", path))
    elif first_font and first_font.group(1).strip() not in families:
        findings.append(Finding("J18", "FAIL", f"글꼴 이름이 토큰의 첫 글꼴({first_font.group(1).strip()})과 다릅니다: {', '.join(sorted(families))}", path))
    for ref in FONT_URL_RE.findall(css):
        if re.match(r"(?:https?:)?//", ref.strip(), re.I):
            findings.append(Finding("J18", "FAIL", f"외부 글꼴 주소를 쓰면 안 됩니다: {ref}", path))
        elif "/" in ref.strip().removeprefix("./"):
            findings.append(Finding("J18", "FAIL", f"글꼴 파일은 jeju-fonts.css와 같은 폴더에 둡니다: {ref}", path))
    if "font-display" not in css or not re.search(r"font-display\s*:\s*swap", css):
        findings.append(Finding("J18", "FAIL", "font-display: swap이 없습니다(글꼴을 받는 동안 글자가 보이지 않음).", path))
    return findings


def token_hex_set() -> set[str]:
    if not TOKENS.exists():
        return set()
    return {m.group(0).lower() for m in HEX_RE.finditer(strip_comments(read(TOKENS)))}


def iter_files(target: Path):
    if target.is_file():
        if target.suffix.lower() in SCAN_SUFFIXES:
            yield target
        return
    for path in target.rglob("*"):
        if not path.is_file():
            continue
        if any(part in {".git", "node_modules", "dist", "build", ".next", ".venv", "venv", "__pycache__"} for part in path.parts):
            continue
        if path.suffix.lower() in SCAN_SUFFIXES:
            yield path


def service_checks(target: Path) -> list[Finding]:
    findings: list[Finding] = []
    allowed_hex = token_hex_set()

    if not target.exists():
        return [Finding("S0", "FAIL", "검사 대상 경로가 없습니다.", target)]

    findings.extend(react_service_checks(target))
    findings.extend(font_service_checks(target))

    for path in iter_files(target):
        try:
            raw = read(path)
        except OSError as exc:
            findings.append(Finding("S0", "WARN", f"읽기 실패: {exc}", path))
            continue

        text = strip_comments(raw)

        # canonical copies may legitimately contain literals.
        if path.name not in {"jeju-tokens.css", "jeju-components.css", "jeju-public.css"}:
            literals = sorted({m.group(0).lower() for m in HEX_RE.finditer(text)})
            unknown = [value for value in literals if value not in allowed_hex]
            if unknown:
                findings.append(Finding("S1", "FAIL", "정본 토큰에 없는 색 리터럴: " + ", ".join(unknown[:12]), path))

        # External CSS/font/script assets are unsafe for offline/segmented networks.
        external_asset = re.search(
            r"(?:@import\s+(?:url\()?['\"]?https?://|<(?:link|script)\b[^>]+(?:href|src)=['\"]https?://)",
            text,
            flags=re.I,
        )
        if external_asset:
            findings.append(Finding("S2", "FAIL", "외부 CDN/원격 CSS·스크립트 참조가 있습니다.", path))

        if path.suffix.lower() == ".css":
            if re.search(r"outline\s*:\s*(?:none|0)\s*;", text, flags=re.I) and ":focus-visible" not in text:
                findings.append(Finding("S3", "FAIL", "outline 제거가 있으나 같은 CSS에 :focus-visible 대체 규칙이 없습니다.", path))

        if path.suffix.lower() in {".html", ".htm", ".jsp"}:
            i_tokens = text.find("jeju-tokens.css")
            i_components = text.find("jeju-components.css")
            if i_tokens >= 0 and i_components >= 0 and i_components < i_tokens:
                findings.append(Finding("S4", "FAIL", "CSS 로드 순서가 역전되었습니다. tokens → components 순서여야 합니다.", path))
            if 'data-jeju-profile="public"' in text and "jeju-public.css" not in text:
                findings.append(Finding("S5", "WARN", "대민 프로필인데 jeju-public.css 참조가 보이지 않습니다.", path))

    return findings


def react_service_checks(target: Path) -> list[Finding]:
    """shadcn 레지스트리(@jeju)로 설치한 React 프로젝트 검사: S6·S7."""
    findings: list[Finding] = []
    root = target if target.is_dir() else target.parent
    config_path = root / "components.json"
    if not config_path.exists():
        return findings
    try:
        config = json.loads(read(config_path))
    except json.JSONDecodeError as exc:
        return [Finding("S6", "WARN", f"components.json을 읽지 못했습니다: {exc}", config_path)]
    if "@jeju" not in (config.get("registries") or {}):
        return findings

    canon = read(TOKENS).replace("\r\n", "\n") if TOKENS.exists() else ""
    copies = [p for p in root.rglob("jeju-tokens.css") if "node_modules" not in p.parts]
    if not copies:
        findings.append(Finding("S6", "FAIL", "토큰 사본(styles/jeju-tokens.css)이 없습니다. npx shadcn add @jeju/jeju-tokens", root))
    for copy in copies:
        if read(copy).replace("\r\n", "\n") != canon:
            findings.append(Finding("S6", "FAIL", "토큰 사본이 정본과 다릅니다. 사본을 고치지 말고 npx shadcn add @jeju/jeju-tokens -o 로 갱신합니다.", copy))

    css_rel = (config.get("tailwind") or {}).get("css")
    css_path = root / css_rel if css_rel else None
    if css_path and css_path.exists():
        css = read(css_path)
        if "jeju-tokens.css" not in css:
            findings.append(Finding("S7", "FAIL", "전역 CSS가 jeju-tokens.css를 @import하지 않습니다.", css_path))
        # @theme inline 안의 자기참조(--primary: var(--primary))가 아니라 :root 값을 본다.
        primary = re.search(r"--primary\s*:\s*([^;]+);", extract_block(css, ":root"))
        if not primary or not primary.group(1).strip().startswith("var(--jeju-"):
            findings.append(Finding("S7", "FAIL", "--primary가 var(--jeju-*) 토큰으로 연결되지 않았습니다. npx shadcn add @jeju/jeju-theme", css_path))
        if re.search(r"^\s*\.dark\s*\{", css, flags=re.M):
            findings.append(Finding("S7", "WARN", "프리셋의 .dark {} 팔레트가 남아 있습니다. 다크 모드는 범위 밖이므로 지웁니다.", css_path))
        if "@fontsource-variable/geist" in css:
            findings.append(Finding("S7", "WARN", "쓰지 않는 Geist 글꼴 import가 남아 있습니다.", css_path))
    return findings


def font_service_checks(target: Path) -> list[Finding]:
    """S8: 서비스에 복사한 jeju-fonts.css가 참조하는 글꼴 파일이 실제로 있는가(없으면 대체 글꼴로 표시)."""
    findings: list[Finding] = []
    root = target if target.is_dir() else target.parent
    for copy in root.rglob("jeju-fonts.css"):
        if any(part in {"node_modules", "dist", "build", ".git"} for part in copy.parts):
            continue
        for ref in FONT_URL_RE.findall(strip_comments(read(copy))):
            ref = ref.strip()
            if re.match(r"(?:https?:)?//", ref, re.I):
                findings.append(Finding("S8", "FAIL", f"외부 글꼴 주소를 쓰면 안 됩니다: {ref}", copy))
                continue
            if not (copy.parent / ref.split("?", 1)[0]).exists():
                findings.append(Finding("S8", "WARN", f"글꼴 파일이 없어 대체 글꼴로 표시됩니다: {ref} (design/fonts/README.md)", copy))
    return findings




def report(findings: list[Finding]) -> int:
    if not findings:
        print("PASS: 위반 없음")
        return 0

    for item in findings:
        print(item)

    fail_count = sum(1 for item in findings if item.level == "FAIL")
    warn_count = sum(1 for item in findings if item.level == "WARN")
    print(f"\nSummary: FAIL={fail_count}, WARN={warn_count}")
    return 1 if fail_count else 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Jeju Design System checker")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--canon", action="store_true", help="정본 자체 검사")
    group.add_argument("--report", metavar="PATH", help="서비스 검사(판정 출력)")
    group.add_argument("--gate", metavar="PATH", help="서비스 검사(FAIL이면 exit 1)")
    args = parser.parse_args()

    if args.canon:
        return report(canon_checks())

    target = Path(args.report or args.gate).resolve()
    findings = service_checks(target)
    code = report(findings)
    if args.report:
        return 0
    return code


if __name__ == "__main__":
    raise SystemExit(main())
