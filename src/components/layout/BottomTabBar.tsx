import { NavLink } from "react-router-dom"
import { Home, Package, Wrench, Settings } from "lucide-react"
import { cn } from "@/lib/utils"

const tabs = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/stock", icon: Package, label: "Stock" },
  { to: "/repairs", icon: Wrench, label: "Repairs" },
  { to: "/settings", icon: Settings, label: "Settings" },
] as const

export function BottomTabBar() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t bg-background/85 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_hsl(var(--foreground)/0.05)] backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="flex h-16 items-center justify-around">
        {tabs.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              cn(
                "flex min-w-12 flex-col items-center gap-1 rounded-lg px-3 py-2 text-xs transition-all",
                isActive
                  ? "bg-primary/10 text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )
            }
          >
            <Icon className="size-5" />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
