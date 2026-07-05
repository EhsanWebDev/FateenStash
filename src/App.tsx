import { BrowserRouter, Routes, Route } from "react-router-dom"
import { Toaster } from "sonner"
import { AppShell } from "@/components/layout/AppShell"
import { HomePage } from "@/pages/HomePage"
import { StockPage } from "@/pages/StockPage"
import { StockDetailPage } from "@/pages/StockDetailPage"
import { RepairsPage } from "@/pages/RepairsPage"
import { RepairDetailPage } from "@/pages/RepairDetailPage"
import { SettingsPage } from "@/pages/SettingsPage"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<HomePage />} />
          <Route path="stock" element={<StockPage />} />
          <Route path="stock/:id" element={<StockDetailPage />} />
          <Route path="repairs" element={<RepairsPage />} />
          <Route path="repairs/:id" element={<RepairDetailPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
      <Toaster
        closeButton
        position="top-right"
        toastOptions={{
          classNames: {
            toast: "app-toast",
          },
        }}
      />
    </BrowserRouter>
  )
}
