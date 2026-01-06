"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { Switch } from "@/components/ui/switch"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const isDark = theme === "dark"

  const handleChange = (checked: boolean) => {
    setTheme(checked ? "dark" : "light")
  }

  return (
    <div className="flex items-center gap-1">
      <span className="text-xs text-muted-foreground hidden sm:inline">Light</span>
      <Switch
        checked={isDark}
        onCheckedChange={handleChange}
        aria-label="Toggle theme"
      />
      <span className="text-xs text-muted-foreground hidden sm:inline">Dark</span>
    </div>
  )
}
