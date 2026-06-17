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

## Audit Quick Wins (2026-06-15) ✅

- [x] Add Open Graph and Twitter Card meta tags
- [x] Extract MonoLabel to shared component
- [x] Add ErrorBoundary component wrapping routes
- [x] Add ConfirmDialog for delete actions in Dashboard
- [x] Improve color contrast (nz-muted #b09878 → #c4a880 for WCAG AA)
- [x] Add aria-labels to icon-only buttons
- [x] Add autoComplete attributes to auth forms
- [x] Memoize all context provider values
- [x] Add loading="lazy" to below-fold images
- [x] .env.example already existed with placeholders

---

## PWA & API Fixes (2026-06-17) ✅

- [x] Add PWA manifest with Jol branding
- [x] Create proper SVG app icons (192x192, 512x512)
- [x] Fix Google Places API 400 errors (simplified types, added distance ranking)
- [x] Optimize OSM Overpass servers (removed CORS-blocked endpoints)
- [x] Fix "Listing not found" error for OSM/Google listings
- [x] Add getListingById to ListingsContext for ephemeral listing retrieval
- [x] Skip Supabase queries for OSM IDs (performance optimization)

---

## Up Next

### API & Data Strategy

- [x] Foursquare Places API integration — fetch venue data during owner setup
- [x] Foursquare service (`src/services/places.service.ts`) with search + details
- [x] Place types (`src/types/place.types.ts`) for API response typing
- [ ] Cache Foursquare response in Supabase (name, address, photos, rating)
- [ ] Fallback to Google Places if Foursquare returns no results
- [ ] Remove API dependency for explorer-side — serve only from DB cache

### Database — PostGIS Migration

- [x] Enable PostGIS extension in Supabase (`supabase/migrations/004_postgis.sql`)
- [x] Add `geog` geography(Point, 4326) column to venues and listings
- [x] Trigger to auto-sync geog from JSONB location
- [x] Update `get_nearby_listings` RPC to use `ST_DWithin` with spatial index
- [ ] Update service layer to handle PostGIS point format (optional — JSONB preserved)

### Cold Start — Data Seeding

- [x] Overpass API seeding script (`scripts/seed-osm.ts`) — bulk import Gauteng venues
- [x] Migration for OSM columns (`supabase/migrations/003_osm_columns.sql`)
- [x] Deterministic fallback images (`src/constants/fallbackImages.ts` + `src/utils/fallbackImage.ts`)
- [x] "Claim Your Venue" CTA on unclaimed listings (`ClaimVenueButton.tsx`)
- [x] Claim flow — owner links existing listing to their account
- [ ] Admin seed script — manually curate top 15-20 weekend events

### UGC Photos (Future)

- [ ] Explorer photo uploads to venues (authenticated only)
- [ ] Photo moderation queue for owners/admins

### Owner Analytics

- [ ] Dashboard view count graph — daily views per listing
- [ ] Top-performing listing card
- [ ] Reach metric — unique sessions vs repeat views

### Moderation / Admin

- [ ] Admin panel — view flagged listings (`under_review`)
- [ ] Approve / reject / remove flagged listing
- [ ] Ban owner account

### Discovery improvements

- [x] "Near me" sort toggle on Feed and Map
- [x] Listing share button — native share sheet / copy link
- [x] Event RSVP — interested count (no payment, just a tap)
- [x] Basic PWA — installability, offline caching (no push notifications yet)
- [ ] Push notifications — new event near user (PWA)

### DevOps

- [ ] CI/CD pipeline — GitHub Actions for lint, build, deploy

---

## Audit Priority Improvements (2026-06-15)

### Security (Critical)

- [ ] Verify Supabase RLS policies — ensure ownership checks on listings, venues tables
- [ ] Add input validation with Zod — validate listing/venue payloads before API calls
- [ ] Strengthen password requirements — minimum 8 chars, mixed case, numbers
- [ ] Add rate limiting on auth — exponential backoff for failed login attempts
- [ ] Restrict file uploads — validate file type/size, consider virus scanning
- [ ] Move sensitive API keys to edge functions — Google/Foursquare keys exposed in bundle

### Code Quality (High)

- [ ] Add test coverage — Vitest for services, Testing Library for components, Playwright for E2E
- [ ] Extract large components — Search.tsx (494 lines), DiscoveryMap.tsx (390 lines), NewListing.tsx (604 lines)
- [ ] Create shared distance utility — Haversine formula duplicated in osm.service, places.service, Search.tsx
- [ ] Split osm.service.ts (566 lines) — separate into osm-api.ts, osm-cache.ts, osm-parser.ts

### UI/UX (Medium)

- [ ] Add skeleton loaders — replace full-page spinners with content-shaped placeholders
- [ ] Add React.memo to ListingCard — prevent re-renders on parent state changes
- [ ] Improve BottomSheet gestures — use spring physics or gesture library
- [ ] Add breadcrumbs to owner pages — improve navigation context
- [ ] Add list virtualization — use react-virtual for 100+ item lists
- [ ] Add network error states — distinct from empty states with retry button

### Performance (Medium)

- [ ] Add bundle analyzer — vite-bundle-visualizer to identify large dependencies
- [ ] Dynamic import Leaflet — only load map library on map pages
- [ ] Implement service worker — PWA offline support with Workbox
- [ ] Add request deduplication — SWR or React Query for data fetching

---

## Audit Long-Term Improvements

### Testing Infrastructure

- [ ] Set up Vitest configuration
- [ ] Add unit tests for all service functions
- [ ] Add component tests with Testing Library
- [ ] Add E2E tests for critical flows (auth, listing creation, search)
- [ ] Set up test coverage reporting

### Accessibility (WCAG 2.1 AA)

- [ ] Professional accessibility audit
- [ ] Add skip links ("Skip to content")
- [ ] Ensure full keyboard navigation
- [ ] Add focus management on route changes
- [ ] Support prefers-reduced-motion

### Monitoring & Observability

- [ ] Integrate error tracking (Sentry or similar)
- [ ] Add performance monitoring
- [ ] Set up analytics infrastructure
- [ ] Implement funnel analysis for conversion tracking

### Design System

- [ ] Create Storybook for component documentation
- [ ] Document all design tokens
- [ ] Add component usage guidelines
- [ ] Create visual regression tests

### Future Architecture

- [ ] Consider Zustand/TanStack Query for complex state
- [ ] Prepare for internationalization (i18n)
- [ ] Plan API layer abstraction with centralized caching

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

## Future / Paused

### Payments — PayFast (paused until discovery validated)

- [ ] Supabase Edge Function — server-side PayFast request signing
- [ ] Ticket purchase flow — select ticket type (general / VIP / ladies / gents)
- [ ] QR code generation on purchase
- [ ] Orders + tickets table integration (tables already scaffolded)
- [ ] Webhook handler — confirm payment, activate ticket
- [ ] My tickets page for users
- [ ] QR scanner in owner dashboard for door validation

---

## Session Log

| Date       | Work                                                                                            |
| ---------- | ----------------------------------------------------------------------------------------------- |
| 2026-06-15 | Comprehensive app audit (UI/UX, Security, Code Quality, Performance), implemented 10 quick wins |
| 2026-06-10 | Foursquare API integration, PostGIS migration, OSM seeding script, fallback images, Claim Venue |
| 2026-06-08 | Discovery improvements — sort toggle, native share, RSVP, basic PWA                             |
| 2026-06-01 | Overpass caching — 24hr localStorage cache, server fallback, 2km radius                         |
| 2026-06-01 | Added ListingPreviewModal — owners can preview before publishing                                |
| 2026-06-01 | Updated tracker — marked 4 known issues as fixed                                                |
| 2026-05-28 | OSM dual-layer search, mock data removal, GPS race condition fix                                |
| Earlier    | Owner-side overhaul, auth, DB schema, map, feed, search base                                    |
