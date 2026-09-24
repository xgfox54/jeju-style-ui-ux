"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"
import { DeleteIcon, FileIcon, UploadIcon, WarningIcon } from "@/components/ui/jeju-icons"

// 파일 업로드: 끌어다 놓기 + 파일 선택 + 파일 목록 + 개별 삭제.
// 파일 입력은 포커스 가능한 상태로 남고 "파일 선택" 라벨에 포커스 링이 보인다(Tier 1 .jeju-upload).
function formatBytes(bytes: number) {
  if (bytes < 1024) return bytes + " B"
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
  return (bytes / (1024 * 1024)).toFixed(1) + " MB"
}

function FileUpload({
  id,
  files: controlledFiles,
  onFilesChange,
  accept,
  multiple = true,
  maxSizeMB,
  buttonLabel = "파일 선택",
  dropText = "파일을 이곳에 끌어다 놓거나 파일 선택 버튼을 누르세요.",
  hint,
  listLabel = "선택한 파일",
  emptyText = "아직 선택한 파일이 없습니다.",
  className,
}: {
  id?: string
  files?: File[]
  onFilesChange?: (files: File[]) => void
  accept?: string
  multiple?: boolean
  maxSizeMB?: number
  buttonLabel?: string
  dropText?: string
  hint?: string
  listLabel?: string
  emptyText?: string
  className?: string
}) {
  const generatedId = React.useId()
  const inputId = id ?? generatedId
  const hintId = inputId + "-hint"
  const [innerFiles, setInnerFiles] = React.useState<File[]>([])
  const [dragging, setDragging] = React.useState(false)
  const [rejected, setRejected] = React.useState<string[]>([])
  const [announcement, setAnnouncement] = React.useState("")
  const files = controlledFiles ?? innerFiles

  const commit = (next: File[]) => {
    if (controlledFiles === undefined) setInnerFiles(next)
    onFilesChange?.(next)
  }

  const addFiles = (list: FileList | null) => {
    if (!list || list.length === 0) return
    const incoming = Array.from(list)
    const limit = maxSizeMB ? maxSizeMB * 1024 * 1024 : Infinity
    const accepted = incoming.filter((file) => file.size <= limit)
    const tooLarge = incoming.filter((file) => file.size > limit)
    setRejected(tooLarge.map((file) => file.name + " 파일은 " + maxSizeMB + "MB를 넘어 올리지 않았습니다."))
    const next = multiple ? [...files, ...accepted] : accepted.slice(0, 1)
    commit(next)
    if (accepted.length) setAnnouncement(accepted.length + "개 파일을 추가했습니다.")
  }

  const removeAt = (index: number) => {
    const target = files[index]
    commit(files.filter((_, position) => position !== index))
    if (target) setAnnouncement(target.name + " 파일을 삭제했습니다.")
  }

  return (
    <div data-slot="file-upload" className={cn("grid min-w-0 content-start gap-3", className)}>
      <div
        data-dragover={dragging || undefined}
        onDragEnter={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false)
        }}
        onDrop={(event) => {
          event.preventDefault()
          setDragging(false)
          addFiles(event.dataTransfer.files)
        }}
        className="relative grid justify-items-center gap-2 rounded-xl border-2 border-dashed border-input bg-(--jeju-surface-inset) px-4 py-6 text-center text-muted-foreground data-dragover:border-primary data-dragover:bg-(--jeju-primary-tint) data-dragover:text-primary"
      >
        <UploadIcon className="size-(--jeju-icon-lg)" />
        <p className="m-0">{dropText}</p>
        <input
          id={inputId}
          type="file"
          multiple={multiple}
          accept={accept}
          aria-describedby={hint ? hintId : undefined}
          className="peer pointer-events-none absolute size-px opacity-0"
          onChange={(event) => {
            addFiles(event.target.files)
            event.target.value = ""
          }}
        />
        <label
          htmlFor={inputId}
          className={cn(
            buttonVariants({ variant: "outline" }),
            "cursor-pointer peer-focus-visible:border-ring peer-focus-visible:shadow-(--jeju-focus-ring)"
          )}
        >
          {buttonLabel}
        </label>
        {hint ? (
          <p id={hintId} className="m-0 text-(length:--jeju-text-xs) text-(--jeju-text-subtle)">
            {hint}
          </p>
        ) : null}
      </div>

      {rejected.length > 0 ? (
        <div role="alert" className="grid gap-1 text-(length:--jeju-feedback-font) font-bold text-destructive">
          {rejected.map((message) => (
            <p key={message} className="m-0 flex items-start gap-1.25 [&>svg]:mt-[0.15em] [&>svg]:size-[1em]">
              <WarningIcon />
              {message}
            </p>
          ))}
        </div>
      ) : null}

      {files.length === 0 ? (
        <p className="m-0 text-(length:--jeju-text-sm) text-muted-foreground">{emptyText}</p>
      ) : (
        <ul aria-label={listLabel} className="m-0 grid list-none gap-2 p-0">
          {files.map((file, index) => (
            <li
              key={file.name + index}
              className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5"
            >
              <FileIcon className="text-muted-foreground" />
              <span className="min-w-0 font-bold wrap-anywhere text-(--jeju-text-body)">{file.name}</span>
              <span className="ml-auto text-(length:--jeju-text-xs) whitespace-nowrap text-(--jeju-text-subtle) tabular-nums">
                {formatBytes(file.size)}
              </span>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={file.name + " 삭제"}
                onClick={() => removeAt(index)}
              >
                <DeleteIcon />
              </Button>
            </li>
          ))}
        </ul>
      )}
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
    </div>
  )
}

export { FileUpload, formatBytes }
