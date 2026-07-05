import { useLocation } from "react-router-dom"
import { InstallButton } from "./InstallButton"

const titles: Record<string, string> = {
  "/": "Dashboard",
  "/stock": "Stock",
  "/repairs": "Repair Jobs",
  "/settings": "Settings",
}

export function TopBar() {
  const { pathname } = useLocation()
  const title = titles[pathname] ?? "KK Repairs"

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/85 px-4 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
      <InstallButton className="ml-auto" />
    </header>
  )
}
