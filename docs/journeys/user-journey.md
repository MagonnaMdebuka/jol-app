# Jol — Regular User Journey
**Version:** 1.0
**Date:** 27/05/2026
**Scope:** Anonymous browsing → Sign-up → Discovery → Save → Ticket Purchase → Notifications

---

## User Persona

**Name:** Thabo, 24
**Context:** Young professional in Johannesburg. Wants to know what's happening this weekend — events, clubs, food spots. Discovers Jol via a friend's Instagram story or Google search.
**Goals:** Find something to do tonight, save options for later, eventually buy tickets without leaving the app.
**Device:** Primarily mobile (Chrome on Android), occasionally desktop.

---

## Journey Overview

| Phase | Stage | Auth Required |
|---|---|---|
| 1 | First Visit — Anonymous Discovery | No |
| 2 | View Listing Detail | No |
| 3 | Sign Up via Phone OTP | — |
| 4 | Authenticated Discovery | Yes |
| 5 | Save a Listing | Yes |
| 6 | Search | No (save requires auth) |
| 7 | Saved Listings Feed | Yes |
| 8 | Ticket Purchase (PayFast) | Yes |
| 9 | Email Notification — Listing Update | Yes |
| 10 | Sign Out / Return Visit | Yes |

---

## Phase 1 — First Visit: Anonymous Discovery

**Entry points:** Direct URL, Google search, social media link, shared listing link.

### Journey Steps

| Step | User Action | System Response |
|---|---|---|
| 1.1 | Opens `jol.app` | Loads DiscoveryMap (`/`). CartoDB Voyager map fills screen, centred on Gauteng. |
| 1.2 | Sees orange and apricot dots on the map | Orange = events · Apricot = food spots. Tooltip appears on hover showing listing title. |
| 1.3 | Taps/clicks a dot | BottomSheet slides up from bottom showing listing peek card: thumbnail, badge, distance, title, when_chip. |
| 1.4 | Swipes up on BottomSheet | Sheet expands to full height showing full listing preview. |
| 1.5 | Taps the vibe filter rail at the bottom | Filters by vibe (Tonight / Weekend / Eat / Go out / Chill / Date night / Free). Map markers update instantly. |
| 1.6 | Taps the heart icon on a listing peek card | Prompted: "Sign in to save listings." Redirected to sign-up/login. |
| 1.7 | Taps "View full details" | Navigates to `/listing/:id` — full detail page. No auth required to view. |
| 1.8 | Navigates to `/feed` via TopNav | Card-based feed view. FeaturedCard at top, TileCard horizontal scroll rows below. |

**System notes:**
- `listing_views` row is written for every detail page visit, with `session_id` (browser UUID from localStorage) and `source = 'map'` or `'feed'`.
- Anonymous `session_id` is generated once and persisted in localStorage under key `jol-session`.
- View count increments via `increment_view_count` RPC on each detail page load.

---

## Phase 2 — View Listing Detail (Anonymous)

**Route:** `/listing/:id`

### Journey Steps

| Step | User Action | System Response |
|---|---|---|
| 2.1 | Arrives on listing detail page | Hero image, TypeMark badge, title, venue name, when_chip, distance displayed. |
| 2.2 | Scrolls down | Sees full description, event details (entry fee, dress code, artist, age restriction) or food details (cuisine, hours, price range, specials). |
| 2.3 | Taps heart / save button | If not logged in: soft prompt appears — "Sign in to save this spot." |
| 2.4 | Taps "Report listing" | If not logged in: redirected to sign-in. If logged in: ReportButton modal opens. |
| 2.5 | Taps venue name | (Future) Navigate to venue profile page. |
| 2.6 | Taps "Buy tickets" (if capacity set) | Redirected to sign-in if not authenticated, else proceeds to Phase 8. |

---

## Phase 3 — Sign Up via Phone OTP

**Route:** `/sign-up` (to be created) or modal overlay
**Method:** Phone number → SMS OTP (Supabase Auth, PhoneOTPForm.tsx already exists)

### Journey Steps

| Step | User Action | System Response |
|---|---|---|
| 3.1 | Taps "Sign in" or any auth-gated action | Sign-up/login screen appears. |
| 3.2 | Enters South African mobile number (e.g. 082 555 0100) | Number formatted to E.164 (`+27825550100`). |
| 3.3 | Taps "Send OTP" | Supabase Auth sends 6-digit OTP via SMS. Button shows "Resend in 60s" countdown. |
| 3.4 | Enters 6-digit OTP | Supabase verifies OTP. |
| 3.5 | First-time user | Supabase creates `auth.users` row → `handle_new_user` trigger creates `profiles` row with `role = 'user'`. |
| 3.6 | Returning user | Session restored. Saved listings re-synced from `saved_listings` table. |
| 3.7 | Redirected back | Returns to the page or action that triggered sign-in. |

**Error flows:**
- Wrong OTP → "Incorrect code. Please try again." (up to 3 attempts).
- Expired OTP (>10 min) → "Code expired. Tap Resend."
- Network error → "Could not send SMS. Check your number and try again."

---

## Phase 4 — Authenticated Discovery

Everything from Phase 1, plus:

| Step | User Action | System Response |
|---|---|---|
| 4.1 | Browses map | `listing_views` now written with `user_id` alongside `session_id`. Prior anonymous session views can be back-linked. |
| 4.2 | Sees personalised "For You" section (future) | Based on view history and saved vibes. |
| 4.3 | TopNav shows avatar / profile icon | Indicates logged-in state. |

---

## Phase 5 — Save a Listing

**Persistence:** `saved_listings` table (syncs across devices). Falls back to localStorage when Supabase is not configured.

### Journey Steps

| Step | User Action | System Response |
|---|---|---|
| 5.1 | Taps heart icon on any listing card or detail page | Heart fills orange (`nz-accent`). |
| 5.2 | System writes `saved_listings` row (user_id + listing_id) | `listings.save_count` auto-increments via `sync_save_count` trigger. |
| 5.3 | Taps heart again (unsave) | Heart reverts to outline. Row deleted from `saved_listings`. `save_count` decrements. |
| 5.4 | Navigates to `/saved` | Sees all saved listings as RowCards, sorted by save date descending. |
| 5.5 | Opens saved listing on a different device | Saved state is in sync — heart is filled on the new device. |

---

## Phase 6 — Search

**Route:** `/search`

### Journey Steps

| Step | User Action | System Response |
|---|---|---|
| 6.1 | Navigates to Search via TopNav | Search input is focused. Neighbourhood chips displayed below. |
| 6.2 | Types venue name, event name, or area | Results filter in real time against title, venue_name, address, tags, cuisine_type. |
| 6.3 | Taps a neighbourhood chip (e.g. Sandton, Soweto, Rosebank) | Filters listings by address area. |
| 6.4 | Selects a result | Navigates to `/listing/:id`. `listing_views` written with `source = 'search'`. |

---

## Phase 7 — Saved Listings Feed

**Route:** `/saved`

### Journey Steps

| Step | User Action | System Response |
|---|---|---|
| 7.1 | Opens `/saved` | RowCards of all saved listings. Empty state if none saved. |
| 7.2 | Taps a listing | Navigates to detail page. |
| 7.3 | Unsaves from detail page | Listing disappears from `/saved` feed. |
| 7.4 | Saved listing has been updated by owner | Listing shows updated details. If key details changed, user receives email (Phase 9). |

---

## Phase 8 — Ticket Purchase (PayFast)

**Status:** Future feature — fully documented here for implementation planning.
**Auth required:** Yes — user must be logged in.
**Prerequisite:** Listing has `capacity > 0` and `type = 'event'`.

### Journey Steps

| Step | User Action | System Response |
|---|---|---|
| 8.1 | On listing detail, taps "Buy Tickets" button | Ticket selection modal opens. |
| 8.2 | Sees ticket types: General / VIP / Ladies / Gents with prices | Pulled from a future `ticket_prices` config on the listing. |
| 8.3 | Selects ticket type and quantity (e.g. 2 × General @ R100) | Running total updates: "R200 total". |
| 8.4 | Taps "Proceed to Payment" | App calls Supabase Edge Function: `POST /functions/v1/create-order`. |
| 8.5 | Edge Function creates `orders` row (status = 'pending') | Returns a signed PayFast payload with `merchant_reference` = order ID. |
| 8.6 | Browser POSTs to PayFast payment page | User is on PayFast's hosted page. Sees order summary and payment options. |
| 8.7 | User pays via card / EFT / SnapScan | PayFast processes payment. |
| 8.8 | PayFast sends ITN webhook to Supabase Edge Function | Edge Function verifies PayFast signature, confirms `payment_status = COMPLETE`. |
| 8.9 | Edge Function updates `orders.status = 'complete'`, creates `tickets` rows, generates QR code per ticket | QR code = signed JWT containing `{ ticket_id, listing_id, user_id }`. |
| 8.10 | User redirected back to Jol success page | "Your tickets are confirmed! Check your email." |
| 8.11 | User receives email with QR code(s) | One QR code image per ticket. Venue name, date, ticket type shown. |
| 8.12 | At the venue, user opens email / Jol app and shows QR code | Venue owner scans QR (future scanner in owner dashboard). Ticket status → `used`. |

**Error flows:**
- Payment cancelled → `orders.status = 'cancelled'`. User returned to listing with "Payment cancelled" toast.
- Payment failed → `orders.status = 'failed'`. User returned with "Payment failed — try again."
- Capacity sold out between selection and payment → Edge Function rejects, returns "Sold out" error before PayFast redirect.

**Security notes:**
- PayFast merchant key **never** leaves the Supabase Edge Function — it is a server-side secret.
- PayFast signature is verified on every ITN webhook before any order is confirmed.
- QR codes are signed JWTs — cannot be forged.

---

## Phase 9 — Email Notification: Listing Update

**Trigger:** Venue owner edits a listing that one or more users have saved.
**Transport:** Supabase Edge Function → email provider (e.g. Resend or SendGrid).

### Journey Steps

| Step | User Action | System Response |
|---|---|---|
| 9.1 | Owner updates a listing (time, cancellation, fee change) | `listings` row updated. `updated_at` stamped. |
| 9.2 | — | Edge Function detects significant field changes (event_date, entry_fee, status). Queries `saved_listings` for all `user_id` values linked to this listing. |
| 9.3 | — | Fetches each user's email from `auth.users`. Sends one email per user. |
| 9.4 | User receives email | Subject: "Update: [Listing Title] has changed". Body: what changed, link to listing, "Remove from saved" link. |
| 9.5 | User clicks listing link | Opens `/listing/:id` with updated details. |
| 9.6 | User clicks "Remove from saved" link | One-click unsubscribe — deletes `saved_listings` row without requiring login. |

**Fields that trigger an email:**
- `event_date` (time changed)
- `event_end_date`
- `entry_fee` (price changed)
- `status` changed to `inactive` (event cancelled)
- `artist` (headliner changed)

**Fields that do NOT trigger an email:**
- `description`, `images`, `when_chip`, `vibe`, `dress_code`

---

## Phase 10 — Sign Out / Return Visit

| Step | User Action | System Response |
|---|---|---|
| 10.1 | Taps profile icon → Sign out | Supabase session cleared. Returns to anonymous state. Saved listings revert to localStorage fallback. |
| 10.2 | Returns to app later | TopNav shows "Sign in". Map and feed load normally via mock/live data. |
| 10.3 | Signs in again | Session restored. `saved_listings` from DB re-synced. |

---

## Use Cases — Regular User

---

### UC-U01: Browse the Discovery Map (Anonymous)

| Field | Detail |
|---|---|
| **ID** | UC-U01 |
| **Actor** | Anonymous visitor |
| **Goal** | Discover events and food spots near Johannesburg |
| **Preconditions** | User has internet access and opens Jol |
| **Trigger** | User lands on `/` |

**Main Success Scenario:**
1. Map loads centred on Gauteng with event (orange) and food (apricot) markers.
2. User taps a marker.
3. BottomSheet slides up with listing peek card.
4. User swipes up to expand or taps "View full details."
5. User navigates to listing detail page.
6. `listing_views` row written with `session_id` and `source = 'map'`.

**Alternate Flow A — No location permission:**
- Map defaults to Gauteng centre. Radius filter is still available.

**Alternate Flow B — No listings in current radius:**
- Map shows empty state: "No spots in this area. Try expanding your radius."

**Postconditions:** View count incremented on listing. `listing_views` row created.

---

### UC-U02: Sign Up with Phone OTP

| Field | Detail |
|---|---|
| **ID** | UC-U02 |
| **Actor** | New user |
| **Goal** | Create a Jol account |
| **Preconditions** | User has a South African mobile number |
| **Trigger** | User taps any auth-gated action (save, buy ticket) |

**Main Success Scenario:**
1. Sign-up screen displayed.
2. User enters mobile number.
3. Taps "Send OTP."
4. Receives 6-digit SMS.
5. Enters OTP.
6. Supabase creates `auth.users` row.
7. `handle_new_user` trigger creates `profiles` row (`role = 'user'`).
8. User returned to the action that triggered sign-in.

**Alternate Flow A — Wrong OTP:**
- Error shown. User can retry up to 3 times or request resend.

**Alternate Flow A — Existing user:**
- Supabase matches the number, restores session. No new profile created.

**Postconditions:** Authenticated session active. Profile exists in `profiles` table.

---

### UC-U03: Save a Listing

| Field | Detail |
|---|---|
| **ID** | UC-U03 |
| **Actor** | Authenticated user |
| **Goal** | Save a listing to review or attend later |
| **Preconditions** | User is signed in |
| **Trigger** | User taps the heart icon on any listing card or detail page |

**Main Success Scenario:**
1. User taps heart.
2. Heart fills orange.
3. `saved_listings` row inserted (user_id, listing_id).
4. `listings.save_count` incremented via trigger.
5. Listing appears in `/saved` feed.

**Alternate Flow A — Already saved (unsave):**
1. User taps filled heart.
2. Heart reverts to outline.
3. `saved_listings` row deleted. `save_count` decremented.

**Alternate Flow B — Network error:**
- Optimistic UI update shown. Background retry. If retry fails, heart reverts and toast shown: "Couldn't save. Try again."

**Postconditions:** `saved_listings` table reflects new state. `save_count` accurate.

---

### UC-U04: Purchase a Ticket

| Field | Detail |
|---|---|
| **ID** | UC-U04 |
| **Actor** | Authenticated user |
| **Goal** | Buy entry to a ticketed event |
| **Preconditions** | User is signed in. Listing has `capacity > 0`. Tickets available. |
| **Trigger** | User taps "Buy Tickets" on listing detail page |

**Main Success Scenario:**
1. Ticket selection modal opens.
2. User selects ticket type and quantity.
3. Taps "Proceed to Payment."
4. Supabase Edge Function creates `orders` row (pending), returns PayFast payload.
5. Browser posts to PayFast hosted payment page.
6. User completes payment.
7. PayFast ITN webhook received by Edge Function.
8. Signature verified. `orders.status = 'complete'`. `tickets` rows created. QR codes generated.
9. User redirected to success page.
10. Confirmation email with QR code(s) sent.

**Alternate Flow A — Sold out during selection:**
- Edge Function returns "Sold out" error. User sees "Sorry, this event is now sold out."

**Alternate Flow B — Payment cancelled:**
- PayFast returns `payment_status = CANCELLED`. `orders.status = 'cancelled'`. User returned to listing.

**Alternate Flow C — Payment failed:**
- `orders.status = 'failed'`. User sees "Payment failed. Please try again."

**Postconditions:** `orders` row complete. `tickets` rows active. User holds valid QR-coded tickets.

---

### UC-U05: Receive a Listing Update Email

| Field | Detail |
|---|---|
| **ID** | UC-U05 |
| **Actor** | Authenticated user (saved the listing) |
| **Goal** | Be informed when a saved event changes |
| **Preconditions** | User has saved a listing. Owner has edited that listing. |
| **Trigger** | Significant field on a listing is updated by the owner |

**Main Success Scenario:**
1. Owner updates listing (e.g. entry fee increased, time changed).
2. Edge Function detects change in watched fields.
3. Queries `saved_listings` for all affected `user_id` values.
4. Sends one email per user with what changed and a link to the listing.
5. User opens email, reads the update.
6. User clicks listing link to view updated detail page.

**Alternate Flow A — Owner cancels the event:**
- `status` → `inactive`. Email subject: "[Event name] has been cancelled." Body: "This event will no longer take place."

**Alternate Flow B — User unsubscribes:**
- One-click "Remove from saved" link in email deletes `saved_listings` row.

**Postconditions:** User is informed. No further emails for this listing unless re-saved.
