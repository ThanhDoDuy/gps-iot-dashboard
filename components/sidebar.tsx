"use client"
import { useState, useMemo } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/lib/auth-store"
import { MENU_ITEMS, filterMenuItemsByPermissions } from "@/lib/permissions"
import { RolesEnum } from "@/lib/enums/roles.enum"

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(true)
  const pathname = usePathname()
  const router = useRouter()
  const { permissions, user, logout } = useAuthStore()

  // Filter menu items based on user permissions and role
  const visibleMenuItems = useMemo(() => {
    const filtered = filterMenuItemsByPermissions(MENU_ITEMS, permissions)
    
    // Additional check for role-based menu items (e.g., Tenants requires super_admin role)
    return filtered.filter((item) => {
      // Tenants menu item requires super_admin role
      if (item.href === "/dashboard/tenants") {
        return user?.roleId === RolesEnum.SUPER_ADMIN
      }
      return true
    })
  }, [permissions, user])

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  return (
    <>
      {/* Mobile toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </Button>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-screen w-64 bg-sidebar border-r border-sidebar-border transition-transform duration-300 z-40",
          !isOpen && "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-sidebar-border">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-sidebar-accent flex items-center justify-center">
                <span className="text-sidebar-accent-foreground font-bold text-sm">IoT</span>
              </div>
              <span className="font-semibold text-sidebar-foreground">IoT Tracker</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-2">
            {visibleMenuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  pathname === item.href
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/10",
                )}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-sidebar-border space-y-2">
            <Button 
              variant="outline" 
              className="w-full justify-start text-sidebar-foreground bg-transparent"
              onClick={handleLogout}
            >
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {isOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setIsOpen(false)} />}
    </>
  )
}
