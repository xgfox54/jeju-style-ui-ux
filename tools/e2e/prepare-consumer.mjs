#!/usr/bin/env node
// 레지스트리 검증용 소비 프로젝트를 준비한다. CI(.github/workflows/check.yml)와 로컬이 같은 절차를 쓴다.
//
//   node prepare-consumer.mjs registry <프로젝트>   # components.json에 @jeju 레지스트리 등록
//   node prepare-consumer.mjs items                 # 설치할 항목 목록(@jeju/...) 출력
//   node prepare-consumer.mjs finish <프로젝트>     # 전역 CSS 정리 · 다크 모드 제거 · 검증 앱 복사
//
// 레지스트리 주소는 JEJU_REGISTRY_URL(기본 http://127.0.0.1:8765/public/r/{name}.json)로 바꾼다.
import { copyFileSync, existsSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const here = dirname(fileURLToPath(import.meta.url))
const repo = resolve(here, "..", "..")
const [command, target = "."] = process.argv.slice(2)
const project = resolve(target)
const registryUrl = process.env.JEJU_REGISTRY_URL ?? "http://127.0.0.1:8765/public/r/{name}.json"

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"))
}

if (command === "registry") {
  const path = join(project, "components.json")
  const config = readJson(path)
  config.registries = { ...(config.registries ?? {}), "@jeju": registryUrl }
  writeFileSync(path, JSON.stringify(config, null, 2) + "\n")
  console.log("@jeju → " + registryUrl)
} else if (command === "items") {
  const index = readJson(join(repo, "registry.json"))
  const skip = new Set(["jeju-style", "jeju-tokens", "jeju-theme"])
  const names = index.items.filter((item) => !skip.has(item.name)).map((item) => "@jeju/" + item.name)
  console.log(names.join(" "))
} else if (command === "finish") {
  const config = readJson(join(project, "components.json"))
  const cssPath = join(project, config.tailwind.css)
  let css = readFileSync(cssPath, "utf8")
  css = css.replace(/^@import "@fontsource-variable\/geist";\r?\n/m, "")
  css = css.replace(/^@custom-variant dark[^\n]*\n\n?/m, "")
  css = css.replace(/^\.dark \{[\s\S]*?^\}\n\n?/m, "")
  if (!css.includes("jeju-tokens.css")) {
    css = css.replace(/(@import "shadcn\/tailwind\.css";\r?\n)/, '$1@import "../styles/jeju-tokens.css" layer(base);\n')
  }
  writeFileSync(cssPath, css)

  const main = join(project, "src", "main.tsx")
  if (existsSync(main)) {
    let code = readFileSync(main, "utf8")
    code = code.replace(/^import \{ ThemeProvider \}[^\n]*\n/m, "")
    code = code.replace(/<ThemeProvider>\s*/g, "").replace(/\s*<\/ThemeProvider>/g, "")
    writeFileSync(main, code)
  }
  rmSync(join(project, "src", "components", "theme-provider.tsx"), { force: true })

  copyFileSync(join(here, "App.tsx"), join(project, "src", "App.tsx"))
  copyFileSync(join(here, "verify-react.mjs"), join(project, "verify-react.mjs"))
  copyFileSync(join(here, "verify-browsers.mjs"), join(project, "verify-browsers.mjs"))
  const html = join(project, "index.html")
  if (existsSync(html)) writeFileSync(html, readFileSync(html, "utf8").replace('<html lang="en">', '<html lang="ko">'))
  console.log("준비 완료: " + project)
} else {
  console.error("사용법: node prepare-consumer.mjs registry|items|finish [프로젝트]")
  process.exit(2)
}
