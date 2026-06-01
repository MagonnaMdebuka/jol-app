# Jol — Work Tracker

Status markers: `[x]` done · `[-]` in progress · `[ ]` not started

---

## Shipped

### Foundation

- [x] Project scaffold — Vite + React 18 + TypeScript + Tailwind
- [x] Design system — `nz-*` colour tokens, Bricolage Grotesque / JetBrains Mono / Inter
- [x] Supabase guard pattern — app never crashes without env vars
- [x] Provider stack — Toast → Auth → Listings → Saved → Routes
- [x] React Router v6 with lazy-loaded pages
- [x] Vercel deployment config (`vercel.json` catch-all rewrite)

### Database

- [x] PostgreSQL schema migration (`supabase/migrations/001_initial_schema.sql`)
- [x] Tables: profiles, venues, listings, saved_listings, listing_views, reports, orders, tickets
- [x] RPCs: `get_nearby_listings`, `increment_view_count`
- [x] RLS policies on all tables
- [x] Auto-review trigger — listing flagged after 3 reports

### Auth

- [x] Phone OTP sign-in (regular users)
- [x] Email sign-up / sign-in (venue owners)
- [x] Role selector on sign-in page (user vs owner)
- [x] `isOwner` check — DB profile + auth metadata
- [x] `AuthGuard` — protects all `/owner/*` routes
- [x] Auto-create profile on sign-up via DB trigger

### Map

- [x] CartoDB Dark Matter tile layer (no API key)
- [x] Discovery map — default view (`/`)
- [x] Event markers (orange) + food markers (apricot)
- [x] Map filters — vibe chips, radius selector
- [x] Geolocation hook — user position on map

### Listings — Explorer side

- [x] Feed page (`/feed`) — card list with vibe filter
- [x] Listing detail page (`/listing/:id`) — full info, report button
- [x] Saved listings (`/saved`) — persisted in localStorage
- [x] View count tracking (anonymous + logged-in)
- [x] Report system — auto `under_review` at 3 reports

### Search

- [x] Search page (`/search`) — query filter against Jol listings
- [x] Neighbourhood chips + trending tag shortcuts
- [x] OSM dual-layer results — Jol listings + OpenStreetMap places
- [x] Nominatim name search (KFC, Kuai, Spur, etc.)
- [x] Overpass area fallback for neighbourhood queries (Sandton, Rosebank)
- [x] Event-keyword guard — no OSM fetch for amapiano / dj / party queries
- [x] 400 ms debounce — no request on every keystroke
- [x] GPS race condition fix — `locationRef` pattern
- [x] OSM place detail BottomSheet with "Add venue to Jol" CTA

### Owner side

- [x] Owner register (`/owner/register`)
- [x] Owner login (`/owner/login`)
- [x] Owner dashboard (`/owner/dashboard`) — listing list, soft delete
- [x] Venue setup (`/owner/venue/setup`) — SA phone validation, lat/lng bounds
- [x] New listing (`/owner/listings/new`) — event + food, image upload, capacity
- [x] Edit listing (`/owner/listings/:id/edit`) — full field parity with new listing
- [x] Image uploader — Supabase Storage with blob URL mock fallback

### UI Components

- [x] Button, Input, Badge, Chip, Spinner, Toast
- [x] BottomSheet (slide-up panel)
- [x] Modal
- [x] TopNav (dark, auth-aware)
- [x] BottomNav (mobile, auth-aware, 5-tab)
- [x] OwnerShell + OwnerNav
- [x] ListingCard (3 variants: full, row, compact)
- [x] OsmCard — OSM result card

---

## Up Next

### Payments — PayFast

- [ ] Supabase Edge Function — server-side PayFast request signing
- [ ] Ticket purchase flow — select ticket type (general / VIP / ladies / gents)
- [ ] QR code generation on purchase
- [ ] Orders + tickets table integration (tables already scaffolded)
- [ ] Webhook handler — confirm payment, activate ticket
- [ ] My tickets page for users

### Owner Analytics

- [ ] Dashboard view count graph — daily views per listing
- [ ] Top-performing listing card
- [ ] Reach metric — unique sessions vs repeat views

### Moderation / Admin

- [ ] Admin panel — view flagged listings (`under_review`)
- [ ] Approve / reject / remove flagged listing
- [ ] Ban owner account

### Discovery improvements

- [ ] "Near me" sort toggle on Feed and Map
- [ ] Listing share button — native share sheet / copy link
- [ ] Event RSVP — interested count (no payment, just a tap)
- [ ] Push notifications — new event near user (PWA)

### Content & Growth

- [ ] Owner onboarding email sequence
- [ ] OSM "Add venue" flow — pre-fill register form from place data
- [ ] Featured listings — pinned to top of feed (paid placement)
- [ ] Neighbourhood landing pages — `/neighbourhood/sandton`

---

## Known Issues / Tech Debt

| Area   | Issue                                                          | Status                                             |
| ------ | -------------------------------------------------------------- | -------------------------------------------------- |
| Search | OSM results limited to 20 — no pagination                      | ✅ Fixed — Load more button added                  |
| Search | Overpass `overpass.kumi.systems` can be slow (public instance) | ✅ Mitigated — caching + server fallback           |
| Auth   | No password reset flow for owner email accounts                | ✅ Fixed — ForgotPasswordForm + ResetPassword page |
| Map    | No cluster markers when many listings overlap                  | ✅ Fixed — MarkerClusterGroup added                |
| Feed   | No infinite scroll / pagination — all listings loaded at once  | ✅ Fixed — IntersectionObserver infinite scroll    |
| Owner  | No listing preview before publishing                           | ✅ Fixed — ListingPreviewModal + Preview button    |

---

## Session Log

| Date       | Work                                                                    |
| ---------- | ----------------------------------------------------------------------- |
| 2026-06-01 | Overpass caching — 24hr localStorage cache, server fallback, 2km radius |
| 2026-06-01 | Added ListingPreviewModal — owners can preview before publishing        |
| 2026-06-01 | Updated tracker — marked 4 known issues as fixed                        |
| 2026-05-28 | OSM dual-layer search, mock data removal, GPS race condition fix        |
| Earlier    | Owner-side overhaul, auth, DB schema, map, feed, search base            |
