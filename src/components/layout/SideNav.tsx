import { NavLink } from "react-router-dom"
import { Home, Package, Wrench, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"

const links = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/stock", icon: Package, label: "Stock" },
  { to: "/repairs", icon: Wrench, label: "Repair Jobs" },
  { to: "/settings", icon: Settings, label: "Settings" },
] as const

export function SideNav() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-60 flex-col border-r bg-background/85 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/70 lg:w-60 md:w-16">
      <div className="flex h-14 items-center px-4 lg:px-5">
        <span className="text-lg font-bold text-primary hidden lg:block">
          Shop FF
        </span>
        <span className="text-lg font-bold text-primary lg:hidden">SF</span>
      </div>

      <Separator />

      <nav className="flex flex-1 flex-col gap-1 p-2">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all hover:translate-x-0.5",
                isActive
                  ? "bg-primary/10 text-primary shadow-sm ring-1 ring-primary/15"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )
            }
          >
            <Icon className="size-5 shrink-0" />
            <span className="hidden lg:inline">{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
