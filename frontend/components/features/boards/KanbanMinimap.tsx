"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface KanbanMinimapProps {
  scrollContainerRef: React.RefObject<HTMLDivElement | null>
  itemsCount: number
  className?: string
}

export function KanbanMinimap({ scrollContainerRef, itemsCount, className }: KanbanMinimapProps) {
  const [mounted, setMounted] = React.useState(false)
  const [state, setState] = React.useState({
    scrollLeft: 0,
    scrollWidth: 0,
    clientWidth: 0,
  })
  const [isDragging, setIsDragging] = React.useState(false)
  const minimapRef = React.useRef<HTMLDivElement>(null)
  const startDragX = React.useRef(0)
  const startScrollLeft = React.useRef(0)

  React.useEffect(() => {
    setMounted(true)
    const container = scrollContainerRef.current
    if (!container) return

    const updateState = () => {
      setState({
        scrollLeft: container.scrollLeft,
        scrollWidth: container.scrollWidth,
        clientWidth: container.clientWidth,
      })
    }

    updateState()
    
    // Use ResizeObserver to detect size changes
    const observer = new ResizeObserver(updateState)
    observer.observe(container)
    // Also observe the content (first child) to detect width changes
    if (container.firstElementChild) {
        observer.observe(container.firstElementChild)
    }

    container.addEventListener("scroll", updateState)
    window.addEventListener("resize", updateState)

    return () => {
      container.removeEventListener("scroll", updateState)
      window.removeEventListener("resize", updateState)
      observer.disconnect()
    }
  }, [scrollContainerRef, itemsCount])

  if (!mounted) return null
  
  const { scrollLeft, scrollWidth, clientWidth } = state
  
  // Hide if no scrolling needed
  if (scrollWidth <= clientWidth + 1) return null

  // Calculate dimensions
  const minimapWidth = 200 // Fixed width for the minimap
  const scale = minimapWidth / scrollWidth
  
  const thumbWidth = Math.max(20, clientWidth * scale)
  const thumbLeft = scrollLeft * scale

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!scrollContainerRef.current) return

    setIsDragging(true)
    startDragX.current = e.clientX
    startScrollLeft.current = scrollContainerRef.current.scrollLeft

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!scrollContainerRef.current) return
      
      const deltaX = moveEvent.clientX - startDragX.current
      const deltaScroll = deltaX / scale
      
      scrollContainerRef.current.scrollLeft = startScrollLeft.current + deltaScroll
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
  }

  const handleTrackClick = (e: React.MouseEvent) => {
    // If clicked on thumb, do nothing (handled by handleMouseDown)
    // But handleMouseDown stops propagation, so this might not be needed if thumb is child.
    // However, if we click outside the thumb on the track:
    if (!minimapRef.current || !scrollContainerRef.current) return
    
    const rect = minimapRef.current.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    
    // We want to center the viewport on the click
    // clickX corresponds to a scroll position
    const targetScrollLeft = (clickX / scale) - (clientWidth / 2)
    
    scrollContainerRef.current.scrollTo({
        left: targetScrollLeft,
        behavior: 'smooth'
    })
  }

  return (
    <div 
        className={cn(
            "fixed bottom-6 right-6 z-50 bg-background/80 backdrop-blur-sm p-1 rounded-lg border shadow-sm transition-opacity duration-200 opacity-100",
            className
        )}
        style={{ width: minimapWidth + 8 }} 
    >
        <div 
            ref={minimapRef}
            className="relative h-10 w-[200px] cursor-pointer"
            onClick={handleTrackClick}
        >
            {/* Bars representation */}
            <div className="absolute inset-0 flex gap-1 w-full h-full">
                {Array.from({ length: itemsCount }).map((_, i) => (
                    <div 
                        key={i} 
                        className="flex-1 bg-muted-foreground/20 rounded-sm h-full"
                    />
                ))}
            </div>

            <div 
                className="absolute top-0 h-full border-2 border-primary rounded-sm bg-primary/5 cursor-grab active:cursor-grabbing hover:bg-primary/10 transition-colors"
                style={{
                    width: thumbWidth,
                    transform: `translateX(${thumbLeft}px)`,
                }}
                onMouseDown={handleMouseDown}
                onClick={(e) => e.stopPropagation()} // Prevent track click when clicking thumb
            />
        </div>
    </div>
  )
}
