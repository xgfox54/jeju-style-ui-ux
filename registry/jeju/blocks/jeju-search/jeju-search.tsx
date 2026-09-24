import * as React from "react"

import { cn } from "@/lib/utils"
import { SearchIcon } from "@/components/ui/jeju-icons"

// 돋보기 아이콘이 붙은 검색 입력(Tier 1 .jeju-search). 라벨은 반드시 둔다.
// hideLabel={false}면 라벨을 입력 위에 보이게 둔다(대민 서비스 검색처럼 질문형 라벨이 필요할 때).
function SearchField({
  id,
  label,
  hideLabel = true,
  className,
  ...props
}: Omit<React.ComponentProps<"input">, "type"> & {
  id: string
  label: string
  hideLabel?: boolean
}) {
  const box = (
    <div
      data-slot="search-field"
      className={cn(
        "flex min-h-(--jeju-search-h) min-w-0 items-center gap-2 rounded-lg border border-input bg-card px-2.5 has-[input:focus-visible]:border-ring has-[input:focus-visible]:shadow-(--jeju-focus-ring)",
        hideLabel && className
      )}
    >
      <SearchIcon className="text-muted-foreground" />
      {hideLabel ? (
        <label htmlFor={id} className="sr-only">
          {label}
        </label>
      ) : null}
      <input
        id={id}
        type="search"
        className="h-full min-h-[calc(var(--jeju-search-h)-2px)] w-full min-w-0 border-0 bg-transparent text-(length:--jeju-control-font) text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-transparent focus-visible:shadow-none"
        {...props}
      />
    </div>
  )

  if (hideLabel) return box

  return (
    <div className={cn("grid min-w-0 gap-1.5", className)}>
      <label htmlFor={id} className="text-(length:--jeju-label-font) font-bold text-(--jeju-text-body)">
        {label}
      </label>
      {box}
    </div>
  )
}

export { SearchField }
