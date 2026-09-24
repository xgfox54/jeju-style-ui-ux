#!/usr/bin/env python3
"""Jeju Design System standalone HTML builder.

stdlib only. 망분리 환경이나 메일·USB로 화면 시안을 전달할 때 쓰는 단일 HTML 파일을 만든다.
로컬 CSS · JS · SVG 아이콘 sprite · 이미지를 모두 파일 안에 넣어, 서버 없이 더블클릭으로 열어도 같은 화면이 나온다.

Usage:
  python tools/build_standalone.py                          # design/examples의 예제 전부 → dist/standalone/
  python tools/build_standalone.py page.html [...] --out DIR # 서비스 화면을 단일 파일로
  python tools/build_standalone.py --check                  # 예제를 메모리에서 만들어 자기완결성만 확인
"""

from __future__ import annotations

import argparse
import base64
import json
import mimetypes
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EXAMPLES = ROOT / "design" / "examples"
DEFAULT_PAGES = sorted(path.name for path in EXAMPLES.glob("*.html"))
DEFAULT_OUT = ROOT / "dist" / "standalone"

LINK_RE = re.compile(r"<link\b[^>]*>", re.I)
SCRIPT_RE = re.compile(r"<script\b([^>]*)\bsrc=([\"'])([^\"']+)\2([^>]*)>\s*</script>", re.I)
ATTR_RE = re.compile(r"\b(href|src)=([\"'])([^\"']*)\2", re.I)
SPRITE_REF_RE = re.compile(r"(\bhref=[\"'])([^\"'#]*jeju-icons\.svg)(#[^\"']+[\"'])", re.I)
CSS_URL_RE = re.compile(r"url\(\s*([\"']?)([^\"')]+)\1\s*\)", re.I)
BODY_OPEN_RE = re.compile(r"<body\b[^>]*>", re.I)
# "?"로 시작하는 주소는 같은 페이지의 조회 조건(서버 정렬 · 페이지 링크)이라 파일이 아니다.
EXTERNAL = ("#", "?", "http://", "https://", "mailto:", "tel:", "data:", "javascript:", "//")
FONT_EXTS = {".woff2", ".woff", ".ttf", ".otf"}
WARNINGS: list[str] = []


class StandaloneError(Exception):
    pass


def version() -> str:
    try:
        return json.loads((ROOT / "package.json").read_text(encoding="utf-8")).get("version", "")
    except (OSError, json.JSONDecodeError):
        return ""


def is_local(ref: str) -> bool:
    return bool(ref) and not ref.lower().startswith(EXTERNAL)


def resolve(base: Path, ref: str) -> Path:
    path = (base / ref.split("#", 1)[0].split("?", 1)[0]).resolve()
    if not path.exists():
        raise StandaloneError(f"참조한 로컬 파일이 없습니다: {ref} (기준 {base})")
    return path


def data_uri(path: Path) -> str:
    mime = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
    if path.suffix.lower() == ".svg":
        mime = "image/svg+xml"
    return f"data:{mime};base64," + base64.b64encode(path.read_bytes()).decode("ascii")


def inline_css(path: Path) -> str:
    css = path.read_text(encoding="utf-8")

    def repl(match: re.Match[str]) -> str:
        ref = match.group(2).strip()
        if not is_local(ref):
            return match.group(0)
        target = (path.parent / ref.split("#", 1)[0].split("?", 1)[0]).resolve()
        if not target.exists() and target.suffix.lower() in FONT_EXTS:
            # 글꼴 파일은 기관 승인 후 두므로 없을 수 있다. 참조는 그대로 두고 대체 글꼴로 표시된다고 알린다.
            WARNINGS.append(f"{path.name}: 글꼴 파일이 없어 넣지 못했습니다 — {ref} (대체 글꼴로 표시)")
            return match.group(0)
        return f'url("{data_uri(resolve(path.parent, ref))}")'

    css = CSS_URL_RE.sub(repl, css)
    return css.replace("</style", "<\\/style")


def sprite_markup(path: Path) -> str:
    svg = path.read_text(encoding="utf-8").strip()
    # 화면에 그리지 않고 <use href="#..."> 참조만 받는 숨김 sprite. display:none은 일부 브라우저에서 참조를 끊는다.
    return re.sub(
        r"<svg\b[^>]*>",
        '<svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" '
        'style="position:absolute;width:0;height:0;overflow:hidden">',
        svg,
        count=1,
    )


def build_page(source: Path, sibling_pages: set[str]) -> str:
    html = source.read_text(encoding="utf-8")
    base = source.parent
    rel = source.relative_to(ROOT).as_posix() if source.is_relative_to(ROOT) else source.name

    # 1) 스타일시트 → <style>
    def link_repl(match: re.Match[str]) -> str:
        tag = match.group(0)
        if not re.search(r"\brel=[\"']stylesheet[\"']", tag, re.I):
            return tag
        href = re.search(r"\bhref=[\"']([^\"']+)[\"']", tag, re.I)
        if not href or not is_local(href.group(1)):
            return tag
        path = resolve(base, href.group(1))
        return f'<style data-source="{path.name}">\n{inline_css(path)}\n</style>'

    html = LINK_RE.sub(link_repl, html)

    # 2) 스크립트 → 인라인. defer 스크립트는 원래 순서대로 </body> 앞으로 옮겨 실행 시점을 지킨다.
    deferred: list[str] = []

    def script_repl(match: re.Match[str]) -> str:
        src = match.group(3)
        if not is_local(src):
            return match.group(0)
        path = resolve(base, src)
        code = path.read_text(encoding="utf-8").replace("</script", "<\\/script")
        block = f'<script data-source="{path.name}">\n{code}\n</script>'
        if re.search(r"\bdefer\b", match.group(1) + match.group(4), re.I):
            deferred.append(block)
            return ""
        return block

    html = SCRIPT_RE.sub(script_repl, html)

    # 3) 아이콘 sprite → body 첫머리에 한 번 넣고 참조를 #id로 바꾼다.
    sprite_files = {m.group(2) for m in SPRITE_REF_RE.finditer(html)}
    if sprite_files:
        sprite = resolve(base, sorted(sprite_files)[0])
        html = SPRITE_REF_RE.sub(lambda m: m.group(1) + m.group(3), html)
        body = BODY_OPEN_RE.search(html)
        if not body:
            raise StandaloneError(f"{rel}: <body>를 찾지 못했습니다.")
        html = html[: body.end()] + "\n" + sprite_markup(sprite) + html[body.end():]

    # 4) 그 밖의 로컬 자산(img 등) → data URI. 같이 만드는 다른 예제 페이지 링크는 그대로 둔다.
    def attr_repl(match: re.Match[str]) -> str:
        name, quote, ref = match.groups()
        if not is_local(ref):
            return match.group(0)
        target = ref.split("#", 1)[0].split("?", 1)[0]
        if target.lower().endswith((".html", ".htm")):
            return match.group(0)
        return f"{name}={quote}{data_uri(resolve(base, ref))}{quote}"

    html = ATTR_RE.sub(attr_repl, html)

    if deferred:
        close = html.lower().rfind("</body>")
        if close < 0:
            raise StandaloneError(f"{rel}: </body>를 찾지 못했습니다.")
        html = html[:close] + "\n".join(deferred) + "\n" + html[close:]

    header = f"<!-- standalone: Jeju Style UI·UX 디자인 가이드 v{version()} · tools/build_standalone.py가 {rel}에서 생성 · 직접 고치지 않는다 -->\n"
    if html.lower().startswith("<!doctype"):
        end = html.index(">") + 1
        html = html[:end] + "\n" + header + html[end:].lstrip("\n")
    else:
        html = header + html
    return html


def problems_in(html: str, name: str, sibling_pages: set[str]) -> list[str]:
    out = []
    for attr, _, ref in ATTR_RE.findall(html):
        if not is_local(ref):
            continue
        target = Path(ref.split("#", 1)[0].split("?", 1)[0]).name
        if target in sibling_pages:
            continue
        out.append(f"{name}: 로컬 참조가 남았습니다 {attr}={ref}")
    if re.search(r"<link\b[^>]*rel=[\"']stylesheet", html, re.I):
        out.append(f"{name}: 외부 스타일시트 링크가 남았습니다")
    if SPRITE_REF_RE.search(html):
        out.append(f"{name}: 아이콘 sprite 파일 참조가 남았습니다")
    return out


def build(sources: list[Path]) -> dict[str, str]:
    names = {source.name for source in sources}
    return {source.name: build_page(source, names) for source in sources}


def check_examples() -> list[str]:
    """check_design.py(J17)가 부른다. 예제가 모두 자기완결 단일 파일로 만들어지는지 확인한다."""
    sources = [EXAMPLES / name for name in DEFAULT_PAGES]
    try:
        pages = build(sources)
    except StandaloneError as exc:
        return [str(exc)]
    names = set(pages)
    found: list[str] = []
    for name, html in pages.items():
        found.extend(problems_in(html, name, names))
    return found


def main() -> int:
    parser = argparse.ArgumentParser(description="Jeju standalone HTML builder")
    parser.add_argument("pages", nargs="*", help="단일 파일로 만들 HTML(생략하면 design/examples의 예제 전부)")
    parser.add_argument("--out", default=str(DEFAULT_OUT), help="출력 폴더")
    parser.add_argument("--check", action="store_true", help="파일을 쓰지 않고 자기완결성만 확인")
    args = parser.parse_args()

    if args.check:
        found = check_examples()
        for line in found:
            print("FAIL", line)
        if not found:
            print(f"PASS: 예제 {len(DEFAULT_PAGES)}종이 자기완결 단일 파일로 만들어집니다.")
        return 1 if found else 0

    sources = [Path(p).resolve() for p in args.pages] or [EXAMPLES / name for name in DEFAULT_PAGES]
    try:
        pages = build(sources)
    except StandaloneError as exc:
        print(f"FAIL: {exc}", file=sys.stderr)
        return 1
    out = Path(args.out).resolve()
    out.mkdir(parents=True, exist_ok=True)
    names = set(pages)
    warnings = 0
    for name, html in pages.items():
        for problem in problems_in(html, name, names):
            print("WARN", problem)
            warnings += 1
        target = out / name
        with target.open("w", encoding="utf-8", newline="\n") as handle:
            handle.write(html)
        print(f"{target}  {len(html.encode('utf-8')) // 1024}KB")
    for message in dict.fromkeys(WARNINGS):
        print("WARN", message)
        warnings += 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
