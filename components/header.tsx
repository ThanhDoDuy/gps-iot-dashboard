"use client"

import { Bell, Settings, User } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Header() {
  return (
    <header className="fixed top-0 right-0 left-0 lg:left-64 h-16 bg-card border-b border-border flex items-center justify-between px-6 z-30">
      <div className="flex-1">
        <h1 className="text-lg font-semibold text-foreground">Dashboard</h1>
      </div>

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="text-foreground hover:bg-muted">
          <Bell className="w-5 h-5" />
        </Button>
        <Button variant="ghost" size="icon" className="text-foreground hover:bg-muted">
          <Settings className="w-5 h-5" />
        </Button>
        <Button variant="ghost" size="icon" className="text-foreground hover:bg-muted">
          <User className="w-5 h-5" />
        </Button>
      </div>
    </header>
  )
}
