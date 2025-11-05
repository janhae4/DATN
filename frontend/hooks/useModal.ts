import { useState, useCallback } from "react"

interface UseModalReturn {
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
  onOpenChange: (open: boolean) => void
}


export function useModal(defaultValue: boolean = false): UseModalReturn {
  const [isOpen, setIsOpen] = useState(defaultValue)

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(() => setIsOpen((prev) => !prev), [])

  const onOpenChange = useCallback((open: boolean) => {
    setIsOpen(open)
  }, [])
  return { isOpen, open, close, toggle, onOpenChange }
}