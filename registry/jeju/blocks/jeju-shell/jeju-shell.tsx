"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { MenuIcon } from "@/components/ui/jeju-icons"
import { BrandMark, SkipLink } from "@/components/jeju-common"

// 업무(work) 셸: GNB + LNB + 본문. Tier 1 .jeju-gnb/.jeju-shell/.jeju-lnb/.jeju-main과 같은 구조다.
// 900px 이하에서는 LNB가 왼쪽 드로어(Sheet)로 바뀐다. 라우터 링크가 필요하면 ShellNavLink의 <a>를 교체한다.
type ShellNavItem = {
  label: string
  href: string
  current?: boolean
  icon?: React.ReactNode
}

type ShellNav = {
  title?: string
  label?: string
  items: ShellNavItem[]
}

const DESKTOP_QUERY = "(min-width: 901px)"

function UtilityBar({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="utility-bar"
      className={cn(
        "bg-(--jeju-blue-deep) text-(length:--jeju-text-sm) text-(--jeju-blue-light-strong) print:hidden [&_a]:text-(--jeju-on-fill) [&_strong]:text-(--jeju-on-fill)",
        className
      )}
      {...props}
    >
      <div className="mx-auto flex max-w-(--jeju-container-max) flex-wrap items-center justify-between gap-3 px-4 py-2">
        {children}
      </div>
    </div>
  )
}

function ShellNavList({
  nav,
  onNavigate,
}: {
  nav: ShellNav
  onNavigate?: () => void
}) {
  return (
    <>
      {nav.title ? (
        <p className="mx-2 mt-0 mb-3 text-(length:--jeju-text-sm) font-extrabold text-muted-foreground">
          {nav.title}
        </p>
      ) : null}
      <nav aria-label={nav.label ?? "업무 메뉴"} className="grid gap-1">
        {nav.items.map((item) => (
          <a
            key={item.href + item.label}
            href={item.href}
            aria-current={item.current ? "page" : undefined}
            onClick={onNavigate}
            className="flex min-h-[38px] items-center gap-2.5 rounded-lg px-3 py-2 font-semibold text-(--jeju-text-body) no-underline outline-none hover:bg-muted focus-visible:shadow-(--jeju-focus-ring) aria-[current=page]:bg-(--jeju-primary-tint) aria-[current=page]:text-primary forced-colors:aria-[current=page]:border forced-colors:aria-[current=page]:border-[CanvasText]"
          >
            {item.icon}
            {item.label}
          </a>
        ))}
      </nav>
    </>
  )
}

function WorkShell({
  brand,
  systemName,
  nav,
  actions,
  utility,
  wide = false,
  mainId = "main",
  className,
  children,
}: {
  brand: { name: string; href: string }
  systemName?: string
  nav: ShellNav
  actions?: React.ReactNode
  utility?: React.ReactNode
  wide?: boolean
  mainId?: string
  className?: string
  children: React.ReactNode
}) {
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    const media = window.matchMedia(DESKTOP_QUERY)
    const close = () => {
      if (media.matches) setOpen(false)
    }
    media.addEventListener("change", close)
    return () => media.removeEventListener("change", close)
  }, [])

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <div
        data-slot="work-shell"
        className={cn("min-h-svh bg-background text-foreground", className)}
      >
        <SkipLink href={"#" + mainId} />
        {utility}
        <header className="flex min-h-(--jeju-gnb-h) items-center border-b border-(--jeju-shell-border) bg-card print:hidden">
          <div className="mx-auto flex w-full max-w-(--jeju-main-max-wide) items-center gap-4 px-5 max-[560px]:gap-2 max-[560px]:px-3">
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="min-[901px]:hidden">
                <MenuIcon />
                메뉴
              </Button>
            </SheetTrigger>
            <a
              href={brand.href}
              className="inline-flex min-w-0 items-center gap-2.5 font-extrabold text-(--jeju-text-strong) no-underline"
            >
              <BrandMark />
              <span className="truncate">{brand.name}</span>
            </a>
            {systemName ? (
              <span className="ml-auto font-bold text-muted-foreground max-[560px]:hidden">
                {systemName}
              </span>
            ) : null}
            {actions ? (
              <div className={cn("flex items-center gap-2", !systemName && "ml-auto")}>
                {actions}
              </div>
            ) : null}
          </div>
        </header>
        <div className="grid min-[901px]:grid-cols-[var(--jeju-lnb-w)_minmax(0,1fr)] print:block!">
          <aside className="hidden min-w-0 border-r border-(--jeju-shell-border) bg-card px-3 py-5 min-[901px]:block print:hidden!">
            <ShellNavList nav={nav} />
          </aside>
          <main
            id={mainId}
            tabIndex={-1}
            className="min-w-0 p-7 outline-none max-[900px]:px-4 max-[900px]:py-5 print:p-0!"
          >
            <div
              className={cn(
                "mx-auto",
                wide ? "max-w-(--jeju-main-max-wide)" : "max-w-(--jeju-main-max)"
              )}
            >
              {children}
            </div>
          </main>
        </div>
      </div>
      <SheetContent side="left" className="px-3 py-5 min-[901px]:hidden">
        <SheetHeader className="sr-only">
          <SheetTitle>{nav.label ?? "업무 메뉴"}</SheetTitle>
          <SheetDescription>업무 메뉴를 선택하면 해당 화면으로 이동합니다.</SheetDescription>
        </SheetHeader>
        <ShellNavList nav={nav} onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  )
}

export { WorkShell, UtilityBar, type ShellNav, type ShellNavItem }
