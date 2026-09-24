"use client"

import * as React from "react"
import { Toaster as Sonner, type ToasterProps } from "sonner"

import { CheckIcon, InfoIcon, WarningIcon } from "@/components/ui/jeju-icons"

// 토스트는 한 번에 3개까지, 5초 뒤 사라진다. 중요한 결과는 토스트에만 두지 않고 화면에도 남긴다.
// 다크 모드는 범위 밖이라 next-themes를 쓰지 않는다.
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group print:hidden"
      position="bottom-right"
      visibleToasts={3}
      duration={5000}
      containerAriaLabel="알림"
      icons={{
        success: <CheckIcon />,
        info: <InfoIcon />,
        warning: <WarningIcon />,
        error: <WarningIcon />,
        loading: (
          <span className="inline-block size-(--jeju-icon) animate-spin rounded-full border-2 border-current border-t-transparent" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--jeju-inverse-surface)",
          "--normal-text": "var(--jeju-inverse-text)",
          "--normal-border": "var(--jeju-inverse-surface)",
          "--border-radius": "var(--jeju-radius)",
          fontFamily: "var(--jeju-font)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
