"use client"

import { cn } from "@/lib/utils"
import { LayoutDashboard, ArrowLeftRight, Users, Smartphone, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

type Page = "dashboard" | "transactions" | "clients" | "zelle"

interface SidebarProps {
  currentPage: Page
  onPageChange: (page: Page) => void
}

const menuItems = [
  {
    id: "dashboard" as Page,
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    id: "transactions" as Page,
    label: "Transacciones",
    icon: ArrowLeftRight,
  },
  {
    id: "clients" as Page,
    label: "Clientes",
    icon: Users,
  },
  {
    id: "zelle" as Page,
    label: "Zelle",
    icon: Smartphone,
  },
]

export function Sidebar({ currentPage, onPageChange }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>

      {/* Overlay for mobile */}
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsOpen(false)} />}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed left-0 top-0 z-40 h-full w-64 bg-sidebar border-r border-sidebar-border transition-transform duration-300 ease-in-out md:relative md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-sidebar-border">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg font-space-grotesk">A</span>
              </div>
              <h1 className="text-xl font-bold text-sidebar-foreground font-space-grotesk">AKI Transfer</h1>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon
                const isActive = currentPage === item.id

                return (
                  <li key={item.id}>
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      className={cn(
                        "w-full justify-start h-12 text-left font-medium",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground",
                      )}
                      onClick={() => {
                        onPageChange(item.id)
                        setIsOpen(false)
                      }}
                    >
                      <Icon className="mr-3 h-5 w-5" />
                      {item.label}
                    </Button>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-sidebar-border">
            <p className="text-xs text-muted-foreground text-center">© 2024 AKI Transfer</p>
          </div>
        </div>
      </div>
    </>
  )
}
