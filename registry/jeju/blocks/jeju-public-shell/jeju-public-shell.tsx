"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { CloseIcon, MenuIcon } from "@/components/ui/jeju-icons"
import { BrandMark } from "@/components/jeju-common"

// 대민(public) 셸: 공식 안내 띠(masthead) · 헤더 · 본문 · 히어로 · 기관 식별 · 푸터.
// <html data-jeju-profile="public">과 함께 쓴다. 900px 이하에서 메뉴는 토글 버튼으로 연다.
type PublicNavItem = {
  label: string
  href: string
  current?: boolean
}

const container = "mx-auto w-full max-w-(--jeju-container-max) px-6 max-[900px]:px-4"

function Masthead({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="masthead"
      className={cn(
        "border-b border-border bg-(--jeju-surface-inset) text-(length:--jeju-text-sm) text-(--jeju-text-body)",
        className
      )}
      {...props}
    >
      <div className={cn(container, "flex min-h-9 items-center gap-2")}>{children}</div>
    </div>
  )
}

function PublicHeader({
  brand,
  nav,
  navLabel = "주요 메뉴",
  className,
}: {
  brand: { name: string; href: string }
  nav: PublicNavItem[]
  navLabel?: string
  className?: string
}) {
  const [open, setOpen] = React.useState(false)
  const navId = React.useId()
  const toggleRef = React.useRef<HTMLButtonElement>(null)
  const navRef = React.useRef<HTMLElement>(null)

  React.useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false)
        toggleRef.current?.focus()
      }
    }
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node
      if (!navRef.current?.contains(target) && !toggleRef.current?.contains(target)) setOpen(false)
    }
    const media = window.matchMedia("(min-width: 901px)")
    const onMedia = () => media.matches && setOpen(false)
    document.addEventListener("keydown", onKey)
    document.addEventListener("pointerdown", onPointer)
    media.addEventListener("change", onMedia)
    return () => {
      document.removeEventListener("keydown", onKey)
      document.removeEventListener("pointerdown", onPointer)
      media.removeEventListener("change", onMedia)
    }
  }, [open])

  return (
    <header
      data-slot="public-header"
      className={cn("border-b border-(--jeju-shell-border) bg-card", className)}
    >
      <div className={cn(container, "relative flex min-h-[92px] items-center gap-6 max-[900px]:min-h-[76px]")}>
        <a
          href={brand.href}
          className="inline-flex min-h-(--jeju-target-min) min-w-0 items-center gap-3 text-[21px] font-extrabold text-(--jeju-text-strong) no-underline"
        >
          <BrandMark size="lg" />
          <span className="truncate">{brand.name}</span>
        </a>
        <Button
          ref={toggleRef}
          variant="outline"
          className="ml-auto min-[901px]:hidden"
          aria-expanded={open}
          aria-controls={navId}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <CloseIcon /> : <MenuIcon />}
          {open ? "닫기" : "메뉴"}
        </Button>
        <nav
          ref={navRef}
          id={navId}
          aria-label={navLabel}
          className={cn(
            "ml-auto flex items-center gap-1",
            "max-[900px]:absolute max-[900px]:top-[calc(100%-6px)] max-[900px]:right-4 max-[900px]:left-4 max-[900px]:z-(--jeju-z-menu) max-[900px]:ml-0 max-[900px]:grid max-[900px]:rounded-xl max-[900px]:border max-[900px]:border-border max-[900px]:bg-card max-[900px]:p-2 max-[900px]:shadow-(--jeju-shadow-pop)",
            !open && "max-[900px]:hidden"
          )}
        >
          {nav.map((item) => (
            <a
              key={item.href + item.label}
              href={item.href}
              aria-current={item.current ? "page" : undefined}
              onClick={() => setOpen(false)}
              className="inline-flex min-h-12 items-center rounded-lg px-3.75 font-bold text-(--jeju-text-body) no-underline outline-none hover:bg-(--jeju-primary-tint) hover:text-primary focus-visible:shadow-(--jeju-focus-ring) aria-[current=page]:bg-(--jeju-primary-tint) aria-[current=page]:text-primary max-[900px]:w-full forced-colors:aria-[current=page]:border forced-colors:aria-[current=page]:border-[CanvasText]"
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  )
}

function PublicMain({ className, id = "main", ...props }: React.ComponentProps<"main">) {
  return (
    <main
      id={id}
      tabIndex={-1}
      data-slot="public-main"
      className={cn(container, "pt-10 pb-16 outline-none", className)}
      {...props}
    />
  )
}

function PublicPageTitle({
  title,
  description,
  level = 2,
  id,
  className,
}: {
  title: React.ReactNode
  description?: React.ReactNode
  level?: 1 | 2
  id?: string
  className?: string
}) {
  const Heading = level === 1 ? "h1" : "h2"
  return (
    <div data-slot="public-page-title" className={cn("mb-7", className)}>
      <Heading
        id={id}
        className={cn(
          "m-0 leading-(--jeju-leading-tight) font-bold text-(--jeju-text-strong)",
          level === 1 ? "text-(length:--jeju-h1-size)" : "text-(length:--jeju-text-2xl)"
        )}
      >
        {title}
      </Heading>
      {description ? (
        <p className="mt-3 mb-0 max-w-[760px] text-muted-foreground">{description}</p>
      ) : null}
    </div>
  )
}

function Hero({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: React.ReactNode
  title: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}) {
  return (
    <section
      data-slot="hero"
      className={cn(
        "rounded-[20px] border border-border bg-[linear-gradient(120deg,var(--jeju-blue-light),var(--jeju-surface)_48%,var(--jeju-green-light))] p-9 max-[560px]:px-5 max-[560px]:py-6",
        className
      )}
    >
      {eyebrow ? <div className="font-extrabold text-primary">{eyebrow}</div> : null}
      <h1 className="mt-2 mb-3 text-[clamp(30px,4vw,44px)] leading-[1.2] font-extrabold text-(--jeju-text-strong)">
        {title}
      </h1>
      {description ? (
        <p className="m-0 max-w-[760px] text-(--jeju-text-body)">{description}</p>
      ) : null}
      {actions ? <div className="mt-6 flex flex-wrap gap-2.5">{actions}</div> : null}
    </section>
  )
}

function PublicCardGrid({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="public-card-grid"
      className={cn("grid grid-cols-3 gap-4.5 max-[900px]:grid-cols-1", className)}
      {...props}
    />
  )
}

function PublicCard({ className, ...props }: React.ComponentProps<"article">) {
  return (
    <article
      data-slot="public-card"
      className={cn(
        "grid min-w-0 content-start gap-2.5 rounded-xl border border-border bg-card p-6 [&_h2]:m-0 [&_h3]:m-0 [&_h3]:text-(length:--jeju-text-lg) [&_h3]:text-(--jeju-text-strong) [&_p]:m-0 [&_p]:text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

function Identifier({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="identifier"
      className={cn("border-t border-border bg-(--jeju-surface-inset)", className)}
      {...props}
    >
      <div className={cn(container, "flex items-center gap-3 py-4.5 text-muted-foreground")}>
        <span
          aria-hidden="true"
          className="h-6.5 w-1.25 shrink-0 rounded-full bg-[linear-gradient(var(--jeju-blue)_0_34%,var(--jeju-green)_34%_67%,var(--jeju-orange)_67%)]"
        />
        <span>{children}</span>
      </div>
    </div>
  )
}

function PublicFooter({ className, children, ...props }: React.ComponentProps<"footer">) {
  return (
    <footer
      data-slot="public-footer"
      className={cn(
        "border-t border-(--jeju-shell-border) bg-(--jeju-surface-inset) [&_strong]:text-(--jeju-text-strong)",
        className
      )}
      {...props}
    >
      <div className={cn(container, "py-7 text-muted-foreground")}>{children}</div>
    </footer>
  )
}

export {
  Hero,
  Identifier,
  Masthead,
  PublicCard,
  PublicCardGrid,
  PublicFooter,
  PublicHeader,
  PublicMain,
  PublicPageTitle,
  type PublicNavItem,
}
