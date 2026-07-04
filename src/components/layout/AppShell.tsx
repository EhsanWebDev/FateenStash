import { Outlet } from "react-router-dom"
import { useMediaQuery } from "@/hooks/useMediaQuery"
import { TopBar } from "./TopBar"
import { BottomTabBar } from "./BottomTabBar"
import { SideNav } from "./SideNav"

export function AppShell() {
  const isDesktop = useMediaQuery("(min-width: 768px)")

  if (isDesktop) {
    return (
      <div className="flex min-h-screen bg-background/80">
        <SideNav />
        <main className="min-w-0 flex-1 md:pl-16 lg:pl-60">
          <div className="animate-page-in mx-auto w-full max-w-[1440px] p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background/80">
      <TopBar />
      <main className="animate-page-in flex-1 overflow-auto px-4 py-4 pb-24">
        <Outlet />
      </main>
      <BottomTabBar />
    </div>
  )
}
