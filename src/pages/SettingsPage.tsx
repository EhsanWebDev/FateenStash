import { useState, useEffect } from "react"
import {
  Moon,
  Sun,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { TABLE_SUFFIX_STORAGE_KEY } from "@/lib/table-names"
import { cn } from "@/lib/utils"
import { applyTheme, type Theme, type ThemeMode } from "@/lib/theme"

const themes: { value: Theme; label: string; colors: string }[] = [
  { value: "ocean", label: "Replit", colors: "from-orange-500 to-blue-500" },
  { value: "forest", label: "Volt", colors: "from-lime-400 to-cyan-500" },
  { value: "rose", label: "Studio", colors: "from-violet-600 to-pink-500" },
  { value: "slate", label: "Slate", colors: "from-slate-700 to-amber-500" },
]

export function SettingsPage() {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem("colorTheme") ?? localStorage.getItem("theme")
    const parsed = stored?.includes("-") ? stored.split("-")[1] : stored

    return themes.some(({ value }) => value === parsed) ? (parsed as Theme) : "ocean"
  })
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    const stored = localStorage.getItem("themeMode") ?? localStorage.getItem("theme")

    return stored?.startsWith("dark") || stored === "dark" ? "dark" : "light"
  })
  const [currency, setCurrency] = useState(() => {
    return localStorage.getItem("currency") ?? "PKR"
  })
  const [lowStockThreshold, setLowStockThreshold] = useState(() => {
    return Number(localStorage.getItem("lowStockThreshold") ?? "2")
  })
  const [endpointTapCount, setEndpointTapCount] = useState(0)
  const [endpointSuffix, setEndpointSuffix] = useState(() => {
    return localStorage.getItem(TABLE_SUFFIX_STORAGE_KEY) ?? import.meta.env.VITE_TABLE_SUFFIX ?? ""
  })
  const showEndpointSwitch = endpointTapCount >= 3

  useEffect(() => {
    applyTheme(theme, themeMode)
    localStorage.setItem("colorTheme", theme)
    localStorage.setItem("themeMode", themeMode)
    localStorage.removeItem("theme")
  }, [theme, themeMode])

  useEffect(() => {
    localStorage.setItem("currency", currency)
  }, [currency])

  useEffect(() => {
    localStorage.setItem("lowStockThreshold", String(lowStockThreshold))
  }, [lowStockThreshold])

  function switchEndpoint() {
    const nextSuffix = endpointSuffix === "_dev" ? "" : "_dev"
    localStorage.setItem(TABLE_SUFFIX_STORAGE_KEY, nextSuffix)
    setEndpointSuffix(nextSuffix)
    window.location.reload()
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Settings</h2>

      <div className="grid gap-4 md:grid-cols-2 lg:gap-6">
        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Appearance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium">Mode</span>
                <div className="flex gap-1 rounded-lg bg-secondary p-1">
                  {[
                    { value: "light" as const, icon: Sun, label: "Light" },
                    { value: "dark" as const, icon: Moon, label: "Dark" },
                  ].map(({ value, icon: Icon, label }) => (
                    <button
                      key={value}
                      onClick={() => setThemeMode(value)}
                      className={cn(
                        "flex min-h-8 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                        themeMode === value
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Icon className="size-3.5" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <span className="text-sm font-medium">Theme</span>
                <div className="grid w-full max-w-xs grid-cols-2 gap-1 rounded-lg bg-secondary p-1">
                  {themes.map(({ value, label, colors }) => (
                  <button
                    key={value}
                    onClick={() => setTheme(value)}
                    className={cn(
                      "flex min-h-8 items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                      theme === value
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <span className={cn("size-3.5 rounded-full bg-gradient-to-br", colors)} />
                    {label}
                  </button>
                ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium">Currency Label</span>
                <p className="text-xs text-muted-foreground">
                  Used for display purposes only
                </p>
              </div>
              <Input
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-20 text-center"
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium">Low Stock Alert</span>
                <p className="text-xs text-muted-foreground">
                  Warn when quantity falls to this level
                </p>
              </div>
              <Input
                type="number"
                min={0}
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(Number(e.target.value))}
                className="w-20 text-center"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* About */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">About</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 text-sm">
            <p>
              <span className="font-semibold">KK Repairs</span>
              <button
                type="button"
                onClick={() => setEndpointTapCount((count) => count + 1)}
                className="ml-2 text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                aria-label="Version"
              >
                v1.0.0
              </button>
            </p>
            <p className="text-muted-foreground">
              Mobile & gadget repair shop manager
            </p>
            <p className="text-xs text-muted-foreground">
              Data: Supabase · No authentication required
            </p>
            {showEndpointSwitch && (
              <div className="pt-3">
                <Button variant="outline" size="sm" onClick={switchEndpoint}>
                  Data: {endpointSuffix === "_dev" ? "Dev" : "Prod"} (switch)
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
