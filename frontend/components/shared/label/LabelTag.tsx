"use client"

import * as React from "react"
import { Label } from "@/types/label.interface"
import { cn } from "@/lib/utils"
import { XIcon, Loader2 } from "lucide-react"
import { LabelEdit } from "./LabelEdit"
import { db } from "@/public/mock-data/mock-data"
import { toast } from "sonner"
interface LabelTagProps {
  label: Label
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
  const [isDeleting, setIsDeleting] = React.useState(false)

  const handleRemove = async (e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (isDeleting) return
    
    try {
      setIsDeleting(true)
      
      // Simulate API call to delete label
      await new Promise(resolve => setTimeout(resolve, 500)) // Simulate network delay
      
      // Remove label from mock database
      const labelIndex = db.labels.findIndex(l => l.id === label.id)
      if (labelIndex !== -1) {
        db.labels.splice(labelIndex, 1)
        toast.success(`Label "${label.name}" đã được xóa`)
        
        // Call the onRemove callback if provided
        if (onRemove) {
          onRemove()
        }
      } else {
        toast.error('Không tìm thấy label để xóa')
      }
    } catch (error) {
      console.error('Lỗi khi xóa label:', error)
      toast.error('Có lỗi xảy ra khi xóa label')
    } finally {
      setIsDeleting(false)
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
        "transition-opacity",
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
        <button 
          onClick={handleRemove}
          disabled={isDeleting}
          className="p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/20 transition-colors flex items-center justify-center w-5 h-5"
          aria-label={isDeleting ? 'Đang xóa...' : `Xóa label ${label.name}`}
        >
          {isDeleting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <XIcon className="w-3.5 h-3.5" />
          )}
        </button>
      </span>
    </span>
  )
}

export default LabelTag