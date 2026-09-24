import { chromium, firefox, webkit } from "playwright"
import { mkdirSync, writeFileSync } from "node:fs"
import { fileURLToPath } from "node:url"

// 다른 브라우저 엔진 점검. verify-react.mjs(Microsoft Edge 전체 점검)와 같은 환경에서 Firefox · WebKit(Safari 엔진)으로 핵심만 다시 본다.
// 준비: npx playwright install firefox webkit. 엔진은 JEJU_ENGINES=firefox,webkit(기본)로 고른다. 사용법은 tools/e2e/README.md.
// WebKit은 버튼을 눌러도 포커스를 주지 않으므로 키보드 동작은 focus() 뒤 Enter로 확인한다.
const BASE = process.env.JEJU_APP_URL ?? "http://127.0.0.1:4173/"
const TIER1 = process.env.JEJU_TIER1_URL ?? "http://127.0.0.1:8765/design/examples/"
const ENGINES = (process.env.JEJU_ENGINES ?? "firefox,webkit").split(",").map((name) => name.trim()).filter(Boolean)
const LAUNCHERS = { chromium, firefox, webkit }
const SHOTS = new URL("./shots/browsers/", import.meta.url)
mkdirSync(SHOTS, { recursive: true })
const shot = (name) => fileURLToPath(new URL(name, SHOTS))
const out = { checks: [], console: [] }
const routes = ["work", "form", "public", "gallery"]
const tier1Pages = ["index", "work", "list", "form", "public"]
let engine = ""

function check(name, pass, detail = "") {
  out.checks.push({ engine, name, pass: !!pass, detail: String(detail) })
}

async function openPage(browser, url, width = 1440) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 }, locale: "ko-KR" })
  const page = await ctx.newPage()
  page.on("console", (m) => {
    if (m.type() === "error" && !/favicon/i.test(m.text())) out.console.push(engine + " " + url + "@" + width + ": " + m.text().slice(0, 240))
  })
  page.on("pageerror", (e) => out.console.push(engine + " " + url + "@" + width + " pageerror: " + e.message))
  await page.goto(url)
  await page.waitForLoadState("networkidle")
  await page.waitForTimeout(250)
  return { ctx, page }
}

const activeName = (page) => page.evaluate(() => {
  const el = document.activeElement
  return el ? el.id || el.getAttribute("aria-label") || el.getAttribute("data-slot") || el.textContent.trim().slice(0, 30) : null
})
const px = (value) => Math.round(parseFloat(value))

async function press(locator, key = "Enter") {
  await locator.focus()
  await locator.press(key)
}

for (const name of ENGINES) {
  engine = name
  const launcher = LAUNCHERS[name]
  if (!launcher) {
    check("엔진 이름", false, name + "은(는) chromium · firefox · webkit 중 하나여야 합니다")
    continue
  }
  const browser = await launcher.launch()
  const version = browser.version()

  // 1) 가로 넘침: React 4화면 · Tier 1 예제 5종 × 390 · 1440
  for (const width of [390, 1440]) {
    const failures = []
    for (const route of routes) {
      const { ctx, page } = await openPage(browser, BASE + "#/" + route, width)
      const [sw, cw] = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth])
      if (sw > cw) failures.push("React " + route + " " + sw + ">" + cw)
      if (route === "work") await page.screenshot({ path: shot(name + "-react-work-" + width + ".png") })
      await ctx.close()
    }
    for (const page_ of tier1Pages) {
      const { ctx, page } = await openPage(browser, TIER1 + page_ + ".html", width)
      const [sw, cw] = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth])
      if (sw > cw) failures.push("Tier 1 " + page_ + " " + sw + ">" + cw)
      if (page_ === "list" || page_ === "public") await page.screenshot({ path: shot(name + "-tier1-" + page_ + "-" + width + ".png"), fullPage: page_ === "list" })
      await ctx.close()
    }
    check("가로 넘침 없음 @" + width + " (React 4화면 · Tier 1 예제 5종)", failures.length === 0, failures.join(" | "))
  }

  // 2) 프로필 치수: 업무 입력 36px · 본문 14px / 대민 검색 상자 48px · 본문 17px
  {
    const sizes = {}
    for (const [key, url, selector] of [
      ["tier1Work", TIER1 + "form.html", ".jeju-field input"],
      ["tier1WorkSelect", TIER1 + "form.html", ".jeju-field select"],
      ["tier1WorkDate", TIER1 + "work.html", ".jeju-field input[type=date]"],
      ["tier1Public", TIER1 + "public.html", ".jeju-service-search input[type=search]"],
      ["reactWork", BASE + "#/form", "input[data-slot=input]"],
      ["reactPublic", BASE + "#/public", "input[type=search]"],
    ]) {
      const { ctx, page } = await openPage(browser, url)
      sizes[key] = await page.evaluate((sel) => {
        const input = document.querySelector(sel)
        // 검색 입력은 테두리가 있는 검색 상자 안에 있으므로 상자 높이를 잰다.
        const box = input && input.type === "search" ? input.parentElement : input
        return [box ? box.getBoundingClientRect().height : 0, getComputedStyle(document.body).fontSize]
      }, selector)
      await ctx.close()
    }
    check("프로필 치수: 업무 입력 · 선택 · 날짜 36px · 본문 14px, 대민 검색 상자 48px · 본문 17px (Tier 1 · React)",
      px(sizes.tier1Work[0]) === 36 && px(sizes.tier1WorkSelect[0]) === 36 && px(sizes.tier1WorkDate[0]) === 36 && sizes.tier1Work[1] === "14px" &&
        px(sizes.tier1Public[0]) === 48 && sizes.tier1Public[1] === "17px" &&
        px(sizes.reactWork[0]) === 36 && sizes.reactWork[1] === "14px" && px(sizes.reactPublic[0]) === 48 && sizes.reactPublic[1] === "17px",
      JSON.stringify(sizes))
  }

  // 3) Tier 1 업무 예제: 상세 패널 · 메뉴 키보드
  {
    const { ctx, page } = await openPage(browser, TIER1 + "work.html")
    await press(page.getByRole("button", { name: "IC-2609128 상세 보기" }))
    await page.waitForTimeout(250)
    const panel = await page.evaluate(() => {
      const dialog = document.getElementById("detail-panel")
      return [dialog.open, Math.round(dialog.getBoundingClientRect().width), dialog.querySelector("h2").textContent]
    })
    await page.keyboard.press("Escape")
    await page.waitForTimeout(250)
    const back = await activeName(page)
    check("Tier 1 상세 패널: Enter로 열기 · 폭 480px · 행 값 · Esc 후 연 버튼으로 포커스 복귀",
      panel[0] && panel[1] === 480 && panel[2].includes("IC-2609128") && back === "IC-2609128 상세 보기", JSON.stringify({ panel, back }))

    const trigger = page.locator("[data-jeju-menu-trigger]").first()
    await press(trigger, "ArrowDown")
    await page.waitForTimeout(150)
    const opened = [await page.locator(".jeju-menu").first().isVisible(), await page.evaluate(() => document.activeElement?.getAttribute("role"))]
    await page.keyboard.press("Escape")
    await page.waitForTimeout(150)
    const closed = [await page.locator(".jeju-menu").first().isVisible(), await activeName(page)]
    check("Tier 1 메뉴: 아래 화살표로 열기 · 첫 항목 포커스 · Esc 후 트리거로 복귀",
      opened[0] && opened[1] === "menuitem" && !closed[0] && String(closed[1]).includes("목록 도구"), JSON.stringify({ opened, closed }))
    await ctx.close()
  }

  // 4) Tier 1 서버 목록: 정렬 링크 · 상세 불러오기 · 다시 시도 포커스
  {
    const { ctx, page } = await openPage(browser, TIER1 + "list.html")
    await page.locator("th[data-sort-key=days] a").click()
    await page.waitForLoadState("load")
    await page.waitForTimeout(200)
    const sorted = [await page.locator("th[data-sort-key=days]").getAttribute("aria-sort"), (await page.locator("#request-list tbody tr").first().locator("td").last().textContent()).trim()]
    await page.getByRole("link", { name: "2페이지" }).click()
    await page.waitForLoadState("load")
    await page.waitForTimeout(200)
    const paged = await page.evaluate(() => [document.querySelector("[data-list-pagination] [aria-current=page]")?.textContent, document.querySelector("[data-list-summary]").textContent])
    check("Tier 1 서버 목록: 정렬 링크 → aria-sort · 서버 정렬, 2페이지 링크 → aria-current · 요약",
      sorted[0] === "ascending" && sorted[1] === "1일" && paged[0] === "2" && paged[1].includes("11–20"), JSON.stringify({ sorted, paged }))

    const region = page.locator("#request-detail")
    const links = page.locator("#request-list .jeju-table__link")
    await press(links.nth(0))
    await page.waitForTimeout(100)
    const loading = [await region.getAttribute("aria-busy"), await region.locator("[data-jeju-async-view=loading]").isVisible()]
    await page.waitForTimeout(900)
    const ready = [await region.locator("[data-jeju-async-view=ready]").isVisible(), await region.locator("[data-jeju-async-live]").textContent()]
    await page.keyboard.press("Escape")
    await page.waitForTimeout(200)
    await page.evaluate(() => { document.getElementById("demo-detail-fail").checked = true })
    const failId = (await links.nth(1).textContent()).trim()
    await press(links.nth(1))
    await page.waitForTimeout(900)
    const failed = await region.locator("[data-jeju-async-view=error]").isVisible()
    await page.evaluate(() => { document.getElementById("demo-detail-fail").checked = false })
    await press(region.getByRole("button", { name: "다시 시도" }))
    const retryFocus = await activeName(page)
    await page.waitForTimeout(900)
    const recovered = await region.locator("[data-jeju-async-view=ready]").isVisible()
    await page.keyboard.press("Escape")
    await page.waitForTimeout(200)
    const back = await activeName(page)
    check("Tier 1 상세 불러오기: 불러오는 중 → 완료 문구, 실패 → 다시 시도(포커스는 영역으로) → 완료, Esc 후 포커스 복귀",
      loading[0] === "true" && loading[1] && ready[0] && ready[1].includes("불러왔습니다") && failed && retryFocus === "request-detail" && recovered && back === failId + " 상세 보기",
      JSON.stringify({ loading, ready, failed, retryFocus, recovered, back }))

    await page.emulateMedia({ media: "print" })
    const printed = await page.evaluate(() => ["gnb", "lnb", "pagination"].map((name) => getComputedStyle(document.querySelector(".jeju-" + name)).display).concat(getComputedStyle(document.querySelector(".jeju-print-header")).display))
    check("Tier 1 인쇄: 셸 · 페이지 이동 숨김, 인쇄 머리글 표시", printed.join() === "none,none,none,block", printed.join())
    await ctx.close()
  }

  // 5) Tier 1 대민: 서비스 검색 결과 없음
  {
    const { ctx, page } = await openPage(browser, TIER1 + "public.html")
    await page.locator(".jeju-service-search input[type=search]").fill("없는서비스이름")
    await page.waitForTimeout(300)
    const status = await page.locator("#service-list [role=status]").first().textContent()
    const empty = await page.locator("#service-list").getByText("조건에 맞는 서비스가 없습니다").first().isVisible()
    check("Tier 1 대민 서비스 검색: 입력하면 바로 걸러 결과 없음을 문구로 알림", status.includes("없습니다") && empty, status)
    await ctx.close()
  }

  // 6) React: 상세 패널 · 로딩·오류 상태 · 표 정렬 · 인쇄
  {
    const { ctx, page } = await openPage(browser, BASE + "#/work")
    await press(page.getByRole("button", { name: "IC-2609128 상세 보기" }))
    await page.waitForTimeout(400)
    const shown = await page.getByRole("dialog").isVisible()
    await page.keyboard.press("Escape")
    await page.waitForTimeout(400)
    const back = await activeName(page)
    check("React 상세 패널: Enter로 열기 · Esc 후 연 버튼으로 포커스 복귀", shown && back === "IC-2609128 상세 보기", JSON.stringify({ shown, back }))

    await page.locator("th", { hasText: "관리번호" }).locator("button").click()
    const sort = await page.locator("th", { hasText: "관리번호" }).first().getAttribute("aria-sort")
    check("React 데이터 표: 정렬 버튼 → aria-sort=ascending", sort === "ascending", sort)

    await page.emulateMedia({ media: "print" })
    const printed = await page.evaluate(() => {
      const shell = document.querySelector("[data-slot=work-shell]")
      return [getComputedStyle(shell.querySelector("header")).display, getComputedStyle(document.querySelector("[data-slot=pagination]")).display]
    })
    check("React 인쇄: 머리 · 페이지 이동 숨김", printed.join() === "none,none", printed.join())
    await ctx.close()
  }
  {
    const { ctx, page } = await openPage(browser, BASE + "#/gallery")
    await page.getByRole("button", { name: "오류 상태" }).click()
    await press(page.locator("[data-slot=async-state]").getByRole("button", { name: "다시 시도" }))
    const focus = await page.evaluate(() => document.activeElement?.getAttribute("data-slot"))
    const busy = await page.locator("[data-slot=async-state]").getAttribute("aria-busy")
    check("React 로딩·오류 상태: 다시 시도(키보드) → 불러오는 중 · 포커스는 상태 영역으로", focus === "async-state" && busy === "true", JSON.stringify({ focus, busy }))
    await ctx.close()
  }

  out.checks.filter((item) => item.engine === name).forEach((item) => { item.version = version })
  await browser.close()
}

writeFileSync(shot("results.json"), JSON.stringify(out, null, 2))
const failed = out.checks.filter((item) => !item.pass)
for (const name of ENGINES) {
  const mine = out.checks.filter((item) => item.engine === name)
  console.log(name + " " + (mine[0]?.version ?? "") + ": " + mine.filter((item) => item.pass).length + "/" + mine.length + " PASS")
}
for (const item of out.checks) console.log((item.pass ? "PASS " : "FAIL ") + "[" + item.engine + "] " + item.name + (item.pass ? "" : "  ← " + item.detail))
console.log("console:", out.console.length ? out.console.join("\n") : "오류 없음")
if (failed.length || out.console.length) process.exitCode = 1
