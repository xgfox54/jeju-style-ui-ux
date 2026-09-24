import * as React from "react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DownloadIcon, FileIcon } from "@/components/ui/jeju-icons"

// 서식 내려받기(Tier 1 .jeju-doc-list). 버튼 이름은 "문서명 + 내려받기 + (형식, 크기)"로 읽혀
// 여러 서식이 있어도 어떤 파일인지 구분된다. 보이는 글자 "내려받기"가 이름 안에 들어 있다(WCAG 2.5.3).
type DocItem = {
  title: string
  format: string
  size: string
  updated?: string
  href: string
}

function DocList({ docs, className, ...props }: React.ComponentProps<"ul"> & { docs: DocItem[] }) {
  return (
    <ul data-slot="doc-list" className={cn("m-0 grid list-none gap-2 p-0", className)} {...props}>
      {docs.map((doc) => (
        <li
          key={doc.title}
          className="flex min-w-0 items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 max-[560px]:flex-wrap"
        >
          <FileIcon className="text-muted-foreground" />
          <div className="grid min-w-0 flex-1 gap-0.5">
            <span className="font-extrabold wrap-anywhere text-(--jeju-text-strong)">{doc.title}</span>
            <span className="flex flex-wrap items-center gap-1.5 text-(length:--jeju-text-sm) text-(--jeju-text-subtle) tabular-nums">
              <Badge variant="info">{doc.format}</Badge>
              {doc.size}
              {doc.updated ? " · " + doc.updated : null}
            </span>
          </div>
          <Button variant="outline" size="sm" asChild className="max-[560px]:w-full">
            <a href={doc.href} download aria-label={doc.title + " 내려받기 (" + doc.format + ", " + doc.size + ")"}>
              <DownloadIcon />
              내려받기
            </a>
          </Button>
        </li>
      ))}
    </ul>
  )
}

export { DocList, type DocItem }
