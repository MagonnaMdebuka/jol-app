# Jol — Venue Owner Journey
**Version:** 1.0
**Date:** 27/05/2026
**Scope:** Registration → Venue Setup → Listing Management → Dashboard Analytics → Image Upload

---

## Owner Persona

**Name:** Lerato, 33
**Context:** Owner and events coordinator at a club in Sandton. Posts 2–4 events per month. Needs a fast way to get listings live, update details when things change, and see how many people are viewing each event.
**Goals:** Get events in front of the right Joburg crowd, manage listings without calling a developer, see what's working.
**Device:** Desktop (Chrome) for setup and management. Mobile for quick edits.

---

## Journey Overview

| Phase | Stage | Auth Required |
|---|---|---|
| 1 | Owner Registration | No → becomes Yes |
| 2 | Venue Setup | Yes |
| 3 | Create a Listing (Event) | Yes |
| 4 | Create a Listing (Food / Restaurant) | Yes |
| 5 | Edit an Existing Listing | Yes |
| 6 | Manage Listing Status | Yes |
| 7 | Dashboard & Analytics | Yes |
| 8 | Upload Images | Yes |
| 9 | Handle a Reported Listing | Yes |
| 10 | Sign Out / Return | Yes |

---

## Phase 1 — Owner Registration

**Route:** `/owner/register`
**Model:** Self-register, instant access — no manual approval required.
**Auth method:** Email + password (via Supabase Auth, `EmailAuthForm.tsx` already exists).

### Journey Steps

| Step | User Action | System Response |
|---|---|---|
| 1.1 | Navigates to `/owner/register` via TopNav "Owner portal" link | Registration form displayed: Display Name, Email, Password. |
| 1.2 | Fills in display name, email, password | Client-side validation: password ≥ 8 characters, valid email format. |
| 1.3 | Taps "Create owner account" | Supabase Auth creates `auth.users` row. `handle_new_user` trigger fires. |
| 1.4 | Trigger creates `profiles` row with `role = 'owner'` | Owner is immediately authenticated. |
| 1.5 | Redirected to `/owner/venue/setup` | Prompted to set up their first venue. |

**Why role = 'owner' on register?**
The registration page at `/owner/register` explicitly sets `role: 'owner'` in `raw_user_meta_data` when calling `supabase.auth.signUp()`. The `handle_new_user` trigger reads this and sets the profile role accordingly.

**Error flows:**
- Email already registered → "An account with this email exists. Sign in instead."
- Weak password → "Password must be at least 8 characters."

---

## Phase 2 — Venue Setup

**Route:** `/owner/venue/setup`
**Auth:** Required (AuthGuard + OwnerShell)
**Purpose:** Create the venue profile that all listings are linked to. One owner can have multiple venues.

### Journey Steps

| Step | User Action | System Response |
|---|---|---|
| 2.1 | Arrives on VenueSetup page | Form displayed: Venue Name, Type, Address, Phone, Description, Cover Photo, Social Links. |
| 2.2 | Selects venue type from dropdown | Options: Club, Tavern, Shebeen, Restaurant, Bar, Food Market, Other. |
| 2.3 | Types address | (Future) Address autocomplete using Google Places or OpenStreetMap Nominatim. Location `{lat, lng}` resolved from address string. |
| 2.4 | Uploads cover photo | ImageUploader component opens. File selected, uploaded to Supabase Storage bucket `venue-images`. URL stored as `cover_photo`. |
| 2.5 | Optionally adds website, Instagram, Facebook | Plain text URLs stored on venue record. |
| 2.6 | Taps "Save Venue" | `createVenue()` called → `venues` row inserted. `status = 'active'` by default. |
| 2.7 | Success toast shown | "Venue created! Now add your first listing." Redirected to `/owner/listings/new`. |

**Notes:**
- A venue must exist before any listing can be created (listings have a `venue_id` FK).
- If owner already has a venue, `/owner/dashboard` shows a "Add another venue" card.

---

## Phase 3 — Create a Listing (Event)

**Route:** `/owner/listings/new`
**Auth:** Required

### Journey Steps

| Step | User Action | System Response |
|---|---|---|
| 3.1 | Arrives on NewListing page | Tabs or toggle: "Event" / "Food". Defaults to Event. |
| 3.2 | Selects venue from dropdown | Lists all venues owned by this user. |
| 3.3 | Fills in Title | e.g. "Amapiano Fridays at Konka" |
| 3.4 | Adds description | Rich text or plain text area. |
| 3.5 | Sets event date and time | Date picker: event_date (start) and event_end_date (end). |
| 3.6 | Fills event-specific fields | Entry Fee (text, e.g. "R150 ladies / R200 gents"), Dress Code (dropdown), Artist/DJ name, Age Restriction (text). |
| 3.7 | Sets capacity (optional) | If set, "Buy Tickets" button is shown on the listing. |
| 3.8 | Selects vibe tags | Multi-select chips: Hype, Chill, Date night, Dancefloor, VIP, Sundowner, etc. |
| 3.9 | Uploads listing images | ImageUploader. Up to 5 images. Uploaded to `listing-images` Supabase Storage bucket. URLs stored in `images[]`. |
| 3.10 | Taps "Publish Listing" | `createListing()` called. `listings` row inserted with `status = 'active'`. |
| 3.11 | Listing appears on the map and feeds immediately | Other users can discover it straight away. |

**Error flows:**
- Missing required fields (title, date, venue) → inline validation errors highlighted.
- Image upload fails → "Image upload failed. Try again." File input remains open.

---

## Phase 4 — Create a Listing (Food / Restaurant)

**Route:** `/owner/listings/new` (Food tab selected)
**Auth:** Required

### Journey Steps

| Step | User Action | System Response |
|---|---|---|
| 4.1 | Selects "Food" tab on NewListing page | Event-specific fields hidden. Food-specific fields shown. |
| 4.2 | Selects venue | Same as event flow. |
| 4.3 | Fills in Title | e.g. "Marble — Rooftop Braai & Cocktails" |
| 4.4 | Adds description | |
| 4.5 | Fills food-specific fields | Cuisine Type (text), Opening Hours (text, e.g. "Mon–Sun 12:00–22:00"), Price Range (R / RR / RRR / RRRR), Special (text, e.g. "Lunch special R75 weekdays"). |
| 4.6 | Selects vibe tags | Date night, Fine dining, Chill, Family friendly, etc. |
| 4.7 | Uploads listing images | Same ImageUploader flow. |
| 4.8 | Taps "Publish Listing" | `listings` row inserted with `type = 'food'`, `status = 'active'`. |
| 4.9 | Food listing appears on map with apricot marker | Visible to all users immediately. |

---

## Phase 5 — Edit an Existing Listing

**Route:** `/owner/listings/:id/edit`
**Auth:** Required. RLS enforces `owner_id = auth.uid()`.

### Journey Steps

| Step | User Action | System Response |
|---|---|---|
| 5.1 | On Dashboard, taps "Edit" on a listing card | Navigates to `/owner/listings/:id/edit`. |
| 5.2 | Form pre-populated with current values | All fields editable. |
| 5.3 | Changes a field (e.g. entry fee, event time) | Client-side change tracked. |
| 5.4 | Taps "Save Changes" | `updateListing()` called. `updated_at` stamped by trigger. |
| 5.5 | Success toast shown | "Listing updated." |
| 5.6 | If significant fields changed | Edge Function queues emails to all users who saved this listing (Phase 9 in user journey). |

**Significant fields that trigger user notification emails:**
- `event_date`, `event_end_date`, `entry_fee`, `status → inactive` (cancellation), `artist`

---

## Phase 6 — Manage Listing Status

**Route:** `/owner/dashboard` or `/owner/listings/:id/edit`
**Auth:** Required

### Journey Steps

| Step | User Action | System Response |
|---|---|---|
| 6.1 | Owner wants to temporarily hide a listing | Taps "Deactivate" on dashboard listing card. |
| 6.2 | Confirms action | `listings.status → 'inactive'`. Listing disappears from public map and feed. |
| 6.3 | Owner reactivates listing | Taps "Activate." `status → 'active'`. Listing reappears instantly. |
| 6.4 | Owner wants to permanently remove | Taps "Delete." Confirmation dialog shown. |
| 6.5 | Confirms delete | `softDeleteListing()` called → `status → 'inactive'`. Data retained. |

**Status meanings:**
| Status | Visible to public | Editable by owner |
|---|---|---|
| `active` | Yes | Yes |
| `under_review` | Yes (flagged) | Yes |
| `inactive` | No | Yes |
| `deleted` | No | No |

---

## Phase 7 — Dashboard & Analytics

**Route:** `/owner/dashboard`
**Auth:** Required

### Journey Steps

| Step | User Action | System Response |
|---|---|---|
| 7.1 | Navigates to `/owner/dashboard` | Shows summary cards + list of all listings for this owner. |
| 7.2 | Sees listing cards with key stats | Each card shows: listing title, type badge, status, `view_count`, `save_count`, event_date or hours. |
| 7.3 | Taps a listing card | Expands or navigates to detail / edit. |
| 7.4 | Sees venue section | Lists all venues with "Edit venue" and "Add listing" actions per venue. |
| 7.5 | (Future) Views analytics panel | View count over time, saves per day, source breakdown (map / feed / search). Data from `listing_views` table. |

**Analytics data available from DB:**
- Total views (`listings.view_count`)
- Total saves (`listings.save_count`)
- Views by source (`listing_views.source`)
- Views by day (`listing_views.viewed_at`)
- Anonymous vs authenticated views (`listing_views.user_id IS NULL`)
- Unique sessions (`COUNT(DISTINCT session_id)`)

---

## Phase 8 — Upload Images

**Component:** `ImageUploader.tsx` (already exists)
**Storage:** Supabase Storage — two buckets: `venue-images`, `listing-images`

### Journey Steps

| Step | User Action | System Response |
|---|---|---|
| 8.1 | Taps image upload area | File picker opens. Accepts: JPG, PNG, WEBP. Max size: 5MB per image. |
| 8.2 | Selects one or more files | Files shown as thumbnails with a remove (×) button. |
| 8.3 | Taps "Upload" or on form submit | `storage.service.ts` uploads each file to Supabase Storage. |
| 8.4 | Upload in progress | Progress indicator shown per image. |
| 8.5 | Upload complete | Public URL returned and stored in `images[]` (listing) or `cover_photo` (venue). |
| 8.6 | Images appear in listing on public feeds | Immediately visible to users. |

**Error flows:**
- File too large → "Image must be under 5MB."
- Unsupported format → "Only JPG, PNG, and WEBP are supported."
- Storage error (Supabase not configured) → Falls back to blob URL preview (mock mode only).

**Storage bucket configuration (run in Supabase Dashboard):**
```
venue-images   — public read, authenticated write
listing-images — public read, authenticated write
avatars        — public read, authenticated write
```

---

## Phase 9 — Handle a Reported Listing

**Route:** `/owner/dashboard` (notification area, future)
**Trigger:** 3 or more users have reported a listing via the ReportButton → `auto_review_listing` trigger sets `status = 'under_review'`.

### Journey Steps

| Step | User Action | System Response |
|---|---|---|
| 9.1 | 3 users report a listing | `auto_review_listing` trigger fires. `listings.status → 'under_review'`. |
| 9.2 | (Future) Owner receives email | "One of your listings has been flagged for review." |
| 9.3 | Owner logs in to dashboard | Listing card shows "Under Review" badge. Listing is still visible to public. |
| 9.4 | Owner reviews the reports | Can view report reasons on dashboard (future admin panel shows details). |
| 9.5 | Owner corrects the listing | Updates incorrect information. Taps "Request re-review." |
| 9.6 | (Future) Admin reviews and clears | Reports marked `reviewed`. `status → 'active'`. |
| 9.7 | If listing is a breach | Admin sets `status → 'inactive'`. Owner notified. |

**Report reasons users can select:**
- Fake event
- Wrong info
- Inappropriate content
- Other

---

## Phase 10 — Sign Out / Return Visit

| Step | User Action | System Response |
|---|---|---|
| 10.1 | Taps "Sign Out" in OwnerNav | `signOut()` called. Session cleared. Redirected to `/owner/login`. |
| 10.2 | Returns to app the next day | `/owner/login` form shown. |
| 10.3 | Signs in with email + password | Session restored. Redirected to `/owner/dashboard`. All venues and listings present. |

---

## Use Cases — Venue Owner

---

### UC-O01: Register as a Venue Owner

| Field | Detail |
|---|---|
| **ID** | UC-O01 |
| **Actor** | New venue owner |
| **Goal** | Create an owner account to manage venue listings |
| **Preconditions** | Owner has a valid email address |
| **Trigger** | Owner navigates to `/owner/register` |

**Main Success Scenario:**
1. Owner fills in display name, email, and password.
2. Taps "Create owner account."
3. Supabase creates `auth.users` row.
4. `handle_new_user` trigger creates `profiles` row with `role = 'owner'`.
5. Owner authenticated and redirected to `/owner/venue/setup`.

**Alternate Flow A — Email already exists:**
- "An account with this email already exists. Sign in instead."

**Postconditions:** Owner account active. `profiles.role = 'owner'`. Ready to create a venue.

---

### UC-O02: Create a Venue

| Field | Detail |
|---|---|
| **ID** | UC-O02 |
| **Actor** | Authenticated venue owner |
| **Goal** | Set up a venue profile so listings can be linked to it |
| **Preconditions** | Owner is signed in |
| **Trigger** | Owner arrives at `/owner/venue/setup` after registration, or taps "Add Venue" on dashboard |

**Main Success Scenario:**
1. Owner fills in venue name, type, address, phone, description.
2. Uploads cover photo (Supabase Storage `venue-images`).
3. Taps "Save Venue."
4. `venues` row inserted. `owner_id = auth.uid()`. `status = 'active'`.
5. Redirected to `/owner/listings/new` with success toast.

**Alternate Flow A — Address not found:**
- Location defaults to Gauteng centre. Owner prompted to drag a pin (future map picker) or enter coordinates manually.

**Postconditions:** `venues` row exists. Owner can now create listings.

---

### UC-O03: Publish an Event Listing

| Field | Detail |
|---|---|
| **ID** | UC-O03 |
| **Actor** | Authenticated venue owner |
| **Goal** | Post an event so users can discover it on the map and feed |
| **Preconditions** | Owner has at least one venue set up |
| **Trigger** | Owner taps "New Listing" in OwnerNav |

**Main Success Scenario:**
1. Owner selects "Event" type.
2. Selects venue, fills title, description, event date/time, entry fee, dress code, artist, age restriction.
3. Sets capacity (optional — enables ticket purchasing).
4. Adds vibe tags.
5. Uploads listing images.
6. Taps "Publish Listing."
7. `listings` row inserted. `status = 'active'`.
8. Listing appears on map (orange marker) and in user feeds immediately.

**Alternate Flow A — Missing required fields:**
- Validation errors shown inline. Form not submitted.

**Alternate Flow B — Image upload fails:**
- Listing saved without image. Toast: "Listing published — image upload failed. Add images from Edit."

**Postconditions:** `listings` row active. Visible on map and feeds. `view_count = 0`, `save_count = 0`.

---

### UC-O04: Edit a Listing

| Field | Detail |
|---|---|
| **ID** | UC-O04 |
| **Actor** | Authenticated venue owner (owner of the listing) |
| **Goal** | Update listing details when something changes |
| **Preconditions** | Listing exists and `owner_id = auth.uid()` |
| **Trigger** | Owner taps "Edit" on a dashboard listing card |

**Main Success Scenario:**
1. Owner navigates to `/owner/listings/:id/edit`.
2. Form pre-populated. Owner changes relevant fields.
3. Taps "Save Changes."
4. `updateListing()` called. `updated_at` stamped.
5. If significant fields changed → Edge Function sends update emails to users who saved this listing.
6. Success toast: "Listing updated."

**Alternate Flow A — Owner edits another owner's listing (RLS block):**
- Supabase RLS returns 403. App shows "You do not have permission to edit this listing."

**Postconditions:** Listing updated in DB. Affected saved users notified by email.

---

### UC-O05: View Dashboard Analytics

| Field | Detail |
|---|---|
| **ID** | UC-O05 |
| **Actor** | Authenticated venue owner |
| **Goal** | Understand how listings are performing |
| **Preconditions** | Owner has at least one listing |
| **Trigger** | Owner navigates to `/owner/dashboard` |

**Main Success Scenario:**
1. Dashboard loads all listings for `auth.uid()`.
2. Each listing card shows `view_count` and `save_count`.
3. (Future) Owner taps a listing to open analytics panel.
4. Panel shows: views by day (line chart), source breakdown (map/feed/search), save rate (saves ÷ views × 100).

**Postconditions:** Owner has visibility into listing performance.

---

### UC-O06: Deactivate / Cancel a Listing

| Field | Detail |
|---|---|
| **ID** | UC-O06 |
| **Actor** | Authenticated venue owner |
| **Goal** | Remove a listing from public view (event cancelled or venue closed) |
| **Preconditions** | Owner is signed in. Listing is active. |
| **Trigger** | Owner taps "Deactivate" or "Cancel event" on dashboard |

**Main Success Scenario:**
1. Owner taps "Deactivate" on listing card.
2. Confirmation dialog: "This will hide the listing from public view. Continue?"
3. Owner confirms.
4. `listings.status → 'inactive'`.
5. Listing removed from map, feed, and search immediately.
6. If status → `inactive` and listing had saved users → cancellation email sent.
7. Toast: "Listing deactivated."

**Alternate Flow A — Reactivate:**
1. Owner taps "Activate" on an inactive listing.
2. `status → 'active'`. Listing reappears on map and feeds.

**Postconditions:** Listing status updated. Saved users notified if event cancelled.

---

### UC-O07: Upload Images to a Listing

| Field | Detail |
|---|---|
| **ID** | UC-O07 |
| **Actor** | Authenticated venue owner |
| **Goal** | Add or replace images on a listing to attract more users |
| **Preconditions** | Owner is on NewListing or EditListing page |
| **Trigger** | Owner taps the image upload area |

**Main Success Scenario:**
1. File picker opens. Owner selects up to 5 images (JPG/PNG/WEBP, max 5MB each).
2. Thumbnails preview in the form.
3. On save/publish, `storage.service.ts` uploads each file to `listing-images` Supabase Storage bucket.
4. Public URLs stored in `listings.images[]`.
5. Images appear on the listing card and detail page immediately.

**Alternate Flow A — Supabase Storage not configured (dev/mock mode):**
- `storage.service.ts` returns a blob URL. Preview works locally but URL is not persisted.

**Alternate Flow B — File exceeds 5MB:**
- "Image must be under 5MB." File rejected before upload.

**Postconditions:** `listings.images[]` contains public Supabase Storage URLs.

---

## Summary: Owner vs User Capability Matrix

| Capability | Regular User | Venue Owner |
|---|---|---|
| Browse map and feed | Yes (anon) | Yes |
| View listing detail | Yes (anon) | Yes |
| Save listings | Yes (auth) | Yes |
| Search | Yes | Yes |
| Sign up | Phone OTP | Email + password |
| Purchase tickets | Yes (future) | No |
| Create venue | No | Yes |
| Create listing | No | Yes |
| Edit listing | No | Own listings only |
| Deactivate listing | No | Own listings only |
| Upload images | No | Yes |
| View dashboard analytics | No | Own listings only |
| Report a listing | Yes (auth) | Yes (auth) |
| Receive listing update emails | Yes (if saved) | No |
| Scan QR at door | No | Yes (future) |
