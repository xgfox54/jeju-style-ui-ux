#!/usr/bin/env python3
"""Jeju Design System token document builder.

stdlib only. design/jeju-tokens.css를 읽어 docs/tokens.md(토큰 표)를 만든다.
값의 원천은 토큰 파일 하나이고, 이 문서는 사람이 찾아보기 위한 생성물이다. 직접 고치지 않는다.

Usage:
  python tools/build_token_docs.py          # docs/tokens.md 생성
  python tools/build_token_docs.py --check  # 문서가 토큰 파일과 같은지 확인(check_design.py J19가 부른다)
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TOKENS = ROOT / "design" / "jeju-tokens.css"
OUT = ROOT / "docs" / "tokens.md"

DECL_START_RE = re.compile(r"^(--jeju-[\w-]+)\s*:\s*(.*)$")
HEX_RE = re.compile(r"^#[0-9a-fA-F]{6}$")
VAR_RE = re.compile(r"^var\((--jeju-[\w-]+)\)$")
WHITE = "#ffffff"


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8").replace("\r\n", "\n")


def block_after(text: str, start: int) -> str:
    """start 이후 첫 '{'부터 짝이 맞는 '}'까지의 내용을 돌려준다."""
    open_at = text.index("{", start)
    depth = 0
    for index in range(open_at, len(text)):
        if text[index] == "{":
            depth += 1
        elif text[index] == "}":
            depth -= 1
            if depth == 0:
                return text[open_at + 1:index]
    raise ValueError("중괄호 짝이 맞지 않습니다.")


def clean_comment(raw: str) -> str:
    lines = []
    for line in raw.split("\n"):
        line = line.strip().lstrip("/*").rstrip("*/").strip().lstrip("*").strip()
        if not line or re.fullmatch(r"[-=]+", line):
            continue
        lines.append(line)
    return " ".join(lines)


def parse_block(body: str) -> list[dict]:
    """블록을 섹션 목록으로 나눈다. 섹션 = {title, note, tokens: [(name, value, comment)]}"""
    sections: list[dict] = [{"title": "", "note": "", "tokens": []}]
    lines = body.split("\n")
    index = 0
    while index < len(lines):
        line = lines[index].strip()
        if line.startswith("/*"):
            raw = line
            while "*/" not in raw and index + 1 < len(lines):
                index += 1
                raw += "\n" + lines[index].strip()
            text = clean_comment(raw)
            title, _, note = text.partition(" — ")
            sections.append({"title": title.strip(), "note": note.strip(), "tokens": []})
        else:
            match = DECL_START_RE.match(line)
            if match:
                name, rest = match.groups()
                while ";" not in rest and index + 1 < len(lines):
                    index += 1
                    rest += " " + lines[index].strip()
                value, _, tail = rest.partition(";")
                comment = ""
                found = re.search(r"/\*(.*?)\*/", tail)
                if found:
                    comment = found.group(1).strip()
                sections[-1]["tokens"].append((name, " ".join(value.split()), comment))
        index += 1
    return [section for section in sections if section["tokens"]]


def luminance(hex_value: str) -> float:
    def channel(part: str) -> float:
        value = int(part, 16) / 255
        return value / 12.92 if value <= 0.04045 else ((value + 0.055) / 1.055) ** 2.4

    r, g, b = (channel(hex_value[i:i + 2]) for i in (1, 3, 5))
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contrast(a: str, b: str) -> float:
    la, lb = sorted((luminance(a), luminance(b)), reverse=True)
    return (la + 0.05) / (lb + 0.05)


def resolve(value: str, table: dict[str, str], depth: int = 0) -> str:
    match = VAR_RE.match(value)
    if match and depth < 8 and match.group(1) in table:
        return resolve(table[match.group(1)], table, depth + 1)
    return value


def code(value: str) -> str:
    return "`" + value.replace("|", "\\|") + "`"


def build() -> str:
    text = read(TOKENS)
    root_body = block_after(text, text.index(":root"))
    public_at = text.find('[data-jeju-profile="public"]')
    public_body = block_after(text, public_at) if public_at >= 0 else ""
    contrast_at = text.find("prefers-contrast: more")
    contrast_body = block_after(text, text.index(":root", contrast_at)) if contrast_at >= 0 else ""

    sections = parse_block(root_body)
    public = {name: (value, comment) for section in parse_block(public_body) for name, value, comment in section["tokens"]}
    high_contrast = {name: value for section in parse_block(contrast_body) for name, value, _ in section["tokens"]}
    table = {name: value for section in sections for name, value, _ in section["tokens"]}
    public_table = dict(table, **{name: value for name, (value, _) in public.items()})
    version = re.search(r"jeju-tokens\.css\s+—.*?(v\d+\.\d+\.\d+)", text)

    out: list[str] = []
    out.append("# 디자인 토큰 목록")
    out.append("")
    out.append("> 자동 생성 문서다. `tools/build_token_docs.py`가 `design/jeju-tokens.css`" + (f"({version.group(1)})" if version else "") + "에서 만든다. 직접 고치지 않는다. 값을 바꾸려면 토큰 파일을 고친 뒤 `python tools/build_token_docs.py`를 실행한다. 검사 규칙 J19가 이 문서와 토큰 파일이 같은지 확인한다.")
    out.append("")
    out.append(f"- 토큰 {len(table)}개. 대민 프로필(`data-jeju-profile=\"public\"`)에서 값이 바뀌는 토큰 {len(public)}개, 고대비 설정에서 바뀌는 토큰 {len(high_contrast)}개")
    out.append("- 대민 열이 비어 있으면 업무와 같은 값이다. 대민 프로필은 색을 바꾸지 않고 치수와 글자 크기만 바꾼다.")
    out.append("- 흰색 대비는 그 색과 흰색(`#ffffff`)의 명도 대비다. 흰 배경 위 글자나 그 색 위의 흰 글자에 쓸 수 있는지 판단할 때 본다. 일반 크기 글자는 4.5:1 이상이어야 한다.")
    out.append("- 서비스 코드에서는 값을 복사하지 않고 `var(--jeju-*)`로 참조한다.")

    for number, section in enumerate(sections, start=1):
        rows = []
        has_color = False
        for name, value, comment in section["tokens"]:
            resolved = resolve(value, table)
            ratio = ""
            if HEX_RE.match(resolved):
                has_color = True
                ratio = f"{contrast(resolved, WHITE):.2f}:1"
            shown = code(value) + (f" → {code(resolved.lower())}" if resolved != value else "")
            public_value, public_comment = public.get(name, ("", ""))
            public_shown = code(public_value) if public_value else ""
            if not public_value:
                derived = resolve(value, public_table)
                if derived != resolved:
                    public_shown = "→ " + code(derived)
            note = comment
            if public_comment:
                note = (note + " · " if note else "") + "대민: " + public_comment
            rows.append((code(name), shown, public_shown, ratio, note))
        out.append("")
        out.append(f"## {number}. {section['title'] or '기타'}")
        out.append("")
        if section["note"]:
            out.append(section["note"])
            out.append("")
        if has_color:
            out.append("| 토큰 | 업무(기본) | 대민 | 흰색 대비 | 설명 |")
            out.append("|---|---|---|---:|---|")
            out.extend(f"| {a} | {b} | {c} | {d} | {e} |" for a, b, c, d, e in rows)
        else:
            out.append("| 토큰 | 업무(기본) | 대민 | 설명 |")
            out.append("|---|---|---|---|")
            out.extend(f"| {a} | {b} | {c} | {e} |" for a, b, c, _, e in rows)

    if high_contrast:
        out.append("")
        out.append(f"## {len(sections) + 1}. 고대비 설정에서 바뀌는 값")
        out.append("")
        out.append("운영체제나 브라우저에서 대비 높이기(`prefers-contrast: more`)를 켜면 다음 값으로 바뀐다.")
        out.append("")
        out.append("| 토큰 | 기본 | 고대비 |")
        out.append("|---|---|---|")
        for name, value in high_contrast.items():
            out.append(f"| {code(name)} | {code(table.get(name, ''))} | {code(value)} |")
    return "\n".join(out) + "\n"


def check() -> list[str]:
    """check_design.py(J19)가 부른다. 문제 문장 목록을 돌려준다."""
    try:
        expected = build()
    except (OSError, ValueError) as exc:
        return [f"토큰 문서를 만들지 못했습니다: {exc}"]
    if not OUT.exists():
        return ["docs/tokens.md가 없습니다. python tools/build_token_docs.py를 실행하세요."]
    if read(OUT) != expected:
        return ["docs/tokens.md가 토큰 파일과 다릅니다. python tools/build_token_docs.py를 실행하세요."]
    return []


def main() -> int:
    parser = argparse.ArgumentParser(description="Jeju token document builder")
    parser.add_argument("--check", action="store_true", help="문서를 쓰지 않고 최신인지만 확인")
    args = parser.parse_args()
    if args.check:
        problems = check()
        for problem in problems:
            print("FAIL", problem)
        if not problems:
            print("PASS: 토큰 문서가 최신입니다.")
        return 1 if problems else 0
    content = build()
    OUT.parent.mkdir(parents=True, exist_ok=True)
    with OUT.open("w", encoding="utf-8", newline="\n") as handle:
        handle.write(content)
    print(f"{OUT}  토큰 문서 생성")
    return 0


if __name__ == "__main__":
    sys.exit(main())
