"use client"

import * as React from "react"
import { Label } from "@/types"
import { cn } from "@/lib/utils"
import { XIcon } from "lucide-react"
import { LabelEdit } from "./LabelEdit"

interface LabelTagProps {
  label: any
  className?: string
  onRemove?: () => void
}

export function LabelTag({
  label,
  className,
  onRemove,
}: LabelTagProps) {
  const style: React.CSSProperties = {
    backgroundColor: `${label.color}20`,
    color: label.color,
    border: `1px solid ${label.color}40`,
  }

  const [isHovered, setIsHovered] = React.useState(false)

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onRemove) {
      onRemove()
    }
  }

  return (
    <span
      className={cn(
        "relative", 
        "inline-flex items-center justify-center",
        "px-2 py-0.5 rounded-full text-xs font-medium transition-colors",
        "hover:bg-black/10 dark:hover:bg-white/10",
        className
      )}
      style={style}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span className={cn(
        "transition-opacity truncate max-w-[65px] overflow-hidden",
        isHovered && "opacity-0" 
      )}>
        {label.name}
      </span>

      <span
        className={cn(
          "absolute inset-0", 
          "flex items-center justify-center gap-1.5",
          "opacity-0 transition-opacity", 
          isHovered && "opacity-100" 
        )}
        aria-hidden={!isHovered} 
      >
        <LabelEdit data={label}/>
        {onRemove && (
          <button 
            onClick={handleRemove}
            className="p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/20 transition-colors flex items-center justify-center w-5 h-5"
            aria-label={`Remove label ${label.name}`}
          >
            <XIcon className="w-3.5 h-3.5" />
          </button>
        )}
      </span>
    </span>
  )
}

export default LabelTag