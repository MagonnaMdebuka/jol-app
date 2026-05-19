# Jol — Nightlife & Food Discovery App

Jol is a web application for discovering events, clubs, restaurants and food spots across Gauteng, South Africa. Venue owners register and post listings; regular users browse anonymously. The app is fully functional with mock data when no Supabase keys are configured.

---

## Critical: Guard Pattern

**Every Supabase call is guarded.** When `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` is blank, the app falls back to mock data and no-ops — it never crashes on an empty `.env`.

```ts
// src/config/env.ts
export const isSupabaseEnabled = (): boolean =>
  !!(getSupabaseUrl() && getSupabaseAnonKey());

// Every service function follows this pattern:
export const getListings = async (): Promise<IListing[]> => {
  if (!isSupabaseEnabled() || !supabase) return MOCK_LISTINGS;
  // ... real Supabase call
};
```

**Do not add Supabase calls without this guard. Do not add fallback credential values.**

---

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript (strict) |
| Build | Vite 8 |
| Styling | Tailwind CSS v3 — `nz-*` custom tokens |
| Routing | React Router v6 (lazy-loaded pages) |
| Database / Auth | Supabase JS SDK v2 (guarded) |
| Map | react-leaflet v5 + CartoDB Dark Matter tiles (no API key) |
| Icons | lucide-react |
| Fonts | Bricolage Grotesque (display) · JetBrains Mono (mono) · Inter (body) |
| Deployment | Vercel (static SPA, `vercel.json` catch-all rewrite) |

No backend server. No Docker. No separate API package. Supabase is the backend.

---

## Architecture

### Provider Stack (`src/App.tsx`)

```
ToastProvider
  AuthProvider          ← Supabase auth, owner role
    ListingsProvider    ← listings fetch + vibe/radius filters
      SavedProvider     ← localStorage saved listings
        <Routes>
```

### Context Responsibilities

| Context | State | Persistence |
|---------|-------|-------------|
| `AuthContext` | `user`, `loading`, `signIn`, `signOut`, `isOwner` | Supabase session |
| `ListingsContext` | `listings`, `filteredListings`, `filters`, `userLat`, `userLng`, `loading` | In-memory |
| `SavedContext` | `savedIds: Set<string>`, `toggleSave`, `isSaved` | `localStorage` key `jol-saved` |

### Filter Shape

```ts
type VibeFilterId =
  | 'all' | 'tonight' | 'weekend' | 'eat'
  | 'go-out' | 'chill' | 'date-night' | 'free';

interface IListingsFilter {
  vibe: VibeFilterId;
  radius: number; // km
}
```

### Map

- Tile URL: `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png`
- Default centre: `{ lat: -26.0, lng: 28.0 }`, zoom 11 (Gauteng)
- Event markers: `#ff7a3d` (orange) · Food markers: `#d9a85c` (apricot)
- `src/index.css` sets `.leaflet-container { z-index: 0 }` — this isolates Leaflet's internal z-index stack. UI overlays sit at `z-[1000]`. **Never remove this rule.**

---

## Design System

### Colour Tokens (`nz-*`)

| Token | Hex | Role |
|-------|-----|------|
| `nz-bg` | `#16110c` | Page background |
| `nz-surface` | `#1f1810` | Card / panel surface |
| `nz-elevated` | `#2a2014` | Inputs, elevated elements |
| `nz-border` | `#3a2c1b` | All borders |
| `nz-text` | `#f5ecd9` | Primary text |
| `nz-muted` | `#a08a72` | Secondary text, inactive icons |
| `nz-accent` | `#ff7a3d` | Brand orange, CTAs, event markers |
| `nz-accent-text` | `#ffb88a` | Accent text on dark backgrounds |
| `nz-apricot` | `#f4c477` | Food type accent |

### Brand Wordmark

Always render "Jol" with split colours:
```tsx
<span style={{ color: '#f5ecd9' }}>J</span>
<span style={{ color: '#ff7a3d' }}>ol</span>
```

### Typography

- **Display headings:** `fontFamily: '"Bricolage Grotesque", system-ui'`, weight 800–900, `letterSpacing: '-0.04em'`
- **Mono labels / metadata:** `fontFamily: '"JetBrains Mono", monospace'`, 9–11px, `letterSpacing: '0.04em'`
- **Body:** Tailwind default (Inter)

### TypeMark Badges

- Events: `◈ Go out` — orange
- Food: `⌇ Eat` — apricot

### Web Layout Pattern

Pages use `h-full overflow-y-auto bg-nz-bg` as the scroll container with a centred inner wrapper:
- User pages (Feed): `max-w-7xl mx-auto px-6 lg:px-8`
- Focused pages (Search, Saved): `max-w-3xl mx-auto px-6 lg:px-8`
- Owner pages: `max-w-5xl mx-auto px-6 lg:px-8`

---

## File Structure

```
src/
├── config/
│   ├── env.ts              ← isSupabaseEnabled(), env accessors
│   └── supabase.ts         ← guarded createClient (nullable)
├── types/
│   ├── listing.types.ts    ← IListing, IListingWithDistance
│   ├── venue.types.ts
│   ├── user.types.ts
│   └── report.types.ts
├── constants/
│   ├── mockData.ts         ← 9 SA mock listings (Gauteng)
│   ├── categories.ts       ← VIBE_FILTERS, VibeFilterId, NEIGHBOURHOODS
│   └── mapConfig.ts        ← DEFAULT_CENTRE, DEFAULT_ZOOM
├── contexts/
│   ├── AuthContext.tsx
│   ├── ListingsContext.tsx
│   └── SavedContext.tsx
├── services/
│   ├── auth.service.ts
│   ├── listing.service.ts  ← incrementViewCount()
│   ├── venue.service.ts
│   ├── report.service.ts   ← auto under_review at 3+ reports
│   └── storage.service.ts  ← blob URL mock when Storage absent
├── hooks/
│   ├── useGeolocation.ts
│   └── useNearbyListings.ts ← Haversine, sorts by distance
├── components/
│   ├── ui/                 ← Button, Input, Badge, Chip, BottomSheet, Modal, Spinner, Toast
│   ├── layout/             ← AppShell, TopNav, OwnerShell, OwnerNav, BottomNav
│   ├── map/                ← MapView, MapFilters, MapFallback
│   ├── listings/           ← ListingCard (3 variants), ReportButton, ImageUploader
│   └── auth/               ← PhoneOTPForm, EmailAuthForm, AuthGuard
└── pages/
    ├── DiscoveryMap.tsx    ← / (default)
    ├── Feed.tsx            ← /feed
    ├── Search.tsx          ← /search
    ├── Saved.tsx           ← /saved
    ├── ListingDetail.tsx   ← /listing/:id
    └── owner/
        ├── OwnerRegister.tsx
        ├── OwnerLogin.tsx
        ├── Dashboard.tsx
        ├── VenueSetup.tsx
        ├── NewListing.tsx
        └── EditListing.tsx
```

---

## Methodology

This project uses a **multi-agent methodology**. Each agent works in its domain, pushes a branch, and signals readiness. The coordinator owns `main` and creates PRs.

### Agent Roles

| Agent | File | Domain |
|-------|------|--------|
| **frontend** | `.claude/agents/frontend.md` | `src/components/`, `src/pages/`, `src/index.css` |
| **services** | `.claude/agents/services.md` | `src/services/`, `src/contexts/`, `src/hooks/`, `src/config/`, `src/types/`, `src/constants/` |
| **devops** | `.claude/agents/devops.md` | `vite.config.ts`, `tailwind.config.js`, `tsconfig*.json`, `.env.example`, `package.json` |
| **coordinator** | `.claude/agents/coordinator.md` | `main` branch, PRs, `.claude/agents/*`, `CLAUDE.md` |

### Workflow (track agent)

1. Read existing code patterns before writing
2. Build → lint → verify
3. At close-out invoke `/ship`: runs `npm run lint && npm run build`, commits, pushes branch
4. The coordinator creates the PR — agents do not run `gh pr create`

### Workflow (coordinator)

1. Check branches ahead of `main`
2. For each ready branch: run `npm run lint && npm run build`, resolve conflicts
3. Create PR with conventional commit title
4. After merge: delete branch

---

## Coding Conventions

```ts
// Interface names use I-prefix
interface IListingCardProps { ... }

// Components use React.FC
const ListingCard: React.FC<IListingCardProps> = ({ listing }) => { ... };

// Handlers passed as props use useCallback
const handleSave = useCallback(() => toggleSave(listing.id), [listing.id, toggleSave]);

// Derived data uses useMemo
const nearbyListings = useMemo(() => filter(listings, filters), [listings, filters]);

export default ListingCard;
```

- No `console.log` in committed code
- No non-null assertions (`!`) without an inline comment justifying the invariant
- No `as any` without an inline comment
- Inline styles only for brand values not expressible in Tailwind (font stacks, specific hex colours)

### Craft Limits

| File type | Limit |
|-----------|-------|
| Component file | ≤ 250 lines |
| Service file | ≤ 150 lines |
| `useState` per component | ≤ 5 |
| Function body | ≤ 50 lines |

---

## PR Conventions

- **Title format:** `type(scope): subject` — conventional commits
- **Valid scopes:** `ui`, `services`, `config`, `docs`
- **Valid types:** `feat`, `fix`, `refactor`, `chore`, `docs`
- **Verification before PR:** `npm run lint && npm run build` — both must pass

---

## Dev Environment Behaviour

| `.env` state | Supabase | Map | Behaviour |
|---|---|---|---|
| Blank (default) | Disabled | Enabled | Mock data, CartoDB map |
| Supabase keys set | Enabled | Enabled | Live data, CartoDB map |

The app never requires a Maps API key. CartoDB Dark Matter tiles are free and require no authentication.

---

## Where to Write Things

| Type | Location |
|------|----------|
| App overview and methodology | `CLAUDE.md` (this file) |
| Design system tokens | `tailwind.config.js` → `nz.*` |
| Mock data | `src/constants/mockData.ts` |
| Vibe filter definitions | `src/constants/categories.ts` |
| Agent role definitions | `.claude/agents/*.md` |
| Agent closing workflow | `.claude/skills/ship/SKILL.md` |
| Permitted tool rules | `.claude/settings.json` |
