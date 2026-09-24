import { chromium } from "playwright"
import { mkdirSync, writeFileSync } from "node:fs"
import { fileURLToPath, pathToFileURL } from "node:url"

// 사용법: tools/e2e/README.md · standalone 검증은 JEJU_STANDALONE_DIR(예: <저장소>/dist/standalone)이 필요하다
const BASE = process.env.JEJU_APP_URL ?? "http://127.0.0.1:4173/"
const TIER1 = process.env.JEJU_TIER1_URL ?? "http://127.0.0.1:8765/design/examples/"
const CHANNEL = process.env.JEJU_BROWSER ?? "msedge"
const SHOTS = new URL("./shots/", import.meta.url)
mkdirSync(SHOTS, { recursive: true })
const shot = (name) => fileURLToPath(new URL(name, SHOTS))
const routes = ["work", "form", "public", "gallery"]
const tier1Pages = ["index", "work", "list", "form", "public"]
const widths = [390, 768, 1024, 1440, 1920]
const out = { overflow: [], checks: [], console: [] }
const browser = await chromium.launch(CHANNEL === "chromium" ? {} : { channel: CHANNEL })

function check(name, pass, detail = "") {
  out.checks.push({ name, pass: !!pass, detail: String(detail) })
}

async function open(route, width, extra = {}) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 }, locale: "ko-KR", ...extra })
  const page = await ctx.newPage()
  page.on("console", (m) => {
    if (m.type() === "error" || m.type() === "warning") out.console.push(route + "@" + width + " " + m.type() + ": " + m.text().slice(0, 300))
  })
  page.on("pageerror", (e) => out.console.push(route + "@" + width + " pageerror: " + e.message))
  await page.goto(BASE + "#/" + route)
  await page.waitForLoadState("networkidle")
  await page.waitForTimeout(250)
  return { ctx, page }
}

const px = (v) => Math.round(parseFloat(v))

// 대상 크기: 업무(프로필 없음) WCAG 2.2 SC 2.5.8 24px, 대민 KRDS 권장 44px.
// 업무는 기준보다 작아도 "중심에 지름 24px 원을 그렸을 때 다른 대상·다른 작은 대상의 원과 겹치지 않으면" 통과(WCAG 간격 예외).
// 대민은 KRDS 권장대로 실제로 누를 수 있는 영역 자체가 44×44px 이상이어야 한다(간격 예외 없음).
// 체크박스·라디오·스위치는 연결된 라벨까지 누를 수 있는 영역으로 본다. 문장 속 링크(inline)는 예외.
async function targetSizeFailures(page) {
  return page.evaluate(() => {
    const strict = document.documentElement.getAttribute("data-jeju-profile") === "public"
    const min = strict ? 44 : 24
    const sel = 'a[href], button, input:not([type=hidden]), select, textarea, summary, [role=button], [role=checkbox], [role=radio], [role=switch], [role=tab], [role=menuitem], [role=option], label[for]'
    const visible = (el) => {
      const r = el.getBoundingClientRect()
      if (r.width < 2 || r.height < 2) return false
      const s = getComputedStyle(el)
      if (s.visibility === "hidden" || s.pointerEvents === "none" || Number(s.opacity) === 0) return false
      if (el.closest("[hidden], [aria-hidden=true], [inert]")) return false
      for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
        const ps = getComputedStyle(p), pr = p.getBoundingClientRect()
        if (ps.display === "none" || ps.visibility === "hidden") return false
        if ((ps.clipPath && ps.clipPath.includes("inset(50%")) || ((pr.width <= 1 || pr.height <= 1) && ps.overflow !== "visible")) return false
      }
      if (el.disabled || el.getAttribute("aria-disabled") === "true") return false
      return true
    }
    const isInlineLink = (el) => {
      if (el.tagName !== "A" || getComputedStyle(el).display !== "inline") return false
      const block = el.parentElement
      return !!block && block.textContent.trim().length > el.textContent.trim().length + 1
    }
    const labelFor = (el) => {
      if (el.id) { const l = document.querySelector('label[for="' + CSS.escape(el.id) + '"]'); if (l) return l }
      return el.closest("label")
    }
    const union = (a, b) => ({ left: Math.min(a.left, b.left), top: Math.min(a.top, b.top), right: Math.max(a.right, b.right), bottom: Math.max(a.bottom, b.bottom) })
    const seen = new Set()
    const targets = []
    for (const el of document.querySelectorAll(sel)) {
      if (el.tagName === "LABEL") {
        const control = document.getElementById(el.getAttribute("for"))
        if (!control || control.getBoundingClientRect().width > 2 || !visible(el) && el.getBoundingClientRect().width < 2) continue
        if (el.closest("[hidden]") || getComputedStyle(el).visibility === "hidden") continue
      } else if (!visible(el)) continue
      if (isInlineLink(el)) continue
      let rect = el.getBoundingClientRect()
      rect = { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom }
      const role = el.getAttribute("role")
      if (el.type === "checkbox" || el.type === "radio" || role === "checkbox" || role === "radio" || role === "switch") {
        const label = labelFor(el)
        if (label && visible(label)) { rect = union(rect, label.getBoundingClientRect()); seen.add(label) }
      }
      targets.push({ el, rect })
    }
    const list = targets.filter((t) => !seen.has(t.el))
    const size = (t) => [t.rect.right - t.rect.left, t.rect.bottom - t.rect.top]
    const center = (t) => [(t.rect.left + t.rect.right) / 2, (t.rect.top + t.rect.bottom) / 2]
    const small = list.filter((t) => { const [w, h] = size(t); return w < min - 0.5 || h < min - 0.5 })
    const out = []
    for (const t of small) {
      const [cx, cy] = center(t)
      const r = min / 2
      let clash = strict ? { el: { textContent: "KRDS 44px", getAttribute: () => null, tagName: "" } } : null
      for (const o of strict ? [] : list) {
        if (o === t || o.el.contains(t.el) || t.el.contains(o.el)) continue
        const dx = Math.max(o.rect.left - cx, 0, cx - o.rect.right)
        const dy = Math.max(o.rect.top - cy, 0, cy - o.rect.bottom)
        const isSmall = small.includes(o)
        const [ox, oy] = center(o)
        if (Math.hypot(dx, dy) < r - 0.5 || (isSmall && Math.hypot(ox - cx, oy - cy) < min - 0.5)) { clash = o; break }
      }
      if (clash) {
        const [w, h] = size(t)
        const name = (t.el.getAttribute("aria-label") || t.el.textContent || t.el.getAttribute("placeholder") || t.el.tagName).trim().replace(/\s+/g, " ").slice(0, 24)
        const other = (clash.el.getAttribute("aria-label") || clash.el.textContent || clash.el.tagName).trim().replace(/\s+/g, " ").slice(0, 16)
        out.push(name + " " + Math.round(w) + "×" + Math.round(h) + " ↔ " + other)
      }
    }
    return { min, count: list.length, failures: [...new Set(out)] }
  })
}

// 1) 가로 넘침 + 스크린샷
for (const route of routes) {
  for (const width of widths) {
    const { ctx, page } = await open(route, width)
    const m = await page.evaluate(() => {
      const cw = document.documentElement.clientWidth
      const offenders = []
      for (const el of document.querySelectorAll("body *")) {
        const r = el.getBoundingClientRect()
        if (r.width && r.right > cw + 1) {
          let p = el.parentElement, clipped = false
          while (p && p !== document.body) {
            const s = getComputedStyle(p)
            if (/(auto|scroll|hidden|clip)/.test(s.overflowX)) { clipped = true; break }
            p = p.parentElement
          }
          if (!clipped) offenders.push(el.tagName.toLowerCase() + "." + (el.getAttribute("data-slot") || el.className?.toString().slice(0, 40)) + " → " + Math.round(r.right))
        }
      }
      return { sw: document.documentElement.scrollWidth, cw, offenders: offenders.slice(0, 5) }
    })
    if (m.sw > m.cw) out.overflow.push({ route, width, ...m })
    if (width === 390 || width === 1440) await page.screenshot({ path: shot(route + "-" + width + ".png"), fullPage: true })
    await ctx.close()
  }
}

// 2) 계산 스타일 — 업무 프로필
{
  const { ctx, page } = await open("work", 1440)
  const s = await page.evaluate(() => {
    const byText = (sel, text) => [...document.querySelectorAll(sel)].find((el) => el.textContent.includes(text))
    const cs = (el) => getComputedStyle(el)
    const excel = byText("[data-slot=button]", "엑셀 내려받기")
    const primary = byText("[data-slot=button]", "대상자 등록")
    const th = document.querySelector("th[data-slot=table-head]:nth-child(2)")
    const done = byText("[data-slot=badge]", "완료")
    return {
      body: [cs(document.body).fontSize, cs(document.body).fontFamily.split(",")[0]],
      excelH: excel.getBoundingClientRect().height,
      primaryBg: cs(primary).backgroundColor,
      primaryColor: cs(primary).color,
      search: document.querySelector("[data-slot=search-field]").getBoundingClientRect().height,
      select: document.querySelector("#district").getBoundingClientRect().height,
      thBorder: [cs(th).borderTopWidth, cs(th).borderTopColor],
      badge: [cs(done).color, cs(done).backgroundColor],
      profile: document.documentElement.getAttribute("data-jeju-profile"),
    }
  })
  check("업무 본문 14px · Pretendard GOV 우선", s.body[0] === "14px" && s.body[1].includes("Pretendard GOV"), s.body)
  check("업무 버튼 높이 36px", px(s.excelH) === 36, s.excelH)
  check("업무 검색 입력 높이 36px", px(s.search) === 36, s.search)
  check("업무 select 높이 36px", px(s.select) === 36, s.select)
  check("Primary 버튼 = Jeju Blue + 흰 글자", s.primaryBg === "rgb(1, 115, 188)" && s.primaryColor === "rgb(255, 255, 255)", s.primaryBg + " / " + s.primaryColor)
  check("표 헤더 상단 2px Primary", s.thBorder[0] === "2px" && s.thBorder[1] === "rgb(1, 115, 188)", s.thBorder)
  check("완료 배지 = success 역할색", s.badge[0] === "rgb(0, 135, 98)" && s.badge[1] === "rgb(231, 247, 242)", s.badge)
  check("업무 화면은 프로필 속성 없음", s.profile === null, s.profile)

  // 포커스 링(키보드)
  await page.keyboard.press("Tab")
  await page.keyboard.press("Tab")
  const ring = await page.evaluate(() => [document.activeElement?.textContent?.trim().slice(0, 20), getComputedStyle(document.activeElement).boxShadow])
  check("키보드 포커스 링 = --jeju-focus-ring", /rgba\(1, 115, 188, 0\.22\)/.test(ring[1]), ring.join(" | "))

  // 정렬
  const sortBtn = page.locator("th", { hasText: "관리번호" }).locator("button")
  await sortBtn.click()
  let sort = await page.evaluate(() => [document.querySelector("th[aria-sort=ascending]")?.textContent, document.querySelector("tbody tr td:nth-child(2)")?.textContent, document.querySelector("th[aria-sort=ascending] svg")?.getAttribute("data-icon")])
  check("정렬 1회: ascending + 오름차순 + 아이콘 chevron-up", sort[0]?.includes("관리번호") && sort[1] === "IC-2609093" && sort[2] === "chevron-up", sort)
  await sortBtn.click()
  sort = await page.evaluate(() => [document.querySelector("th[aria-sort=descending]")?.textContent, document.querySelector("tbody tr td:nth-child(2)")?.textContent, document.querySelector("th[aria-sort=descending] svg")?.getAttribute("data-icon")])
  check("정렬 2회: descending + 내림차순 + 아이콘 chevron-down", sort[0]?.includes("관리번호") && sort[1] === "IC-2609128" && sort[2] === "chevron-down", sort)

  // 선택
  await page.getByRole("checkbox", { name: "현재 페이지 전체 선택" }).click()
  const bulk = await page.locator("[data-slot=bulk-bar]").textContent()
  check("전체 선택 → 일괄 작업 바 20건", bulk.includes("20건 선택됨"), bulk)
  await page.getByRole("checkbox", { name: "IC-2609128 선택" }).click()
  const mixed = await page.getByRole("checkbox", { name: "현재 페이지 전체 선택" }).getAttribute("aria-checked")
  check("일부 해제 → 전체 선택 indeterminate(mixed)", mixed === "mixed", mixed)
  await page.getByRole("button", { name: "선택 해제" }).click()

  // 메뉴 키보드
  const trigger = page.getByRole("button", { name: "목록 도구" })
  await trigger.focus()
  await page.keyboard.press("Enter")
  await page.waitForTimeout(150)
  const menuOpen = await page.getByRole("menu").isVisible()
  await page.keyboard.press("ArrowDown")
  const itemFocus = await page.evaluate(() => document.activeElement?.getAttribute("role"))
  await page.keyboard.press("Escape")
  await page.waitForTimeout(150)
  const back = await page.evaluate(() => document.activeElement?.textContent?.trim())
  check("메뉴: Enter로 열기 · 화살표 이동 · Esc 후 트리거로 포커스 복귀", menuOpen && itemFocus === "menuitem" && back === "목록 도구", [menuOpen, itemFocus, back])

  // 페이지 이동
  await page.getByRole("link", { name: "2페이지" }).click()
  const pg = await page.evaluate(() => [document.querySelector("[aria-current=page][data-slot=pagination-link]")?.textContent, document.querySelector("[data-slot=data-table] > div p")?.textContent])
  check("페이지 이동: 2페이지 aria-current + 21–36건", pg[0] === "2" && pg[1].includes("21–36"), pg)

  // 필터 칩
  await page.locator("#district").selectOption("동부")
  await page.getByRole("button", { name: "검색", exact: true }).click()
  const chip = await page.getByRole("button", { name: "지역 동부 조건 제거" }).count()
  await page.getByRole("button", { name: "지역 동부 조건 제거" }).click()
  const chipAfter = await page.getByRole("button", { name: "지역 동부 조건 제거" }).count()
  check("검색 조건 칩 표시 · 제거 버튼 이름 · 제거 동작", chip === 1 && chipAfter === 0, [chip, chipAfter])
  await ctx.close()
}

// 3) 업무 모바일
{
  const { ctx, page } = await open("work", 390)
  const toggle = page.getByRole("button", { name: "메뉴" })
  await toggle.click()
  await page.waitForTimeout(300)
  const dlg = page.getByRole("dialog")
  const links = await dlg.getByRole("navigation", { name: "업무 메뉴" }).getByRole("link").count()
  await page.keyboard.press("Escape")
  await page.waitForTimeout(300)
  const closed = !(await dlg.isVisible().catch(() => false))
  const back = await page.evaluate(() => document.activeElement?.textContent?.trim())
  check("390px: 메뉴 드로어 열기(링크 6) · Esc 닫기 · 토글로 포커스 복귀", links === 6 && closed && back === "메뉴", [links, closed, back])
  const stack = await page.evaluate(() => [getComputedStyle(document.querySelector("tbody tr")).display, getComputedStyle(document.querySelector("thead")).position, getComputedStyle(document.querySelector("tbody td:nth-child(2)"), "::before").content])
  check("560px 이하 표 카드형(thead 숨김 · td::before 라벨)", stack[0] === "block" && stack[1] === "absolute" && stack[2].includes("관리번호"), stack)
  await ctx.close()
}

// 4) 업무 폼
{
  const { ctx, page } = await open("form", 1440)
  const s = await page.evaluate(() => {
    const r = (sel) => document.querySelector(sel).getBoundingClientRect()
    return { input: r("#client-name").height, select: r("#client-district").height, check: r("#need-0").width, sw: [r("#urgent").width, r("#urgent").height] }
  })
  check("폼: 입력·선택 36px, 체크박스 18px, 스위치 44×24", px(s.input) === 36 && px(s.select) === 36 && px(s.check) === 18 && px(s.sw[0]) === 44 && px(s.sw[1]) === 24, JSON.stringify(s))

  await page.getByRole("button", { name: "등록", exact: true }).click()
  await page.waitForTimeout(200)
  const summary = await page.evaluate(() => [document.activeElement?.getAttribute("data-slot"), document.querySelectorAll("[data-slot=error-summary] a").length])
  check("빈 제출 → 오류 요약에 포커스 · 오류 5건", summary[0] === "error-summary" && summary[1] === 5, summary)
  await page.locator("[data-slot=error-summary] a").first().click()
  const jumped = await page.evaluate(() => [document.activeElement?.id, document.activeElement?.getAttribute("aria-invalid"), document.activeElement?.getAttribute("aria-describedby")])
  check("오류 요약 링크 → 해당 입력으로 포커스 · aria-invalid · describedby", jumped[0] === "client-name" && jumped[1] === "true" && jumped[2] === "client-name-error", jumped)

  const help = page.getByRole("button", { name: "상담 메모 작성 기준 보기" })
  // Radix 툴팁은 페이지가 스크롤되면 닫힌다. 스크롤을 먼저 끝낸 뒤 키보드로 포커스한다.
  await help.scrollIntoViewIfNeeded()
  await page.waitForTimeout(300)
  await page.locator("#memo").focus()
  await page.keyboard.press("Shift+Tab")
  await page.waitForTimeout(200)
  const tipShown = (await help.getAttribute("data-state"))?.includes("open") && (await page.getByRole("tooltip").count()) === 1
  await page.keyboard.press("Escape")
  await page.waitForTimeout(200)
  const tipHidden = (await help.getAttribute("data-state")) === "closed" && (await page.getByRole("tooltip").count()) === 0
  check("툴팁: 포커스로 열림 · Esc로 닫힘", tipShown && tipHidden, [tipShown, tipHidden])

  await page.locator("#client-birth").click()
  await page.waitForTimeout(200)
  const grid = await page.getByRole("grid").isVisible()
  await page.getByRole("grid").locator("button", { hasText: /^15$/ }).first().click()
  const birth = await page.locator("#client-birth").textContent()
  check("달력: 열기 · 날짜 선택 → YYYY-MM-DD", grid && /\d{4}-\d{2}-15/.test(birth), birth)

  await page.locator("#client-name").fill("김제주")
  await page.locator("#client-district").click()
  await page.getByRole("option", { name: "제주시 서부" }).click()
  await page.getByRole("radio", { name: "보통" }).click()
  await page.getByRole("checkbox", { name: "식사 지원" }).click()
  await page.getByRole("button", { name: "등록", exact: true }).click()
  await page.waitForTimeout(400)
  const ok = await page.evaluate(() => [document.querySelectorAll("[data-slot=error-summary]").length, document.body.textContent.includes("김제주 대상자를 등록했습니다")])
  check("정상 입력 → 오류 요약 사라짐 · 등록 토스트", ok[0] === 0 && ok[1], ok)

  const cancel = page.getByRole("button", { name: "작성 취소" })
  await cancel.click()
  await page.waitForTimeout(250)
  const ad = await page.getByRole("alertdialog").isVisible()
  await page.keyboard.press("Escape")
  await page.waitForTimeout(250)
  const adBack = await page.evaluate(() => document.activeElement?.textContent?.trim())
  check("확인 대화상자: 열기 · Esc 닫기 · 포커스 복귀", ad && adBack === "작성 취소", [ad, adBack])
  await ctx.close()
}

// 5) 대민
{
  const { ctx, page } = await open("public", 1440)
  const s = await page.evaluate(() => {
    const byText = (sel, text) => [...document.querySelectorAll(sel)].find((el) => el.textContent.includes(text))
    return {
      profile: document.documentElement.getAttribute("data-jeju-profile"),
      body: getComputedStyle(document.body).fontSize,
      lg: byText("[data-slot=button]", "서비스 찾기").getBoundingClientRect().height,
      prev: byText("[data-slot=button]", "이전 단계").getBoundingClientRect().height,
      acc: document.querySelector("[data-slot=accordion-trigger]").getBoundingClientRect().height,
      check: document.querySelector("#eligible-0").getBoundingClientRect().width,
    }
  })
  check("대민: data-jeju-profile=public · 본문 17px", s.profile === "public" && s.body === "17px", [s.profile, s.body])
  check("대민: lg 버튼 56px · 아코디언 제목 ≥56px · 체크박스 24px", px(s.lg) === 56 && px(s.prev) === 56 && px(s.acc) >= 56 && px(s.check) === 24, JSON.stringify(s))

  const triggers = page.locator("[data-slot=accordion-trigger]")
  const first = await triggers.nth(0).getAttribute("aria-expanded")
  await triggers.nth(0).focus()
  await page.keyboard.press("ArrowDown")
  const focusedSecond = await page.evaluate(() => document.activeElement?.textContent?.includes("비용"))
  await page.keyboard.press("Enter")
  await page.waitForTimeout(250)
  const states = [await triggers.nth(0).getAttribute("aria-expanded"), await triggers.nth(1).getAttribute("aria-expanded")]
  const heading = await triggers.nth(0).evaluate((el) => el.parentElement.tagName)
  check("아코디언: h3 안 버튼 · 아래 화살표 이동 · Enter로 열기(단일)", first === "true" && focusedSecond && states[0] === "false" && states[1] === "true" && heading === "H3", [first, focusedSecond, states, heading])

  await page.getByRole("button", { name: "다음 단계" }).click()
  await page.waitForTimeout(250)
  const wiz = await page.evaluate(() => [document.querySelector("li[aria-current=step]")?.textContent, document.querySelector("[data-slot=wizard] [role=progressbar]")?.getAttribute("aria-valuenow"), document.activeElement?.getAttribute("aria-label")])
  check("마법사: 다음 → 2단계 aria-current · 진행률 50 · 새 단계로 포커스", wiz[0]?.includes("서류 준비") && wiz[0]?.includes("현재 단계") && wiz[1] === "50" && wiz[2] === "2단계 서류 준비", wiz)
  await page.getByRole("button", { name: "다음 단계" }).click()
  const lastLabel = await page.locator("[data-slot=wizard] button").last().textContent()
  await page.getByRole("button", { name: "마지막 단계로" }).click()
  const endDisabled = await page.locator("[data-slot=wizard] button").last().isDisabled()
  check("마법사: 3단계에서 '마지막 단계로' · 끝에서 다음 비활성", lastLabel.includes("마지막 단계로") && endDisabled, [lastLabel, endDisabled])

  await ctx.close()
}
{
  const { ctx, page } = await open("public", 390)
  const toggle = page.getByRole("button", { name: "메뉴" })
  const h = (await toggle.boundingBox()).height
  await toggle.click()
  const expanded = await page.getByRole("button", { name: "닫기" }).getAttribute("aria-expanded")
  const navVisible = await page.getByRole("navigation", { name: "주요 메뉴" }).isVisible()
  await page.keyboard.press("Escape")
  await page.waitForTimeout(150)
  const after = [await page.getByRole("navigation", { name: "주요 메뉴" }).isVisible(), await page.evaluate(() => document.activeElement?.textContent?.trim())]
  check("대민 390px: 메뉴 토글 48px · 열기(aria-expanded) · Esc 닫기 · 포커스 복귀", px(h) === 48 && expanded === "true" && navVisible && !after[0] && after[1] === "메뉴", [h, expanded, navVisible, after])
  await ctx.close()
}

// 6) 갤러리
{
  const { ctx, page } = await open("gallery", 1440)
  const tab = page.getByRole("tab", { name: "요약" })
  const tabStyle = await tab.evaluate((el) => [getComputedStyle(el).borderBottomWidth, getComputedStyle(el).borderBottomColor, getComputedStyle(el).color])
  check("탭(line): 선택 탭 밑줄 3px Primary · 글자 Primary", tabStyle[0] === "3px" && tabStyle[1] === "rgb(1, 115, 188)" && tabStyle[2] === "rgb(1, 115, 188)", tabStyle)
  await tab.focus()
  await page.keyboard.press("ArrowRight")
  await page.waitForTimeout(200)
  const sel = await page.getByRole("tab", { name: "처리 이력" }).getAttribute("aria-selected")
  check("탭: 오른쪽 화살표로 다음 탭 선택", sel === "true", sel)

  const open1 = page.getByRole("button", { name: "담당자 배정" })
  await open1.click()
  await page.waitForTimeout(250)
  const dlg = page.getByRole("dialog", { name: "담당자 배정" })
  const vis = await dlg.isVisible()
  for (let i = 0; i < 5; i++) await page.keyboard.press("Tab")
  const inside = await page.evaluate(() => !!document.activeElement?.closest("[role=dialog]"))
  await page.keyboard.press("Escape")
  await page.waitForTimeout(250)
  const back = await page.evaluate(() => document.activeElement?.textContent?.trim())
  check("모달: 열기 · Tab이 모달 안에 머묾 · Esc 닫기 · 포커스 복귀", vis && inside && back === "담당자 배정", [vis, inside, back])

  const sw = page.getByRole("switch", { name: "처리 결과 알림" })
  await sw.click()
  const swState = [await sw.getAttribute("aria-checked"), await page.locator("#notify-state").textContent()]
  check("스위치: 전환 · 상태 문구 '꺼짐'", swState[0] === "false" && swState[1] === "꺼짐", swState)

  // 대비 점검(계산 색)
  const pairs = await page.evaluate(() => {
    const pick = (el) => [getComputedStyle(el).color, getComputedStyle(el).backgroundColor]
    const byText = (sel, text) => [...document.querySelectorAll(sel)].find((el) => el.textContent.includes(text))
    return {
      "배지 검토 필요": pick(byText("[data-slot=badge]", "검토 필요")),
      "배지 연계 중": pick(byText("[data-slot=badge]", "연계 중")),
      "알림 warning": [getComputedStyle(byText("[data-slot=alert]", "담당자가")).color, getComputedStyle(byText("[data-slot=alert]", "담당자가")).backgroundColor],
      "Secondary 버튼": pick(byText("[data-slot=button]", "완료 처리")),
      "Accent 버튼": pick(byText("[data-slot=button]", "주의 처리")),
      "Destructive 버튼": pick(byText("[data-slot=button]", "삭제")),
      "비활성 버튼": pick(byText("[data-slot=button]", "비활성")),
    }
  })
  const lum = (c) => {
    const [r, g, b] = c.match(/\d+(\.\d+)?/g).slice(0, 3).map(Number).map((v) => v / 255).map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }
  for (const [name, [fg, bg]] of Object.entries(pairs)) {
    const a = lum(fg), b = lum(bg)
    const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
    check("대비 " + name + " ≥ 4.5:1", ratio >= 4.5, ratio.toFixed(2) + ":1 (" + fg + " on " + bg + ")")
  }
  await ctx.close()
}

// 7) 고대비(forced-colors) — 선택 상태가 배경색 없이도 보이는지 스크린샷
{
  const { ctx, page } = await open("form", 1440, { forcedColors: "active" })
  await page.getByRole("radio", { name: "보통" }).click()
  await page.getByRole("checkbox", { name: "식사 지원" }).click()
  await page.getByRole("switch", { name: "긴급 연계 대상" }).click()
  await page.locator("#need-0").evaluate((el) => el.scrollIntoView({ block: "center" }))
  await page.screenshot({ path: shot("form-forced-colors.png") })
  await ctx.close()
}
{
  const { ctx, page } = await open("work", 1440, { forcedColors: "active" })
  await page.getByRole("checkbox", { name: "IC-2609127 선택" }).click()
  await page.locator("[data-slot=pagination]").evaluate((el) => el.scrollIntoView({ block: "center" }))
  await page.screenshot({ path: shot("work-forced-colors.png") })
  await ctx.close()
}

// 8) Tier 1 HTML 예제 가로 넘침(정적 서버 8765)
for (const name of tier1Pages) {
  for (const width of widths) {
    const ctx = await browser.newContext({ viewport: { width, height: 900 } })
    const page = await ctx.newPage()
    page.on("pageerror", (e) => out.console.push("tier1 " + name + "@" + width + " pageerror: " + e.message))
    await page.goto(TIER1 + name + ".html")
    await page.waitForLoadState("networkidle")
    const m = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }))
    check("Tier 1 " + name + ".html @" + width + " 가로 넘침 없음", m.sw <= m.cw, m.sw + " > " + m.cw)
    await ctx.close()
  }
}

// 9) 누를 수 있는 영역: 업무 WCAG 24px(간격 예외), 대민 KRDS 44px
for (const width of [390, 1440]) {
  for (const route of routes) {
    const { ctx, page } = await open(route, width)
    const r = await targetSizeFailures(page)
    check("대상 크기 React " + route + " @" + width + " (기준 " + r.min + "px, " + r.count + "개)", r.failures.length === 0, r.failures.join(" | "))
    await ctx.close()
  }
  for (const name of tier1Pages) {
    const ctx = await browser.newContext({ viewport: { width, height: 900 } })
    const page = await ctx.newPage()
    await page.goto(TIER1 + name + ".html")
    await page.waitForLoadState("networkidle")
    const r = await targetSizeFailures(page)
    check("대상 크기 Tier 1 " + name + " @" + width + " (기준 " + r.min + "px, " + r.count + "개)", r.failures.length === 0, r.failures.join(" | "))
    await ctx.close()
  }
}

// 10) 대민 서비스 컴포넌트 — 서비스 검색 · 자격 확인 · 서식 내려받기
async function publicComponentChecks(page, label) {
  const status = page.locator("#service-list [role=status]").first()
  const search = page.getByRole("searchbox", { name: "어떤 도움이 필요하신가요?" })
  await search.fill("집수리")
  await page.waitForTimeout(150)
  const one = [await status.textContent(), await page.locator("#service-list li:visible").count()]
  await search.fill("")
  await page.getByRole("button", { name: "주거", exact: true }).click()
  await page.waitForTimeout(150)
  const housing = [await status.textContent(), await page.getByRole("button", { name: "주거", exact: true }).getAttribute("aria-pressed"), await page.getByRole("button", { name: "전체", exact: true }).getAttribute("aria-pressed")]
  await search.fill("없는서비스")
  await page.waitForTimeout(150)
  const none = await status.textContent()
  await page.getByRole("button", { name: "검색 조건 초기화" }).click()
  await page.waitForTimeout(150)
  const back = [await status.textContent(), await page.evaluate(() => document.activeElement?.getAttribute("type"))]
  check(label + " 서비스 검색: 검색어 거르기 · 분류 칩(한 개만 눌림) · 결과 없음 · 초기화 후 검색창 포커스",
    one[0].includes("1개") && one[1] === 1 && housing[0].includes("2개") && housing[1] === "true" && housing[2] === "false" && none.includes("없습니다") && back[0].includes("6개") && back[1] === "search",
    JSON.stringify([one, housing, none, back]))

  const result = page.locator("#eligibility [role=status]").first()
  const pick = async (n, answer) => page.locator("#eligibility fieldset").nth(n).getByRole("radio", { name: answer, exact: true }).check()
  const before = await result.textContent()
  await pick(0, "예"); await pick(1, "예"); await pick(2, "아니요")
  await page.waitForTimeout(150)
  const ok = await result.textContent()
  await pick(2, "예")
  await page.waitForTimeout(150)
  const warn = await result.textContent()
  check(label + " 자격 확인: 진행 문구 → 가능 → 상담 필요(맞지 않는 항목 이름)",
    before.includes("0개에 답했습니다") && ok.includes("가능성이 높습니다") && warn.includes("상담이 필요합니다") && warn.includes("다른 돌봄 제도"),
    JSON.stringify([before, ok, warn]))

  const download = await page.getByRole("link", { name: "돌봄서비스 신청서 내려받기 (HWPX, 38KB)" }).count()
  check(label + " 서식 내려받기: 문서명·형식·크기가 드러나는 링크 이름", download === 1, download)
}
{
  const { ctx, page } = await open("public", 1440)
  await publicComponentChecks(page, "React")
  const dims = await page.evaluate(() => {
    const byText = (sel, text) => [...document.querySelectorAll(sel)].find((el) => el.textContent.includes(text))
    return {
      sm: byText("[data-slot=button]", "내려받기").getBoundingClientRect().height,
      chip: byText("[data-slot=chip]", "생활지원").getBoundingClientRect().height,
      xs: getComputedStyle(document.querySelector("[data-slot=field-description]")).fontSize,
      badge: getComputedStyle(document.querySelector("[data-slot=badge]")).fontSize,
    }
  })
  check("대민 React: 작은 버튼 44px · 칩 44px · 도움말 13px · 배지 13px", px(dims.sm) === 44 && px(dims.chip) === 44 && dims.xs === "13px" && dims.badge === "13px", JSON.stringify(dims))
  await ctx.close()
}
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  page.on("pageerror", (e) => out.console.push("tier1 public pageerror: " + e.message))
  await page.goto(TIER1 + "public.html")
  await page.waitForLoadState("networkidle")
  await publicComponentChecks(page, "Tier 1")
  const dims = await page.evaluate(() => ({
    sm: document.querySelector(".jeju-doc .jeju-btn--sm").getBoundingClientRect().height,
    chip: document.querySelector("[data-jeju-service-category]").getBoundingClientRect().height,
    badge: getComputedStyle(document.querySelector(".jeju-badge")).fontSize,
    choice: document.querySelector("#eligibility .jeju-choice").getBoundingClientRect().height,
  }))
  check("대민 Tier 1: 작은 버튼 44px · 칩 44px · 배지 13px · 선택 행 44px", px(dims.sm) === 44 && px(dims.chip) === 44 && dims.badge === "13px" && px(dims.choice) >= 44, JSON.stringify(dims))
  await ctx.close()
}

// 11) standalone 단일 HTML — 네트워크를 막고 file://로 열어도 같은 화면과 동작
{
  const dir = process.env.JEJU_STANDALONE_DIR
  if (!dir) {
    check("standalone 검증(JEJU_STANDALONE_DIR 필요)", false, "JEJU_STANDALONE_DIR 환경 변수를 standalone 출력 폴더로 지정하세요")
  } else {
    const base = pathToFileURL(dir.endsWith("/") || dir.endsWith("\\") ? dir : dir + "/").href
    for (const name of tier1Pages) {
      for (const width of widths) {
        const ctx = await browser.newContext({ viewport: { width, height: 900 } })
        const blocked = []
        await ctx.route(/^https?:/, (route) => { blocked.push(route.request().url()); route.abort() })
        const page = await ctx.newPage()
        page.on("pageerror", (e) => out.console.push("standalone " + name + "@" + width + " pageerror: " + e.message))
        await page.goto(base + name + ".html")
        await page.waitForLoadState("load")
        const m = await page.evaluate(() => {
          const shown = (el) => !!el && el.getClientRects().length > 0 && el.getBoundingClientRect().width > 0
          const use = [...document.querySelectorAll(".jeju-icon use")].find((u) => shown(u.closest("svg")))
          const ref = use ? use.getAttribute("href") : null
          const btn = [...document.querySelectorAll(".jeju-btn")].find(shown)
          return {
            sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth,
            icon: ref && ref.startsWith("#") && !!document.getElementById(ref.slice(1)) && use.closest("svg").getBoundingClientRect().width > 0,
            btn: btn ? Math.round(btn.getBoundingClientRect().height) : 0,
            behaviors: typeof window.JejuDesign === "object",
          }
        })
        const expectBtn = name === "public" ? [40, 44, 48, 56] : [32, 36, 40]
        check("standalone " + name + ".html @" + width + ": 넘침 없음 · 아이콘 · CSS · JS · 외부 요청 0",
          m.sw <= m.cw && m.icon && expectBtn.includes(m.btn) && m.behaviors && blocked.length === 0,
          JSON.stringify({ ...m, blocked }))
        if (name === "public" && width === 1440) await publicComponentChecks(page, "standalone")
        await ctx.close()
      }
    }
  }
}

// 12) v0.5 — 상세 보기 사이드 패널 · 로딩/오류 상태 · 서버 조회형 표
{
  const { ctx, page } = await open("work", 1440)
  const trigger = page.getByRole("button", { name: "IC-2609128 상세 보기" })
  await trigger.click()
  await page.waitForTimeout(350)
  const dialog = page.getByRole("dialog", { name: "IC-2609128 김○○" })
  const shown = await dialog.isVisible()
  const box = await dialog.boundingBox()
  const hasField = (await dialog.textContent()).includes("연계 건수")
  await page.keyboard.press("Escape")
  await page.waitForTimeout(350)
  const back = await page.evaluate(() => document.activeElement?.getAttribute("aria-label"))
  check("React 상세 패널: 관리번호로 열기 · 오른쪽 480px · 상세 항목 · Esc 후 관리번호 버튼으로 포커스 복귀",
    shown && box && Math.round(box.x + box.width) === 1440 && Math.round(box.width) === 480 && hasField && back === "IC-2609128 상세 보기",
    JSON.stringify({ shown, box, hasField, back }))
  await ctx.close()
}
{
  const { ctx, page } = await open("gallery", 1440)
  await page.getByRole("button", { name: "오류 상태" }).click()
  const errorText = await page.locator("[data-slot=async-state] [role=alert]").textContent()
  await page.getByRole("button", { name: "다시 시도" }).click()
  const focusAfterRetry = await page.evaluate(() => document.activeElement?.getAttribute("data-slot"))
  const busy = await page.locator("[data-slot=async-state]").getAttribute("aria-busy")
  const loadingText = await page.locator("[data-slot=async-state] [role=status]").first().textContent()
  await page.waitForTimeout(1200)
  const ready = await page.locator("[data-slot=async-state]").getByText("신규 접수").isVisible()
  await page.getByRole("button", { name: "결과 없음" }).click()
  const empty = await page.locator("[data-slot=async-state]").textContent()
  check("React 로딩·오류 상태: 오류(role=alert) → 다시 시도(포커스는 상태 영역으로) → 불러오는 중(aria-busy · role=status) → 완료 → 결과 없음",
    errorText.includes("불러오지 못했습니다") && focusAfterRetry === "async-state" && busy === "true" && loadingText.includes("불러오는 중") && ready && empty.includes("처리 현황이 없습니다"),
    JSON.stringify({ errorText, focusAfterRetry, busy, loadingText, ready }))

  const server = page.locator("section[aria-labelledby=server-title]")
  const meta = server.locator("[data-slot=data-table] > div p").first()
  await page.waitForTimeout(800)
  const first = await meta.textContent()
  await server.locator("th", { hasText: "처리 건수" }).locator("button").click()
  const busyAfterSort = await server.locator("table[aria-busy=true]").waitFor({ timeout: 450 }).then(() => "true").catch(() => null)
  await page.waitForTimeout(800)
  const sortedFirst = await server.locator("tbody tr").first().locator("td").last().textContent()
  await server.getByRole("link", { name: "2페이지" }).click()
  await page.waitForTimeout(800)
  const second = await meta.textContent()
  await server.getByRole("switch", { name: "다음 조회를 실패로 흉내" }).click()
  await page.waitForTimeout(800)
  const failed = await server.locator("[role=alert]").textContent().catch(() => "")
  await server.getByRole("button", { name: "다시 시도" }).click()
  const tableFocus = await page.evaluate(() => document.activeElement?.getAttribute("data-slot"))
  await page.waitForTimeout(800)
  const recovered = [await server.locator("tbody tr").count(), await meta.textContent()]
  check("서버 조회형 표: 첫 조회 · 정렬 시 aria-busy와 서버 정렬 · 2페이지 · 실패 시 표 안 오류 · 다시 시도(포커스는 건수 문구로)로 복구",
    first.includes("총 57건 중 1–10건") && busyAfterSort === "true" && sortedFirst.trim() === "1" && second.includes("11–20") && failed.includes("불러오지 못했습니다") && tableFocus === "data-table-summary" && recovered[0] === 10 && recovered[1].includes("11–20"),
    JSON.stringify({ first, busyAfterSort, sortedFirst, second, failed, tableFocus, recovered }))
  await ctx.close()
}
async function tier1PanelCheck(page, width, label) {
  const trigger = page.getByRole("button", { name: "IC-2609128 상세 보기" })
  await trigger.click()
  await page.waitForTimeout(250)
  const dialog = page.locator("#detail-panel")
  const info = await dialog.evaluate((el) => ({ open: el.open, right: Math.round(el.getBoundingClientRect().right), width: Math.round(el.getBoundingClientRect().width), title: el.querySelector("h2").textContent, who: el.querySelector('[data-field="대상자"]').textContent }))
  await page.keyboard.press("Escape")
  await page.waitForTimeout(250)
  const after = await page.evaluate(() => [document.getElementById("detail-panel").open, document.activeElement?.getAttribute("aria-label")])
  check(label + " 상세 패널 @" + width + ": 행 값으로 채움 · 오른쪽 " + Math.min(480, width) + "px · Esc 닫기 · 포커스 복귀",
    info.open && info.right === width && info.width === Math.min(480, width) && info.title.includes("IC-2609128") && info.who.includes("김") && after[0] === false && after[1] === "IC-2609128 상세 보기",
    JSON.stringify({ info, after }))
}
for (const width of [390, 1440]) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 } })
  const page = await ctx.newPage()
  await page.goto(TIER1 + "work.html")
  await page.waitForLoadState("networkidle")
  await tier1PanelCheck(page, width, "Tier 1")
  await ctx.close()
}
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  await page.goto(TIER1 + "index.html")
  await page.waitForLoadState("networkidle")
  const region = page.locator("#demo-async")
  await page.getByRole("button", { name: "오류 상태" }).click()
  const err = [await region.locator("[data-jeju-async-view=error]").isVisible(), await region.getAttribute("aria-busy"), await region.locator("[data-jeju-async-live]").textContent()]
  await region.getByRole("button", { name: "다시 시도" }).click()
  const loading = [await region.getAttribute("aria-busy"), await region.locator("[data-jeju-async-view=loading]").isVisible(), await page.evaluate(() => document.activeElement?.id)]
  await page.waitForTimeout(1200)
  const ready = [await region.getAttribute("aria-busy"), await region.locator("[data-jeju-async-view=ready]").isVisible(), await region.locator("[data-jeju-async-live]").textContent()]
  check("Tier 1 로딩·오류 상태: 오류 표시 · 다시 시도 → aria-busy · 포커스는 영역으로 · 완료 · 숨김 live 문구",
    err[0] && err[1] === "false" && err[2].includes("불러오지 못했습니다") && loading[0] === "true" && loading[1] && loading[2] === "demo-async" && ready[0] === "false" && ready[1] && ready[2].includes("불러왔습니다"),
    JSON.stringify({ err, loading, ready }))
  await ctx.close()
}
if (process.env.JEJU_STANDALONE_DIR) {
  const dir = process.env.JEJU_STANDALONE_DIR
  const base = pathToFileURL(dir.endsWith("/") || dir.endsWith("\\") ? dir : dir + "/").href
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  await ctx.route(/^https?:/, (route) => route.abort())
  const page = await ctx.newPage()
  await page.goto(base + "work.html")
  await page.waitForLoadState("load")
  await tier1PanelCheck(page, 1440, "standalone")
  await ctx.close()
}

// 13) v0.6 — 서버 조회형 목록(정렬 · 페이지 링크, 상세 불러오기) · 인쇄
async function serverListChecks(page, label) {
  // 정렬 링크를 누르면 주소가 바뀌고 서버가 새로 그린 목록이 온다. 주소 끝 #list-title 덕분에 다음 Tab이 목록 안에서 시작한다.
  await page.locator("th[data-sort-key=days] a").click()
  await page.waitForLoadState("load")
  await page.waitForTimeout(150)
  const sorted = [decodeURIComponent(new URL(page.url()).search), await page.locator("th[data-sort-key=days]").getAttribute("aria-sort"),
    (await page.locator("#request-list tbody tr").first().locator("td").last().textContent()).trim()]
  await page.keyboard.press("Tab")
  const inList = await page.evaluate(() => !!document.activeElement?.closest("section[aria-labelledby=list-title]"))
  check(label + " 서버 목록: 정렬 링크 → 주소 조건 · aria-sort · 서버 정렬 · 새로 그린 뒤 Tab이 목록 안에서 시작",
    sorted[0].includes("sort=days") && sorted[0].includes("dir=asc") && sorted[1] === "ascending" && sorted[2] === "1일" && inList,
    JSON.stringify({ sorted, inList }))

  await page.getByRole("link", { name: "2페이지" }).click()
  await page.waitForLoadState("load")
  await page.waitForTimeout(150)
  const paged = await page.evaluate(() => [
    document.querySelector("[data-list-pagination] [aria-current=page]")?.textContent,
    !!document.querySelector("[data-list-pagination] a[rel=prev][href]"),
    document.querySelector("[data-list-summary]").textContent,
    document.title,
  ])
  await page.selectOption("#page-size", "20")
  await page.getByRole("button", { name: "적용" }).click()
  await page.waitForLoadState("load")
  await page.waitForTimeout(150)
  const sized = [await page.locator("#request-list tbody tr").count(), new URL(page.url()).search]
  await page.selectOption("#f-district", "동부")
  await page.getByRole("button", { name: "검색" }).click()
  await page.waitForLoadState("load")
  await page.waitForTimeout(150)
  const districts = [...new Set(await page.locator("#request-list tbody td[data-label=지역]").allTextContents())]
  const filtered = await page.locator("[data-list-summary]").textContent()
  check(label + " 서버 목록: 2페이지(aria-current · 이전 링크) · 페이지 크기 20 적용 · 지역 조건 검색(정렬 유지)",
    paged[0] === "2" && paged[1] && paged[2].includes("11–20") && paged[3].includes("2/6") && sized[0] === 20 && sized[1].includes("size=20") &&
      districts.length === 1 && districts[0] === "동부" && filtered.includes("총 15건") && filtered.includes("처리 일수 오름차순"),
    JSON.stringify({ paged, sized, districts, filtered }))

  // 상세 불러오기(JejuDesign.load): 불러오는 중 → 완료. 다른 행을 빠르게 열면 마지막 요청만 반영한다.
  const region = page.locator("#request-detail")
  const links = page.locator("#request-list .jeju-table__link")
  const secondId = (await links.nth(1).textContent()).trim()
  await links.nth(0).click()
  const loading = [await region.getAttribute("aria-busy"), await region.locator("[data-jeju-async-view=loading]").isVisible()]
  await page.keyboard.press("Escape")
  await links.nth(1).click()
  await page.waitForTimeout(900)
  const ready = await page.evaluate(() => [
    document.querySelector("[data-request-title]").textContent,
    document.querySelector("[data-request-detail] dd")?.textContent,
    document.querySelector("#request-detail [data-jeju-async-live]").textContent,
    document.getElementById("request-detail").getAttribute("aria-busy"),
  ])
  check(label + " 상세 불러오기: 불러오는 중(aria-busy) → 다른 행을 빠르게 열면 마지막 요청만 반영 → 완료 문구",
    loading[0] === "true" && loading[1] && ready[0] === secondId + " 요청 상세" && ready[1] === secondId && ready[2].includes("불러왔습니다") && ready[3] === "false",
    JSON.stringify({ loading, ready, secondId }))
  await page.keyboard.press("Escape")

  // 실패 → 오류 → 다시 시도(키보드). 버튼이 사라져도 포커스는 영역에 남는다. 닫으면 연 버튼으로 돌아간다.
  await page.locator("#demo-detail-fail").check()
  const thirdId = (await links.nth(2).textContent()).trim()
  await links.nth(2).click()
  await page.waitForTimeout(900)
  const failed = [await region.locator("[data-jeju-async-view=error]").isVisible(), await region.locator("[data-jeju-async-live]").textContent()]
  await page.evaluate(() => { document.getElementById("demo-detail-fail").checked = false })
  await region.getByRole("button", { name: "다시 시도" }).focus()
  await page.keyboard.press("Enter")
  const retryFocus = await page.evaluate(() => document.activeElement?.id)
  await page.waitForTimeout(900)
  const recovered = [await region.locator("[data-jeju-async-view=ready]").isVisible(), await page.locator("[data-request-detail] dd").first().textContent()]
  await page.keyboard.press("Escape")
  await page.waitForTimeout(150)
  const back = await page.evaluate(() => document.activeElement?.getAttribute("aria-label"))
  check(label + " 상세 불러오기: 실패 → 오류 문구 → 다시 시도(키보드, 포커스는 영역으로) → 완료 · Esc 후 연 버튼으로 포커스 복귀",
    failed[0] && failed[1].includes("불러오지 못했습니다") && retryFocus === "request-detail" && recovered[0] && recovered[1] === thirdId && back === thirdId + " 상세 보기",
    JSON.stringify({ failed, retryFocus, recovered, back }))
}

const displayOf = (page, selectors) => page.evaluate((list) => Object.fromEntries(list.map((sel) => {
  const el = document.querySelector(sel)
  return [sel, el ? getComputedStyle(el).display : "missing"]
})), selectors)

{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  page.on("pageerror", (e) => out.console.push("tier1 list pageerror: " + e.message))
  await page.goto(TIER1 + "list.html")
  await page.waitForLoadState("networkidle")
  await serverListChecks(page, "Tier 1")

  await page.goto(TIER1 + "list.html")
  await page.waitForLoadState("networkidle")
  await page.emulateMedia({ media: "print" })
  await page.evaluate(() => window.dispatchEvent(new Event("beforeprint")))
  const shown = await displayOf(page, [".jeju-gnb", ".jeju-lnb", "form[role=search]", ".jeju-pagination", ".jeju-table-toolbar__tools", ".jeju-page-head .jeju-actions", ".demo-page-links", ".jeju-print-header", "#request-list"])
  const extra = await page.evaluate(() => [document.querySelector(".jeju-print-header [data-jeju-print-date]").textContent, getComputedStyle(document.querySelector(".jeju-table-wrap")).overflowX])
  await page.screenshot({ path: shot("v6-list-print.png"), fullPage: true })
  const hidden = [".jeju-gnb", ".jeju-lnb", "form[role=search]", ".jeju-pagination", ".jeju-table-toolbar__tools", ".jeju-page-head .jeju-actions", ".demo-page-links"]
  check("Tier 1 인쇄(서버 목록): 셸 · 조건 · 페이지 이동 · 페이지 크기 · 버튼 숨김, 인쇄 머리글 · 출력 일시, 표 가로 스크롤 없음",
    hidden.every((sel) => shown[sel] === "none") && shown[".jeju-print-header"] === "block" && shown["#request-list"] === "table" && /\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(extra[0]) && extra[1] === "visible",
    JSON.stringify({ shown, extra }))

  await page.emulateMedia({ media: "screen" })
  await page.locator("#request-list .jeju-table__link").first().click()
  await page.waitForTimeout(900)
  await page.emulateMedia({ media: "print" })
  const panel = await page.evaluate(() => {
    const dialog = document.getElementById("request-panel")
    return {
      shell: getComputedStyle(document.querySelector(".jeju-shell")).display,
      panel: getComputedStyle(dialog).display,
      width: Math.round(dialog.getBoundingClientRect().width),
      foot: getComputedStyle(dialog.querySelector(".jeju-modal__foot")).display,
      close: getComputedStyle(dialog.querySelector(".jeju-modal__head .jeju-btn")).display,
      detail: !!dialog.querySelector("[data-request-detail] dd"),
    }
  })
  await page.screenshot({ path: shot("v6-panel-print.png") })
  check("Tier 1 인쇄(상세 패널): 패널이 열려 있으면 패널 내용만 · 페이지 폭 전체 · 닫기 · 처리 버튼 숨김",
    panel.shell === "none" && panel.panel === "block" && panel.width >= 1400 && panel.foot === "none" && panel.close === "none" && panel.detail,
    JSON.stringify(panel))
  await ctx.close()
}
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  await page.goto(TIER1 + "work.html")
  await page.waitForLoadState("networkidle")
  const printButton = await page.locator("[data-jeju-print]").count()
  const heights = await page.evaluate(() => ["input[type=search]", "input[type=date]", "select"].map((sel) => Math.round(document.querySelector(".jeju-field " + sel).getBoundingClientRect().height)))
  check("Tier 1 입력 높이: 업무 검색어 · 날짜 · 선택 상자 36px(--jeju-input-h)", heights.every((h) => h === 36), heights.join(","))
  await page.emulateMedia({ media: "print" })
  const shown = await displayOf(page, [".jeju-gnb", ".jeju-lnb", ".jeju-pagination", ".jeju-table th.check", ".jeju-chip__remove", ".jeju-table-toolbar__tools"])
  const table = await page.evaluate(() => {
    const wrap = getComputedStyle(document.querySelector(".jeju-table-wrap--sticky"))
    return [wrap.overflowY, wrap.maxHeight, getComputedStyle(document.querySelector(".jeju-table--sticky thead th:nth-child(2)")).position]
  })
  check("Tier 1 인쇄(업무 예제): '목록 인쇄' 메뉴 연결 · 셸 · 선택 열 · 페이지 이동 숨김 · 고정 헤더와 스크롤 해제",
    printButton === 1 && Object.values(shown).every((v) => v === "none") && table[0] === "visible" && table[1] === "none" && table[2] === "static",
    JSON.stringify({ printButton, shown, table }))
  await ctx.close()
}
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  await page.goto(TIER1 + "public.html")
  await page.waitForLoadState("networkidle")
  await page.emulateMedia({ media: "print" })
  const shown = await displayOf(page, [".jeju-masthead", ".jeju-public-nav", ".jeju-public-footer", ".jeju-service-search__form", ".jeju-identifier", ".jeju-public-main"])
  check("대민 인쇄: 알림 띠 · 메뉴 · 검색 · 푸터 숨김, 기관 식별 · 본문 유지",
    [".jeju-masthead", ".jeju-public-nav", ".jeju-public-footer", ".jeju-service-search__form"].every((sel) => shown[sel] === "none") &&
      shown[".jeju-identifier"] !== "none" && shown[".jeju-public-main"] !== "none",
    JSON.stringify(shown))
  await ctx.close()
}
{
  const { ctx, page } = await open("work", 1440)
  await page.emulateMedia({ media: "print" })
  const react = await page.evaluate(() => {
    const d = (el) => (el ? getComputedStyle(el).display : "missing")
    const shell = document.querySelector("[data-slot=work-shell]")
    const table = document.querySelector("[data-slot=data-table]")
    const selectAll = table.querySelector('[aria-label="현재 페이지 전체 선택"]')
    return {
      header: d(shell.querySelector("header")),
      aside: d(shell.querySelector("aside")),
      grid: d(shell.querySelector("main").parentElement),
      utility: d(document.querySelector("[data-slot=utility-bar]")),
      pager: d(table.querySelector("[data-slot=pagination]")),
      select: d(selectAll ? selectAll.closest("th") : null),
      overflow: getComputedStyle(table.querySelector("[data-slot=table-container]")).overflowX,
    }
  })
  check("React 인쇄(업무 예제): 머리 · 메뉴 · 선택 열 · 페이지 이동 숨김, 본문 한 단, 표 가로 스크롤 없음",
    react.header === "none" && react.aside === "none" && react.grid === "block" && ["none", "missing"].includes(react.utility) &&
      react.pager === "none" && react.select === "none" && react.overflow === "visible",
    JSON.stringify(react))

  await page.emulateMedia({ media: "screen" })
  await page.getByRole("button", { name: "IC-2609128 상세 보기" }).click()
  await page.waitForTimeout(400)
  await page.emulateMedia({ media: "print" })
  const panel = await page.evaluate(() => {
    const content = document.querySelector('[data-slot="sheet-content"][data-side="right"]')
    return {
      root: getComputedStyle(document.getElementById("root")).display,
      content: content ? getComputedStyle(content).display : "missing",
      width: content ? Math.round(content.getBoundingClientRect().width) : 0,
      footer: content ? getComputedStyle(content.querySelector("[data-slot=sheet-footer]")).display : "missing",
      close: content ? getComputedStyle(content.querySelector(":scope > [data-slot=sheet-close]")).display : "missing",
    }
  })
  await page.screenshot({ path: shot("v6-react-panel-print.png") })
  check("React 인쇄(상세 패널): 패널 내용만 · 페이지 폭 전체 · 닫기 · 처리 버튼 숨김",
    panel.root === "none" && panel.content !== "none" && panel.content !== "missing" && panel.width >= 1400 && panel.footer === "none" && panel.close === "none",
    JSON.stringify(panel))
  await ctx.close()
}
if (process.env.JEJU_STANDALONE_DIR) {
  const dir = process.env.JEJU_STANDALONE_DIR
  const base = pathToFileURL(dir.endsWith("/") || dir.endsWith("\\") ? dir : dir + "/").href
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  await ctx.route(/^https?:/, (route) => route.abort())
  const page = await ctx.newPage()
  page.on("pageerror", (e) => out.console.push("standalone list pageerror: " + e.message))
  await page.goto(base + "list.html")
  await page.waitForLoadState("load")
  await serverListChecks(page, "standalone")
  await ctx.close()
}


await browser.close()
writeFileSync(shot("results.json"), JSON.stringify(out, null, 2))
const failed = out.checks.filter((c) => !c.pass)
console.log("overflow:", out.overflow.length ? JSON.stringify(out.overflow, null, 1) : "없음 (4개 화면 × 5개 뷰포트)")
console.log("checks:", out.checks.length - failed.length + "/" + out.checks.length + " PASS")
for (const c of out.checks) console.log((c.pass ? "PASS " : "FAIL ") + c.name + (c.pass ? "" : "  ← " + c.detail))
console.log("console:", out.console.length ? out.console.join("\n") : "오류·경고 없음")

if (out.checks.some((c) => !c.pass) || out.overflow.length) process.exitCode = 1
