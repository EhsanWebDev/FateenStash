export type Theme = "ocean" | "forest" | "rose" | "slate"
export type ThemeMode = "light" | "dark"

const themes: Theme[] = ["ocean", "forest", "rose", "slate"]

function readStoredTheme(): Theme {
  const stored = localStorage.getItem("colorTheme") ?? localStorage.getItem("theme")
  const theme = stored?.includes("-") ? stored.split("-")[1] : stored

  return themes.includes(theme as Theme) ? (theme as Theme) : "ocean"
}

function readStoredMode(): ThemeMode {
  const stored = localStorage.getItem("themeMode") ?? localStorage.getItem("theme")

  return stored?.startsWith("dark") || stored === "dark" ? "dark" : "light"
}

export function applyTheme(theme: Theme = readStoredTheme(), mode: ThemeMode = readStoredMode()) {
  const root = document.documentElement

  root.dataset.theme = theme
  root.classList.toggle("dark", mode === "dark")
}
