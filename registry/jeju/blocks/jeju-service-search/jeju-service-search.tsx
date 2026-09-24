"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Chip, ChipSet } from "@/components/ui/chip"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { SearchField } from "@/components/jeju-search"

// 대민 서비스 검색(Tier 1 .jeju-service-search). 검색어와 분류 칩(한 번에 하나)으로 목록을 거르고
// 결과 수를 role="status" 문구로 알린다. 결과가 없으면 빈 상태와 초기화 버튼을 보여 준다.
type ServiceItem = {
  id: string
  title: string
  category: string
  description: string
  meta?: string
  href: string
  keywords?: string
  badge?: "info" | "success" | "warning" | "danger" | "neutral"
}

const ALL = "전체"

function normalize(value: string) {
  return value.toLowerCase().replace(/\s+/g, "")
}

function ServiceSearch({
  services,
  categories,
  label = "어떤 도움이 필요하신가요?",
  placeholder = "예: 식사, 병원, 집수리",
  searchLabel = "서비스 검색",
  className,
}: {
  services: ServiceItem[]
  categories: string[]
  label?: string
  placeholder?: string
  searchLabel?: string
  className?: string
}) {
  const inputId = React.useId()
  const [query, setQuery] = React.useState("")
  const [category, setCategory] = React.useState(ALL)

  const filtered = React.useMemo(() => {
    const q = normalize(query)
    return services.filter((service) => {
      if (category !== ALL && service.category !== category) return false
      if (!q) return true
      return normalize([service.title, service.description, service.meta, service.category, service.keywords].join(" ")).includes(q)
    })
  }, [services, query, category])

  const reset = () => {
    setQuery("")
    setCategory(ALL)
    document.getElementById(inputId)?.focus()
  }

  return (
    <div data-slot="service-search" className={cn("grid min-w-0 gap-4", className)}>
      <form role="search" aria-label={searchLabel} onSubmit={(event) => event.preventDefault()}>
        <div className="flex items-end gap-2 max-[560px]:flex-col max-[560px]:items-stretch">
          <SearchField
            id={inputId}
            label={label}
            hideLabel={false}
            placeholder={placeholder}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="flex-1"
          />
          <Button type="submit">검색</Button>
        </div>
      </form>
      <ChipSet role="group" aria-label="서비스 분류">
        {[ALL, ...categories].map((value) => (
          <Chip key={value} pressed={category === value} onPressedChange={() => setCategory(value)}>
            {value}
          </Chip>
        ))}
      </ChipSet>
      <p role="status" className="m-0 text-(length:--jeju-text-sm) text-muted-foreground">
        {filtered.length ? "서비스 " + filtered.length + "개가 있습니다." : "조건에 맞는 서비스가 없습니다."}
      </p>
      {filtered.length ? (
        <ul aria-label="검색 결과" className="m-0 grid list-none grid-cols-3 gap-4 p-0 max-[900px]:grid-cols-1">
          {filtered.map((service) => (
            <li key={service.id} className="min-w-0">
              <a
                href={service.href}
                className="group/service grid h-full min-h-(--jeju-target-min) content-start gap-2.5 rounded-xl border border-border bg-card p-(--jeju-card-pad) text-inherit no-underline outline-none hover:border-primary focus-visible:shadow-(--jeju-focus-ring)"
              >
                <Badge variant={service.badge ?? "neutral"}>{service.category}</Badge>
                <span className="text-(length:--jeju-text-lg) font-extrabold text-(--jeju-text-strong) group-hover/service:text-primary group-hover/service:underline">
                  {service.title}
                </span>
                <span className="text-muted-foreground">{service.description}</span>
                {service.meta ? (
                  <span className="text-(length:--jeju-text-sm) text-(--jeju-text-subtle)">{service.meta}</span>
                ) : null}
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <Empty className="rounded-xl border border-border bg-card">
          <EmptyHeader>
            <EmptyTitle>조건에 맞는 서비스가 없나요?</EmptyTitle>
            <EmptyDescription>검색어를 줄이거나 분류를 전체로 바꿔 보세요. 상담을 통해 필요한 서비스를 함께 찾을 수도 있습니다.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button variant="outline" size="lg" onClick={reset}>
              검색 조건 초기화
            </Button>
          </EmptyContent>
        </Empty>
      )}
    </div>
  )
}

export { ServiceSearch, type ServiceItem }
