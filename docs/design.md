# UI Design Reference — Shop FF

## Tech Stack

| Tool | Version | Role |
|------|---------|------|
| Vite | 8 | Build tool |
| React | 19 | UI framework |
| TypeScript | ~6 | Type safety |
| Tailwind CSS | v4 | Utility-first styling |
| shadcn/ui | latest | Accessible component primitives |
| Lucide React | latest | Icon set |
| React Router | v7 | Client-side routing |
| vite-plugin-pwa | latest | PWA manifest + service worker |

---

## Installation Steps

```bash
# 1. Tailwind CSS v4
npm install tailwindcss @tailwindcss/vite

# 2. shadcn/ui init (sets up components.json, cn utility, CSS variables)
npx shadcn@latest init

# 3. Lucide icons
npm install lucide-react

# 4. React Router
npm install react-router-dom

# 5. PWA plugin
npm install -D vite-plugin-pwa
```

---

## Design Tokens

All tokens are CSS custom properties injected by shadcn's init into `src/index.css`. Tailwind v4 reads them via `@theme inline`.

### Color Palette

```css
/* Base semantic tokens (light mode) */
--background:        0 0% 100%        /* page background */
--foreground:        222 47% 11%      /* default text */
--card:              0 0% 100%        /* card surface */
--card-foreground:   222 47% 11%
--popover:           0 0% 100%
--primary:           199 89% 48%      /* brand teal/blue — CTA buttons, active nav */
--primary-foreground:0 0% 100%
--secondary:         210 40% 96%      /* subtle backgrounds */
--muted:             210 40% 96%
--muted-foreground:  215 16% 47%
--accent:            210 40% 96%
--destructive:       0 84% 60%        /* delete, error states */
--border:            214 32% 91%
--input:             214 32% 91%
--ring:              199 89% 48%

/* Status colors (custom additions) */
--status-pending:    45 93% 47%       /* yellow */
--status-progress:   199 89% 48%      /* blue */
--status-complete:   142 71% 45%      /* green */
--status-alert:      0 84% 60%        /* red — low stock */
```

Dark mode uses the `.dark` class (toggled by user setting in Settings tab). shadcn provides dark-mode variants of all tokens automatically.

### Typography

| Role | Class | Size |
|------|-------|------|
| Page title | `text-2xl font-bold` | 24px |
| Section heading | `text-lg font-semibold` | 18px |
| Card value | `text-3xl font-bold tabular-nums` | 30px |
| Card label | `text-sm text-muted-foreground` | 14px |
| Body | `text-sm` | 14px |
| Caption / badge | `text-xs` | 12px |

Font family: system-ui stack (`-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`) — no custom font download required for PWA performance.

---

## Responsive Breakpoints

| Breakpoint | Range | Layout Mode |
|-----------|-------|-------------|
| Mobile | 320px – 767px | Top app bar + bottom tab bar |
| Tablet | 768px – 1023px | Icon-only side nav (collapsed) |
| Desktop | 1024px+ | Expanded side nav with labels |

Tailwind prefixes used: `sm:` (640px), `md:` (768px), `lg:` (1024px), `xl:` (1280px).

---

## Navigation Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         MOBILE < 768px                          │
│ ┌───────────────────────────────────────────────────────────┐   │
│ │  ← [App Name / Page Title]              [action icon]  56px│  │
│ └───────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                                                          │   │
│  │              SCROLLABLE CONTENT AREA                     │   │
│  │         calc(100dvh - 56px - 64px - safe-insets)        │   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│ ┌───────────────────────────────────────────────────────────┐   │
│ │   Home      Stock      Fee      Settings             64px │   │
│ │  [Home]   [Package]  [Wrench]  [Settings]                 │   │
│ └───────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      DESKTOP ≥ 768px                            │
│ ┌──────────┬──────────────────────────────────────────────────┐ │
│ │ Side Nav │                                                  │ │
│ │  240px   │           MAIN CONTENT AREA                      │ │
│ │ ──────── │                                                  │ │
│ │ [Home]   │  ┌──────────────────────────────────────────┐   │ │
│ │ [Stock]  │  │   Page Header (title + actions)          │   │ │
│ │ [Fee]    │  └──────────────────────────────────────────┘   │ │
│ │ [Settings│  │   Content                                │   │ │
│ │          │  └──────────────────────────────────────────┘   │ │
│ └──────────┴──────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Tab / Nav Items

| Tab | Lucide Icon | Route | Description |
|-----|------------|-------|-------------|
| Home | `Home` | `/` | Dashboard with profit metrics |
| Stock | `Package` | `/stock` | Inventory management |
| Fee | `Wrench` | `/fee` | Repair jobs and fees |
| Settings | `Settings` | `/settings` | App configuration |

### Component: `AppShell`

Wraps all pages. Renders either:
- **Mobile**: `<TopBar>` + `<Outlet>` + `<BottomTabBar>`
- **Desktop**: `<SideNav>` + `<Outlet>`

Detection via Tailwind's `md:` breakpoint using a `useMediaQuery('(min-width: 768px)')` hook.

---

## Page Layouts

### Home — Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│  Dashboard                          [Today ▼]               │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │ Total Revenue│  │ Gross Profit │   ← 2-col on mobile    │
│  │  ₨ 48,500   │  │  ₨ 31,200   │     4-col on desktop    │
│  └──────────────┘  └──────────────┘                        │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │ Repair Fees  │  │ Parts Revenue│                        │
│  │  ₨ 18,000   │  │  ₨ 30,500   │                        │
│  └──────────────┘  └──────────────┘                        │
│                                                             │
│  Recent Repairs                          [View all →]       │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ iPhone 13 · Screen crack       [in_progress]  ₨4,500 │  │
│  │ Samsung A54 · Dead battery     [completed]    ₨2,000 │  │
│  │ Infinix · Charging issue       [pending]      ₨1,500 │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  ⚠ Low Stock Alerts                                         │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ x680 Infinix Panel     1 left    [Package] [Restock]  │  │
│  │ Samsung A54 Battery    2 left    [Package] [Restock]  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**Metric Card anatomy (shadcn `Card`):**

```
┌────────────────────────────┐
│ [TrendingUp icon]  Label   │  ← CardHeader with icon + label
│                            │
│  ₨ 48,500                  │  ← CardContent: large tabular-nums value
│  +12% from yesterday       │  ← muted-foreground trend line
└────────────────────────────┘
```

---

### Stock — Inventory

```
┌─────────────────────────────────────────────────────────────┐
│  Stock                                       [+ Add Part]   │
│                                                             │
│  [🔍 Search...]   [Category ▼]                              │
│                                                             │
│  Panels (12)                                                │
│  ┌──────────┬──────────────────┬───────┬────────┬────────┐  │
│  │ #        │ Name             │ Qty   │ Price  │        │  │
│  ├──────────┼──────────────────┼───────┼────────┼────────┤  │
│  │ x680     │ x680 Infinix Unit│  2    │ ₨1,720 │ [⋮]   │  │
│  │ s54-scr  │ Samsung A54 Panel│  5    │ ₨3,200 │ [⋮]   │  │
│  └──────────┴──────────────────┴───────┴────────┴────────┘  │
│                                                             │
│  (On mobile: table becomes card list — one card per item)   │
└─────────────────────────────────────────────────────────────┘
```

Mobile stock item card:
```
┌──────────────────────────────────────┐
│  x680 Infinix Unit          [⋮ menu] │
│  #x680 · Panel                       │
│  Qty: 2          Price: ₨1,720       │
└──────────────────────────────────────┘
```

**Add/Edit Part** — opens as `Sheet` (bottom drawer on mobile, side panel on desktop):
- Product Number (Input)
- Name (Input)
- Category (Select: panel | strip | mic | chip | speaker | battery | connector | other)
- Quantity (Input, type=number)
- Price per Unit (Input, type=number)
- [Cancel] [Save]

---

### Fee — Repairs & Sales

```
┌─────────────────────────────────────────────────────────────┐
│  Repairs                                  [+ New Repair]    │
│                                                             │
│  [All ▼]  [pending] [in_progress] [completed]  ← filter    │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ iPhone 13 · Ahmad                    [in_progress]    │  │
│  │ Screen crack · Fee: ₨4,500           May 10, 2026     │  │
│  │ [View/Edit]  [Attach Parts]  [Complete]               │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Samsung A54 · Ali                    [pending]        │  │
│  │ Dead battery · Fee: ₨2,000           May 9, 2026      │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**Add Repair** — `Sheet` form:
- Customer Name (Input, optional)
- Device (Input, required)
- Issue / Description (Textarea)
- Fee (Input, type=number)
- Status (Select)
- Notes (Textarea, optional)

**Repair Detail / Attach Parts** — full-screen on mobile, `Dialog` on desktop:
- Repair summary at top
- Parts list (table of sales rows linked to this repair)
- [+ Add Part] button opens inline: pick inventory item → set qty → set sell price → Save

---

### Settings

```
┌─────────────────────────────────────────────────────────────┐
│  Settings                                                   │
│                                                             │
│  Appearance                                                 │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Theme          [Light]  [Dark]  [System]             │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  Preferences                                                │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Currency Label         [PKR]                         │  │
│  │  Low Stock Alert Qty    [2  ]                         │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  About                                                      │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Shop FF  · v1.0.0                                    │  │
│  │  Data: Supabase · No authentication required          │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## shadcn Component Map

| shadcn Component | Used In |
|-----------------|---------|
| `Card`, `CardHeader`, `CardContent`, `CardFooter` | Dashboard metric cards, list item wrappers |
| `Button` | All CTAs, nav actions, form submissions |
| `Sheet` | Add/Edit forms on mobile (bottom drawer) |
| `Dialog` | Confirmations, repair detail on desktop |
| `Table`, `TableHeader`, `TableRow`, `TableCell` | Inventory list, sales list (desktop) |
| `Badge` | Repair status indicators, category tags |
| `Input` | All text/number form fields |
| `Textarea` | Issue description, notes |
| `Select`, `SelectItem` | Category filter, status filter, form selects |
| `Tabs`, `TabsList`, `TabsTrigger` | Inventory category filter sub-tabs |
| `Separator` | Visual dividers in settings, nav |
| `ScrollArea` | Long lists within fixed-height containers |
| `DropdownMenu` | Row action menus (⋮) on list items |
| `Skeleton` | Loading states for all data-fetched sections |
| `Alert` | Low stock warning banners |
| `Switch` | Toggle settings (theme, future options) |
| `Label` | Form field labels |

---

## Lucide Icon Reference

| Icon | Usage |
|------|-------|
| `Home` | Home tab |
| `Package` | Stock tab, inventory items |
| `Wrench` | Fee tab, repair jobs |
| `Settings` | Settings tab |
| `TrendingUp` | Revenue / profit metric cards |
| `DollarSign` | Fee/price displays |
| `ShoppingCart` | Parts revenue metric |
| `AlertTriangle` | Low stock alerts |
| `Plus` | Add actions |
| `Pencil` | Edit actions |
| `Trash2` | Delete actions |
| `MoreVertical` | Row action menu trigger (⋮) |
| `Check` | Complete repair action |
| `Clock` | Pending status |
| `Loader2` | Loading spinner (animated with `animate-spin`) |
| `ChevronRight` | "View all" links |
| `Moon` | Dark mode |
| `Sun` | Light mode |
| `Monitor` | System theme |
| `Search` | Search input prefix |

---

## PWA Configuration

### `vite.config.ts` additions

```typescript
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Shop FF',
        short_name: 'ShopFF',
        description: 'Mobile & gadget repair shop manager',
        theme_color: '#0ea5e9',        // primary teal/blue
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      }
    })
  ]
})
```

### Touch & Viewport Rules

| Rule | Value | Reason |
|------|-------|--------|
| Min touch target | 48×48px | Android / iOS guidelines |
| Bottom tab bar height | 64px | Comfortable thumb reach |
| Safe-area padding | `env(safe-area-inset-bottom)` | Notched phones (iPhone X+) |
| Top app bar height | 56px | Material / HIG standard |
| Content area (mobile) | `calc(100dvh - 56px - 64px)` | Avoids browser chrome overlap |
| Viewport meta | `viewport-fit=cover` | Allows full bleed with safe-area |

---

## File Structure (Target)

```
src/
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx          # Root layout: picks mobile or desktop nav
│   │   ├── TopBar.tsx            # Mobile top app bar
│   │   ├── BottomTabBar.tsx      # Mobile bottom navigation
│   │   └── SideNav.tsx           # Desktop side navigation
│   ├── dashboard/
│   │   ├── MetricCard.tsx        # Reusable profit/revenue card
│   │   ├── RecentRepairs.tsx     # Last N repair jobs list
│   │   ├── LowStockAlerts.tsx    # Alert list for low inventory
│   │   └── TimePeriodFilter.tsx  # Today / Week / Month selector
│   ├── stock/
│   │   ├── InventoryTable.tsx    # Desktop table view
│   │   ├── InventoryCardList.tsx # Mobile card list view
│   │   └── PartForm.tsx          # Add/Edit sheet form
│   ├── fee/
│   │   ├── RepairList.tsx        # List of repair jobs
│   │   ├── RepairCard.tsx        # Single repair row/card
│   │   ├── RepairForm.tsx        # Add/Edit sheet form
│   │   └── AttachPartsForm.tsx   # Link sales to a repair
│   └── ui/                       # shadcn generated components
├── pages/
│   ├── HomePage.tsx
│   ├── StockPage.tsx
│   ├── FeePage.tsx
│   └── SettingsPage.tsx
├── hooks/
│   ├── useMediaQuery.ts          # Responsive breakpoint detection
│   ├── useMetrics.ts             # Dashboard profit calculations
│   ├── useInventory.ts           # Inventory CRUD + realtime
│   └── useRepairs.ts             # Repairs CRUD + realtime
├── lib/
│   └── supabase.ts               # Existing Supabase client
├── types/
│   └── database.types.ts         # Existing + new Repair/Sale types
└── docs/
    ├── db.md                     # Existing DB reference
    ├── scope.md                  # ← created
    └── design.md                 # ← this file
```

---

## Theming Implementation

```css
/* src/index.css — extend shadcn variables with status colors */
@layer base {
  :root {
    /* shadcn defaults ... */
    --status-pending:  45 93% 47%;
    --status-progress: 199 89% 48%;
    --status-complete: 142 71% 45%;
  }
  .dark {
    /* shadcn dark defaults ... */
    --status-pending:  45 93% 55%;
    --status-progress: 199 89% 60%;
    --status-complete: 142 71% 55%;
  }
}
```

Badge variant helper:

```typescript
// src/lib/utils.ts additions
export function statusBadgeVariant(status: RepairStatus) {
  return {
    pending:     'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    completed:   'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  }[status]
}
```

---

## Data Fetching Pattern

All pages use custom hooks that wrap Supabase queries. Each hook:
1. Fetches on mount
2. Returns `{ data, loading, error }` state
3. Exposes mutation functions (`add`, `update`, `remove`)
4. Subscribes to Supabase realtime for live updates

```typescript
// Example pattern
function useInventory() {
  const [items, setItems] = useState<InventoryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase.from('inventory').select('*').order('name')
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else setItems(data ?? [])
        setLoading(false)
      })
  }, [])

  return { items, loading, error, /* mutations */ }
}
```

---

## Currency Formatting

All monetary values are in **PKR (Pakistani Rupee)**. Format helper:

```typescript
export function formatPKR(amount: number): string {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}
// Output: ₨ 48,500
```
