import * as React from "react"

import { cn } from "@/lib/utils"
import { ChevronRightIcon } from "@/components/ui/jeju-icons"

// 함께 찾는 서비스(Tier 1 .jeju-related). 링크마다 누를 수 있는 영역을 --jeju-target-min 이상으로 둔다.
function RelatedLinks({
  title = "함께 찾는 서비스",
  links,
  level = 2,
  className,
}: {
  title?: string
  links: Array<{ label: string; href: string }>
  level?: 2 | 3
  className?: string
}) {
  const titleId = React.useId()
  const Heading = level === 2 ? "h2" : "h3"

  return (
    <nav data-slot="related-links" aria-labelledby={titleId} className={cn("grid min-w-0 gap-3", className)}>
      <Heading id={titleId} className="m-0 text-(length:--jeju-text-xl) font-bold text-(--jeju-text-strong)">
        {title}
      </Heading>
      <ul className="m-0 grid list-none grid-cols-2 gap-2 p-0 max-[560px]:grid-cols-1">
        {links.map((link) => (
          <li key={link.href + link.label}>
            <a
              href={link.href}
              className="flex min-h-(--jeju-target-min) items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-2.5 font-bold text-(--jeju-text-body) no-underline outline-none hover:border-primary hover:text-primary focus-visible:shadow-(--jeju-focus-ring)"
            >
              {link.label}
              <ChevronRightIcon className="text-(--jeju-text-faint)" />
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export { RelatedLinks }
