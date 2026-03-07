# BudgetApp — Codebase Breakdown

> This document is intended to give an AI agent a full understanding of the BudgetApp so it can write new features effectively.

---

## Tech Stack

- **Framework:** [Astro](https://astro.build/) v4 (static-site generator with inline `<script>` islands)
- **Backend/DB:** [Supabase](https://supabase.com/) (PostgreSQL + Auth + Row Level Security)
- **Language:** TypeScript (in `<script>` blocks and `src/lib/` files)
- **Styling:** Vanilla CSS with CSS custom properties (no Tailwind, no component library)
- **Fonts:** DM Mono (monospace for data/UI) + Fraunces (serif for headings/values)

---

## Project Structure

```
BudgetApp/
├── src/
│   ├── pages/
│   │   ├── index.astro      ← Yearly overview (home page, route: /)
│   │   ├── month.astro      ← Monthly budget tracker (route: /month?month=YYYY-MM)
│   │   ├── settings.astro   ← Category and currency settings (route: /settings)
│   │   └── auth.astro       ← Sign in / Sign up (route: /auth)
│   └── lib/
│       ├── supabase.ts      ← Supabase client singleton
│       ├── auth.ts          ← Auth helper functions (signIn, signUp, signOut, getCurrentUser)
│       ├── currency.ts      ← Currency formatting utilities + CurrencyCode type
│       └── dialogs.ts       ← Custom modal utilities (showToast, showConfirm, showPrompt)
├── public/
│   └── styles/global.css    ← Shared design system (CSS variables, layout, components)
└── supabase/
    └── migrations/          ← 17 migration files documenting the DB evolution
```

---

## Pages

### `/auth` — `auth.astro`

The unauthenticated entry point. Has two tab-based forms: **Sign In** and **Sign Up**. On sign-up, users select a **preferred currency** (ZAR, USD, GBP, EUR), which is immediately saved to `user_settings`. On success, it redirects to `/`. Uses `signIn()` and `signUp()` from `src/lib/auth.ts`.

---

### `/` — `index.astro` (Yearly Overview)

The home/dashboard page. Shows a **financial year overview** (April–March). Key behaviors:

- Defaults to the current financial year (if the current month is Jan/Feb/Mar, the FY started the previous year)
- Navigation arrows let the user move between financial years (`changeFY(±1)`)
- Loads all 12 months of `incomes` and `budgets` from Supabase and aggregates them
- Displays 4 summary cards: **Total Income**, **Total Budget**, **Total Actual**, **Variance**
- An optional **Currency Conversion** section shows totals converted to a secondary currency using `exchangerate-api.com`
- A **Monthly Breakdown** grid shows each month as a clickable card, linking to `/month?month=YYYY-MM`
- Shows shimmer skeleton loading states while fetching data

**Key local state variables:**
- `currentYear` — the start year of the displayed financial year
- `monthlyData` — array of 12 `MonthlyData` objects (income, budget, actual, net per month)
- `userCurrency` — user's preferred currency (from `user_settings`)
- `showCurrencyConversion` / `conversionCurrency` — optional secondary currency display
- `exchangeRate` — live rate fetched from `exchangerate-api.com`

---

### `/month` — `month.astro` (Monthly Budget Tracker)

The main working page. Accepts a `?month=YYYY-MM` query param (defaults to current month). Key sections:

1. **Monthly Income** — Lists all income sources for the month. Users can add/rename/remove income sources and update amounts.
2. **Account Balances** — Starting and ending balance inputs. Starting balance is auto-filled from the previous month's ending balance (carried over). The carried-over amount is included in the income total.
3. **Summary Cards** — Income (+ carried over), Budget, Actual, Net Variance.
4. **Currency Conversion** — Optional panel (controlled by settings) showing budget/actual/net in a secondary currency.
5. **Budget Table** — Full-width table of all categories grouped by `category_group`. Each row has editable budget and actual number inputs. Two helper buttons: `→` (copy budget to actual) and `×` (clear actual to 0). Groups are collapsible. Variance is shown per row and per group header. Categories of type `'fixed'` show a "fixed" badge.

**Key local state variables:**
- `currentMonth` — the active month as `YYYY-MM-01`
- `zarData` — array of `CategoryData` objects (id, name, budget, actual, fixed, group)
- `zarBudgets` / `zarActuals` — flat number arrays mirroring `zarData` for totals
- `incomeSources` — array of `{ id, source_name, amount }` for the current month
- `carriedOver` — the ending balance from the previous month
- `totalIncome` — sum of all income source amounts
- `groupStates` — `Record<string, boolean>` tracking collapsed/expanded state of each category group
- `userCurrency` / `userSettings` — currency preferences loaded from `user_settings`
- `exchangeRate` — live rate from `exchangerate-api.com`

**Core functions:**
- `loadMonth()` — fetches categories, budgets, incomes, balances; auto-creates missing budget rows
- `buildZAR()` — renders the budget table DOM (groups + ungrouped rows)
- `refreshTotals()` — recalculates and updates all summary card values
- `onBudgetChange()` / `onActualChange()` — upsert a `budgets` row on input change/blur
- `copyBudgetToActual()` / `clearActual()` — helper upserts for the → and × buttons
- `addIncomeSource()` / `removeIncomeSource()` — create/delete template + monthly income rows
- `updateIncomeAmount()` / `updateIncomeSourceName()` — update income rows in Supabase
- `updateBalance()` — upsert a `monthly_balances` row
- `toggleGroup()` — flip group collapsed state and re-render table
- `updateExchangeRate()` — fetch live rate and call `updateZarToGbpConversion()`

---

### `/settings` — `settings.astro`

Two sections:

1. **Currency Settings** — Preferred currency selector + show/hide currency conversion toggle + conversion target currency selector. Saved via `saveCurrencySettings()` which upserts multiple rows into `user_settings` (one per key).
2. **Category Management** — Lists all categories with inline-editable name and default monthly budget amount. Supports:
   - Adding a new category (`addNewCategory()`) — prompts for name, then asks fixed/variable
   - Updating category name inline (`updateCategoryName()`)
   - Updating the default monthly budget amount (`updateCategoryDefault()`)
   - Deleting a category (`deleteCategory()`) — cascades to all associated budget rows

---

## Database Schema

All tables use Supabase Row Level Security (RLS). Every table has a `user_id UUID` column referencing `auth.users(id)`, and RLS policies ensure users can only see/modify their own data. A `set_user_id()` trigger automatically populates `user_id` on insert.

### `categories`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `name` | TEXT | Display name |
| `type` | TEXT | `'fixed'` or `'variable'` |
| `monthly_amount` | NUMERIC | Default budget amount used when auto-creating budget rows |
| `category_group` | TEXT | Optional grouping label (e.g. "Housing", "Food") |
| `user_id` | UUID | FK → `auth.users` |

---

### `budgets`

Stores the planned and actual spend per category per month.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `category_id` | UUID | FK → `categories` |
| `month` | DATE | Always `YYYY-MM-01` |
| `budget_amount` | NUMERIC | Planned spend |
| `actual_amount` | NUMERIC | Real spend entered by user |
| `user_id` | UUID | FK → `auth.users` |

**Unique constraint:** `(category_id, month, user_id)`

When a month page is first loaded, the app auto-creates budget rows for every category using `monthly_amount` as the default, via an upsert with `ignoreDuplicates: true`.

---

### `incomes`

Supports multiple named income sources per month using a **template pattern**:

- **Template rows** — `is_template = true`, `month = '1970-01-01'`. Defines the persistent set of income source names for a user (e.g. "Salary", "Freelance").
- **Monthly rows** — `is_template = false`, `month = YYYY-MM-01`. Holds the actual income amount for that source in that month.

When a month page loads, the app reads templates and upserts any missing monthly rows for the current month (with `amount = 0`).

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `source_name` | TEXT | e.g. "Salary" |
| `month` | DATE | `1970-01-01` for templates; real month for monthly rows |
| `amount` | NUMERIC | Income amount (0 for templates) |
| `is_template` | BOOLEAN | `true` = template definition; `false` = monthly entry |
| `currency` | TEXT | Currency code |
| `user_id` | UUID | FK → `auth.users` |

**Unique constraint:** `(source_name, month, user_id)`

Removing an income source deletes **all** rows (template + all monthly entries) for that `source_name` and `user_id`.

---

### `monthly_balances`

Tracks the user's account starting and ending balance per month. The ending balance of month N is automatically used as the starting balance for month N+1 (carried-over).

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `month` | DATE | `YYYY-MM-01` |
| `currency` | TEXT | Currency code |
| `starting_balance` | NUMERIC | Auto-filled from previous month's ending balance |
| `ending_balance` | NUMERIC | User-entered |
| `user_id` | UUID | FK → `auth.users` |

**Unique constraint:** `(month, currency, user_id)`

The carried-over value is **included in the income total** displayed on the summary cards: `Income card = totalIncome + carriedOver`.

---

### `user_settings`

A key-value store for per-user preferences. Each setting is one row.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `user_id` | UUID | FK → `auth.users` |
| `key` | TEXT | Setting name |
| `value` | TEXT | Setting value (always stored as string) |
| `preferred_currency` | TEXT | Denormalized currency code (mirrors `value` for `key='preferred_currency'`) |

**Unique constraint:** `(user_id, key)`

**Known keys:**
- `'preferred_currency'` — e.g. `'ZAR'`, `'GBP'`, `'USD'`, `'EUR'`
- `'show_currency_conversion'` — `'true'` or `'false'`
- `'conversion_currency'` — e.g. `'GBP'`

---

## Shared Libraries

### `src/lib/supabase.ts`

Creates and exports the singleton `supabase` client via `createClient()`. The Supabase URL and anon key are read from `import.meta.env` with hardcoded fallbacks. Includes debug logging on first connection.

```ts
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
```

---

### `src/lib/auth.ts`

Thin wrappers around Supabase auth:

| Function | Description |
|---|---|
| `getCurrentUser()` | Returns the current `User` or `null` |
| `getCurrentSession()` | Returns the current `Session` or `null` |
| `signIn(email, password)` | Email/password sign-in |
| `signUp(email, password)` | Email/password sign-up |
| `signOut()` | Signs out the current user |
| `onAuthStateChange(callback)` | Subscribes to auth state changes |

All pages call a local `checkAuth()` function on load which uses `getCurrentUser()` and redirects to `/auth` if unauthenticated. They also attach an `onAuthStateChange` listener to redirect immediately if the session expires mid-session.

---

### `src/lib/currency.ts`

Defines 4 supported currencies: `ZAR`, `USD`, `GBP`, `EUR`.

| Export | Description |
|---|---|
| `CurrencyCode` | TypeScript union type: `'ZAR' \| 'USD' \| 'GBP' \| 'EUR'` |
| `formatCurrency(amount, currency)` | Returns a locale-formatted string via `Intl.NumberFormat` (0 decimal places) |
| `getCurrencySymbol(currency)` | Returns the symbol: `'R'`, `'$'`, `'£'`, `'€'` |

---

### `src/lib/dialogs.ts`

Custom modal/toast system that replaces native browser `alert`/`confirm`/`prompt`:

| Function | Description |
|---|---|
| `showToast(message, type)` | Slides in a fixed bottom-right toast. Auto-dismisses after 3s. `type` is `'success'` (green border) or `'error'` (red border). |
| `showConfirm(title, message, confirmLabel, danger)` | Returns `Promise<boolean>`. Renders a modal with Cancel/Confirm buttons. When `danger=true` the confirm button is red. |
| `showPrompt(title, placeholder, confirmLabel)` | Returns `Promise<string \| null>`. Renders a modal with a text input. Supports Enter/Escape keyboard shortcuts. |

---

## Design System & Theming

All styling uses CSS custom properties defined in `public/styles/global.css`. The app supports **dark mode** (default) and **light mode**, toggled via a fixed button at the bottom-right corner. The theme preference is persisted in `localStorage` under the key `'theme'`.

### CSS Custom Properties

| Variable | Dark Value | Purpose |
|---|---|---|
| `--bg` | `#0d0f0e` | Page background |
| `--surface` | `#151815` | Card / panel background |
| `--surface2` | `#1c201b` | Elevated element background (inputs, buttons) |
| `--border` | `#2a2f28` | Border colour |
| `--accent` | `#c8f560` | Primary accent (lime green) — used for positive values, focus rings, active states |
| `--accent2` | `#f5c842` | Secondary accent (amber) |
| `--red` | `#f56060` | Error / danger / over-budget colour |
| `--text` | `#d8e0d4` | Primary text |
| `--text-dim` | `#8a9688` | Secondary / label text |
| `--muted` | `#5a6358` | Muted / placeholder text |

### Reusable CSS Component Classes

| Class | Purpose |
|---|---|
| `.page` | Centered max-width content wrapper (900px default, 1100px on index) |
| `.balance-section` | Bordered card panel with padding |
| `.summary-grid` | CSS grid of summary stat cards |
| `.summary-card` | Individual stat card (label + big value + note) |
| `.section-title` | Italic serif section heading |
| `.currency-btn` | Small bordered action button |
| `.balance-input` | Full-width styled text/number/select input |
| `.skeleton` | Shimmer loading placeholder (animated gradient) |
| `.skeleton-card` | Full card skeleton |
| `.skeleton-row` | Row-height skeleton |
| `.theme-toggle` | Fixed bottom-right theme switch button |

---

## Key Patterns & Conventions

### Auth Guard Pattern
Every protected page runs this at init:
```ts
const isAuthenticated = await checkAuth(); // redirects to /auth if false
if (!isAuthenticated) return;
onAuthStateChange((_event, session) => {
  if (!session?.user) window.location.href = '/auth';
});
```

### Upsert Pattern
All writes use Supabase `.upsert()` with an explicit `onConflict` key to avoid duplicates:
```ts
await supabase.from('budgets').upsert({
  category_id, month, budget_amount, actual_amount, user_id
}, { onConflict: 'category_id,month,user_id' });
```

### Skeleton → Real Content Pattern
Every data-loading function first calls `showSkeletons()` (replaces DOM with shimmer placeholders), then after data loads calls `restoreSummaryCards()` to put the real HTML back before populating values.

### Financial Year Logic
- FY runs **April → March**
- April through December belong to year `Y`; January through March belong to year `Y+1`
- Months are stored as 12-element arrays ordered `[Apr, May, Jun, Jul, Aug, Sep, Oct, Nov, Dec, Jan, Feb, Mar]`
- Month strings are always `YYYY-MM-01` format (full DATE, not just year-month)

### Income "Carried Over" Logic
`carriedOver` = previous month's `ending_balance` from `monthly_balances`. It is:
- Displayed as a read-only line in the income section
- Auto-populated into the current month's `starting_balance`
- **Added to** `totalIncome` when computing the Income summary card and the net/variance values

### Currency Conversion
When `show_currency_conversion` is enabled in settings, the app:
1. Fetches a live exchange rate from `https://api.exchangerate-api.com/v4/latest/{baseCurrency}`
2. Falls back to `0.042` (hardcoded) if the API fails
3. Displays a secondary panel showing budget/actual/net converted to `conversion_currency`
