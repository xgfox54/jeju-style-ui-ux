import * as React from "react"

import { cn } from "@/lib/utils"

// 제주 브랜드 마크 자리표시자. Blue·Green·Orange 토큰으로 그린 임시 표시이며 공식 제주 CI 로고가 아니다.
// 공식 CI 자료가 확보되면 이 컴포넌트만 교체한다.
function BrandMark({
  size = "default",
  className,
  ...props
}: React.ComponentProps<"span"> & { size?: "default" | "lg" }) {
  return (
    <span
      aria-hidden="true"
      data-slot="brand-mark"
      data-size={size}
      className={cn(
        "inline-block size-[34px] shrink-0 rounded-[10px] bg-[linear-gradient(135deg,var(--jeju-blue)_0_48%,var(--jeju-green)_48%_73%,var(--jeju-orange)_73%)] data-[size=lg]:size-[42px] data-[size=lg]:rounded-[12px] forced-colors:border forced-colors:border-[CanvasText]",
        className
      )}
      {...props}
    />
  )
}

// 키보드 사용자가 반복 메뉴를 건너뛰는 첫 링크. 포커스를 받을 때만 보인다.
function SkipLink({
  href = "#main",
  children = "본문 바로가기",
  className,
  ...props
}: React.ComponentProps<"a">) {
  return (
    <a
      href={href}
      data-slot="skip-link"
      className={cn(
        "fixed -top-20 left-3 z-(--jeju-z-toast) rounded-lg bg-(--jeju-text-strong) px-3.5 py-2.5 font-bold text-(--jeju-on-fill) no-underline focus:top-3",
        className
      )}
      {...props}
    >
      {children}
    </a>
  )
}

export { BrandMark, SkipLink }
