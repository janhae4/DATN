"use client"

import * as React from "react"
import { Label } from "@/types/label.interface"
import { cn } from "@/lib/utils"

export function LabelTag({
  label,
  className,
}: {
  label: Label
  className?: string
}) {
  const style: React.CSSProperties = {
    backgroundColor: `${label.color}20`,
    color: label.color,
    border: `1px solid ${label.color}40`,
  }

  return (
    <span
      className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", className)}
      style={style}
    >
      {label.name}
    </span>
  )
}

export default LabelTag
