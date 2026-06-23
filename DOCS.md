# Jol — Documentation

> Nightlife & Food Discovery App for Gauteng, South Africa

---

## Table of Contents

1. [Product Overview](#product-overview)
2. [User Flows](#user-flows)
3. [Use Cases](#use-cases)
4. [Feature Reference](#feature-reference)
5. [Technical Architecture](#technical-architecture)
6. [Database Schema](#database-schema)
7. [API Reference](#api-reference)
8. [Deployment Guide](#deployment-guide)

---

## Product Overview

### What is Jol?

Jol is a Progressive Web App (PWA) for discovering nightlife events, clubs, restaurants, and food spots in Gauteng, South Africa. The name "Jol" is South African slang meaning "to party" or "have a good time."

### Target Market

- **Primary:** Young adults (18-35) in Johannesburg, Pretoria, and surrounding areas
- **Secondary:** Tourists and visitors looking for local nightlife and dining

### Value Proposition

| For Explorers                   | For Venue Owners           |
| ------------------------------- | -------------------------- |
| Find events happening tonight   | List your venue for free   |
| Discover new food spots nearby  | Post events and specials   |
| Filter by vibe, distance, price | Track views and engagement |
| Save favourites for later       | Reach local audience       |
| Share spots with friends        | No commission fees         |

### Platform

- **Web App:** Mobile-first responsive design
- **PWA:** Installable on iOS/Android, offline support
- **No native apps** — single codebase for all platforms

---

## User Flows

### Explorer Journey

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Landing   │────▶│  Discovery  │────▶│   Listing   │────▶│   Action    │
│   (Map)     │     │  (Browse)   │     │  (Detail)   │     │  (Go/Share) │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │                   │
       ▼                   ▼                   ▼                   ▼
  Auto-location       Filter by:          View info:          - Directions
  Centers map         - Vibe chips        - Photos            - Share
                      - Sort toggle       - Date/time         - Save
                      - Search            - Entry fee         - Interested
                                          - Address
```

#### Flow Details:

1. **Landing (Map View)**
   - User opens app at `/`
   - Geolocation requested (optional)
   - Map centers on user or defaults to Gauteng
   - Markers show nearby listings

2. **Discovery (Browse)**
   - Filter by vibe: Tonight, Weekend, Food, Events, Free, Chill, Date Night
   - Sort by: Nearest (default) or Latest
   - Switch views: Map `/` or Feed `/feed`
   - Search: `/search` with Jol + OSM results

3. **Listing Detail**
   - Tap marker or card → `/listing/:id`
   - View all details, photos, map
   - Actions: Save, Share, Get Directions, Report

4. **Action**
   - "Take me there" → Opens Google Maps
   - Share → Native share sheet or WhatsApp
   - Interested → RSVP (logged-in users)

### Owner Journey

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Register   │────▶│   Venue     │────▶│   Create    │────▶│  Dashboard  │
│  /owner     │     │   Setup     │     │   Listing   │     │  (Manage)   │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │                   │
       ▼                   ▼                   ▼                   ▼
  Email signup        Add venue:          Add listing:        - View stats
  Role: owner         - Name, type        - Event/Food        - Edit listings
                      - Address           - Photos            - Delete
                      - Location          - Details           - Add new
```

#### Flow Details:

1. **Register** (`/owner/register`)
   - Email + password signup
   - Role set to "owner" in metadata
   - Auto-creates profile via DB trigger

2. **Venue Setup** (`/owner/venue/setup`)
   - Required before creating listings
   - Enter venue name, type, address
   - Set location on map (click to pin)
   - SA phone validation

3. **Create Listing** (`/owner/listings/new`)
   - Choose type: Event or Food
   - Upload photos (up to 5)
   - Fill details (date, price, etc.)
   - Preview before publishing

4. **Dashboard** (`/owner/dashboard`)
   - View all listings with stats
   - Edit or soft-delete listings
   - Create new listings

### Authentication Flow

```
┌──────────────────────────────────────────────────────────────┐
│                        Sign In Page                          │
│                        /sign-in                              │
├──────────────────────────────┬───────────────────────────────┤
│      Regular User            │       Venue Owner             │
│      (Phone OTP)             │       (Email/Password)        │
├──────────────────────────────┼───────────────────────────────┤
│  1. Enter SA phone number    │  1. Enter email + password    │
│  2. Receive OTP via SMS      │  2. Submit form               │
│  3. Enter OTP code           │  3. Redirect to dashboard     │
│  4. Redirect to app          │                               │
└──────────────────────────────┴───────────────────────────────┘
```

---

## Use Cases

### UC1: Find a Club Tonight

**Actor:** Explorer (anonymous)

**Preconditions:** None

**Flow:**

1. Open app → lands on Map view
2. Allow location access (or use default Gauteng center)
3. Tap "Tonight" filter chip
4. Browse event markers on map
5. Tap a marker → see preview card
6. Tap "View full details"
7. Review entry fee, dress code, time
8. Tap "Take me there" → opens Google Maps

**Postconditions:** User has directions to venue

---

### UC2: Discover Food Spots Nearby

**Actor:** Explorer (anonymous)

**Preconditions:** None

**Flow:**

1. Open app → tap Feed icon (bottom nav)
2. Tap "Eat" filter chip
3. Scroll through food spot cards
4. Tap "Sort" → switch to "Latest" for newest spots
5. Tap a card to view details
6. Check opening hours, price range, cuisine
7. Share via WhatsApp to friends

**Postconditions:** User shared restaurant with friends

---

### UC3: Save Events for Later

**Actor:** Explorer (anonymous or logged in)

**Preconditions:** None

**Flow:**

1. Browse listings in Feed or Map
2. Tap heart icon on any listing card
3. Listing saved to device (localStorage)
4. Navigate to Saved page (`/saved`)
5. View all saved listings
6. Tap to remove from saved

**Postconditions:** Saved listings persist across sessions

---

### UC4: RSVP to Event (Interested)

**Actor:** Explorer (logged in)

**Preconditions:** User is authenticated

**Flow:**

1. Open an event listing
2. Tap "Interested" button
3. Button fills, count increments
4. Other users see interested count
5. Tap again to remove interest

**Postconditions:** Interest recorded, count updated

---

### UC5: List a Venue

**Actor:** Venue Owner (new)

**Preconditions:** None

**Flow:**

1. Navigate to `/owner/register`
2. Enter email and password
3. Submit → redirected to venue setup
4. Fill venue details (name, type, address)
5. Click map to set location pin
6. Submit → venue created
7. Redirected to dashboard

**Postconditions:** Owner has venue, can create listings

---

### UC6: Post an Event

**Actor:** Venue Owner (existing)

**Preconditions:** Owner has a venue

**Flow:**

1. Login at `/owner/login`
2. Dashboard shows existing listings
3. Click "New Listing"
4. Select "Event" type
5. Fill: title, date, time, entry fee, dress code
6. Upload cover photo
7. Click "Preview" to verify
8. Click "Publish"

**Postconditions:** Event live, visible to explorers

---

### UC7: Report Inappropriate Listing

**Actor:** Explorer (anonymous or logged in)

**Preconditions:** Viewing a listing

**Flow:**

1. Open listing detail page
2. Scroll to bottom
3. Tap "Report" button
4. Select reason: Fake event, Wrong info, Inappropriate, Other
5. Optionally add description
6. Submit report

**Postconditions:**

- Report saved to database
- If 3+ reports → listing auto-flagged as "under_review"

---

### UC8: Search for Specific Place

**Actor:** Explorer (anonymous)

**Preconditions:** None

**Flow:**

1. Tap Search icon (bottom nav or header)
2. Type venue name (e.g., "Taboo")
3. Results show:
   - Jol listings (if matched)
   - OpenStreetMap places (restaurants, bars)
4. Tap a result
5. If Jol listing → view detail page
6. If OSM place → view info sheet with "Add to Jol" CTA

**Postconditions:** User found the place or discovered alternative

---

## Feature Reference

### Explorer Features

| Feature        | Route          | Description                                   |
| -------------- | -------------- | --------------------------------------------- |
| Discovery Map  | `/`            | Interactive map with listing markers, filters |
| Feed           | `/feed`        | Card-based listing feed, sections by type     |
| Listing Detail | `/listing/:id` | Full listing info, photos, map, actions       |
| Search         | `/search`      | Dual-layer search (Jol + OpenStreetMap)       |
| Saved          | `/saved`       | Locally saved listings (localStorage)         |
| Sign In        | `/sign-in`     | Phone OTP for users, email for owners         |

### Owner Features

| Feature      | Route                      | Description                   |
| ------------ | -------------------------- | ----------------------------- |
| Register     | `/owner/register`          | Email signup with owner role  |
| Login        | `/owner/login`             | Email/password authentication |
| Dashboard    | `/owner/dashboard`         | Listing management, stats     |
| Venue Setup  | `/owner/venue/setup`       | Create/edit venue profile     |
| New Listing  | `/owner/listings/new`      | Create event or food listing  |
| Edit Listing | `/owner/listings/:id/edit` | Modify existing listing       |

### Filter Options

| Filter     | Shows                             |
| ---------- | --------------------------------- |
| All        | All active listings               |
| Tonight    | Events happening today            |
| Weekend    | Events this Saturday/Sunday       |
| Eat        | Food spots only                   |
| Events     | Events only                       |
| Free       | Events with no entry fee          |
| Chill      | Listings tagged "Chill" vibe      |
| Date Night | Listings tagged "Date night" vibe |

### Sort Options

| Sort    | Behavior                                |
| ------- | --------------------------------------- |
| Nearest | By distance from user (default)         |
| Latest  | By created_at descending (newest first) |

### Listing Types

| Type      | Fields                                                                                     |
| --------- | ------------------------------------------------------------------------------------------ |
| **Event** | event_date, event_end_date, entry_fee, dress_code, artist, age_restriction, tags, capacity |
| **Food**  | cuisine_type, opening_hours, price_range, special                                          |

### PWA Features

| Feature     | Description                                 |
| ----------- | ------------------------------------------- |
| Installable | Add to home screen on mobile                |
| Offline     | Cached pages, map tiles, fonts work offline |
| Theme       | Orange accent (#ff7a3d) status bar          |

---

## Technical Architecture

### Stack

| Layer      | Technology                                        |
| ---------- | ------------------------------------------------- |
| Framework  | React 18 + TypeScript (strict mode)               |
| Build      | Vite 8                                            |
| Styling    | Tailwind CSS v3 with custom `nz-*` tokens         |
| Routing    | React Router v6 (lazy-loaded pages)               |
| State      | React Context (Auth, Listings, Saved, Interested) |
| Database   | Supabase (PostgreSQL)                             |
| Auth       | Supabase Auth (Phone OTP + Email)                 |
| Storage    | Supabase Storage (images)                         |
| Map        | react-leaflet v5 + CartoDB Dark Matter tiles      |
| Icons      | lucide-react                                      |
| PWA        | vite-plugin-pwa + Workbox                         |
| Deployment | Vercel (static SPA)                               |

### Provider Stack

```tsx
<BrowserRouter>
  <ToastProvider>
    {' '}
    // Global toast notifications
    <AuthProvider>
      {' '}
      // Supabase auth state
      <ListingsProvider>
        {' '}
        // Listings data + filters
        <SavedProvider>
          {' '}
          // localStorage saved IDs
          <InterestedProvider>
            {' '}
            // RSVP state (logged-in)
            <Routes />
          </InterestedProvider>
        </SavedProvider>
      </ListingsProvider>
    </AuthProvider>
  </ToastProvider>
</BrowserRouter>
```

### Context Responsibilities

| Context             | State                           | Persistence                    |
| ------------------- | ------------------------------- | ------------------------------ |
| `AuthContext`       | user, session, isOwner, isGuest | Supabase session               |
| `ListingsContext`   | listings, filters, sortBy       | In-memory                      |
| `SavedContext`      | savedIds (Set)                  | localStorage `jol-saved`       |
| `InterestedContext` | interestedIds (Set)             | Supabase `interested_listings` |

### File Structure

```
src/
├── config/           # Environment, Supabase client
├── types/            # TypeScript interfaces
├── constants/        # Static data, categories, map config
├── contexts/         # React contexts (Auth, Listings, etc.)
├── services/         # Supabase API calls (guarded)
├── hooks/            # Custom hooks (geolocation, nearby)
├── components/
│   ├── ui/           # Button, Input, Badge, Modal, etc.
│   ├── layout/       # AppShell, TopNav, BottomNav
│   ├── map/          # MapView, MapFilters
│   ├── listings/     # ListingCard variants
│   └── auth/         # AuthForms, AuthGuard
└── pages/
    ├── DiscoveryMap.tsx
    ├── Feed.tsx
    ├── Search.tsx
    ├── Saved.tsx
    ├── ListingDetail.tsx
    ├── SignIn.tsx
    └── owner/        # Owner-only pages
```

### Guard Pattern

Every Supabase call is guarded to prevent crashes when env vars are missing:

```ts
export const getListings = async (): Promise<IListing[]> => {
  if (!isSupabaseEnabled() || !supabase) return []; // Guard
  const { data, error } = await supabase.from('listings').select('*');
  if (error) return [];
  return data as IListing[];
};
```

---

## Database Schema

### Tables

#### `profiles`

Extends Supabase auth.users. Auto-created on signup.

| Column       | Type        | Description                  |
| ------------ | ----------- | ---------------------------- |
| id           | UUID        | Primary key, refs auth.users |
| display_name | TEXT        | User's display name          |
| avatar_url   | TEXT        | Profile picture URL          |
| phone        | TEXT        | Phone number                 |
| role         | TEXT        | 'user', 'owner', or 'admin'  |
| created_at   | TIMESTAMPTZ | Record creation time         |
| updated_at   | TIMESTAMPTZ | Last update time             |

#### `venues`

Venue profiles owned by owners.

| Column      | Type    | Description                    |
| ----------- | ------- | ------------------------------ |
| id          | UUID    | Primary key                    |
| owner_id    | UUID    | Refs profiles.id               |
| name        | TEXT    | Venue name                     |
| type        | TEXT    | Club, Tavern, Restaurant, etc. |
| address     | TEXT    | Street address                 |
| location    | JSONB   | { lat, lng } coordinates       |
| phone       | TEXT    | Contact number                 |
| description | TEXT    | About the venue                |
| cover_photo | TEXT    | Cover image URL                |
| logo_url    | TEXT    | Logo image URL                 |
| website     | TEXT    | Website URL                    |
| instagram   | TEXT    | Instagram handle               |
| facebook    | TEXT    | Facebook page                  |
| verified    | BOOLEAN | Admin-verified status          |
| status      | TEXT    | pending, active, suspended     |

#### `listings`

Events and food spots.

| Column           | Type        | Description                             |
| ---------------- | ----------- | --------------------------------------- |
| id               | UUID        | Primary key                             |
| venue_id         | UUID        | Refs venues.id                          |
| owner_id         | UUID        | Refs profiles.id                        |
| type             | TEXT        | 'event' or 'food'                       |
| title            | TEXT        | Listing title                           |
| description      | TEXT        | Full description                        |
| address          | TEXT        | Event/spot address                      |
| location         | JSONB       | { lat, lng } coordinates                |
| images           | TEXT[]      | Array of image URLs                     |
| status           | TEXT        | active, under_review, inactive, deleted |
| view_count       | INTEGER     | Total views                             |
| save_count       | INTEGER     | Times saved                             |
| interested_count | INTEGER     | RSVP count (events)                     |
| event_date       | TIMESTAMPTZ | Event start (events only)               |
| event_end_date   | TIMESTAMPTZ | Event end (events only)                 |
| entry_fee        | TEXT        | Entry price (events)                    |
| dress_code       | TEXT        | Casual, Smart Casual, Formal, Any       |
| artist           | TEXT        | Performing artist (events)              |
| age_restriction  | TEXT        | Age limit (events)                      |
| tags             | TEXT[]      | Genre tags (events)                     |
| capacity         | INTEGER     | Max attendees (events)                  |
| cuisine_type     | TEXT        | Food type (food spots)                  |
| opening_hours    | TEXT        | Hours (food spots)                      |
| price_range      | TEXT        | R, RR, RRR, RRRR (food spots)           |
| special          | TEXT        | Daily special (food spots)              |
| vibe             | TEXT[]      | Vibe tags                               |
| when_chip        | TEXT        | Display text (e.g., "Tonight 9pm")      |

#### `saved_listings`

User saved listings (synced from localStorage when logged in).

| Column     | Type        | Description      |
| ---------- | ----------- | ---------------- |
| id         | UUID        | Primary key      |
| user_id    | UUID        | Refs profiles.id |
| listing_id | UUID        | Refs listings.id |
| created_at | TIMESTAMPTZ | When saved       |

#### `interested_listings`

Event RSVP tracking.

| Column     | Type        | Description      |
| ---------- | ----------- | ---------------- |
| id         | UUID        | Primary key      |
| user_id    | UUID        | Refs profiles.id |
| listing_id | UUID        | Refs listings.id |
| created_at | TIMESTAMPTZ | When interested  |

#### `reports`

User reports on listings.

| Column      | Type        | Description                                  |
| ----------- | ----------- | -------------------------------------------- |
| id          | UUID        | Primary key                                  |
| listing_id  | UUID        | Refs listings.id                             |
| reported_by | UUID        | Refs profiles.id                             |
| reason      | TEXT        | Fake event, Wrong info, Inappropriate, Other |
| description | TEXT        | Additional details                           |
| status      | TEXT        | pending, reviewed, dismissed                 |
| created_at  | TIMESTAMPTZ | Report time                                  |

### Triggers

| Trigger                | Table               | Action                         |
| ---------------------- | ------------------- | ------------------------------ |
| `on_auth_user_created` | auth.users          | Auto-create profile row        |
| `trg_save_count`       | saved_listings      | Sync listings.save_count       |
| `trg_interested_count` | interested_listings | Sync listings.interested_count |
| `trg_auto_review`      | reports             | Flag listing after 3 reports   |

### Row Level Security (RLS)

All tables have RLS enabled:

- **profiles:** Users read/update own profile only
- **venues:** Public read active, owners full access to own
- **listings:** Public read active/under_review, owners full access to own
- **saved_listings:** Users access own saves only
- **interested_listings:** Users access own interests only
- **reports:** Authenticated insert, read own reports

---

## API Reference

### Supabase RPCs

#### `get_nearby_listings`

Returns listings within radius, sorted by distance.

```ts
const { data } = await supabase.rpc('get_nearby_listings', {
  lat: -26.2041,
  lng: 28.0473,
  radius_metres: 10000, // default 10km
  listing_type: null, // 'event' | 'food' | null (all)
});
```

**Returns:** Array of listings with `distance_metres` and `venue_name` added.

#### `increment_view_count`

Increments view count for a listing.

```ts
await supabase.rpc('increment_view_count', {
  listing_id: 'uuid-here',
});
```

### Service Functions

#### `listing.service.ts`

| Function                                    | Description            |
| ------------------------------------------- | ---------------------- |
| `getNearbyListings(lat, lng, radius, type)` | Fetch nearby listings  |
| `getListing(id)`                            | Fetch single listing   |
| `getOwnerListings(ownerId)`                 | Fetch owner's listings |
| `createListing(payload)`                    | Create new listing     |
| `updateListing(id, payload)`                | Update listing         |
| `softDeleteListing(id)`                     | Set status to inactive |
| `incrementViewCount(id)`                    | Track view             |

#### `venue.service.ts`

| Function                   | Description         |
| -------------------------- | ------------------- |
| `getOwnerVenue(ownerId)`   | Fetch owner's venue |
| `createVenue(payload)`     | Create venue        |
| `updateVenue(id, payload)` | Update venue        |

#### `auth.service.ts`

| Function                                     | Description      |
| -------------------------------------------- | ---------------- |
| `signInWithPhone(phone)`                     | Send OTP         |
| `verifyOTP(phone, token)`                    | Verify OTP       |
| `signUpWithEmail(email, password, metadata)` | Owner signup     |
| `signInWithEmail(email, password)`           | Owner login      |
| `signOut()`                                  | Sign out         |
| `resetPassword(email)`                       | Send reset email |
| `updatePassword(newPassword)`                | Update password  |

#### `rsvp.service.ts`

| Function                              | Description              |
| ------------------------------------- | ------------------------ |
| `toggleInterested(userId, listingId)` | Toggle RSVP              |
| `isUserInterested(userId, listingId)` | Check if interested      |
| `getUserInterestedListings(userId)`   | Get all user's interests |
| `getInterestedCount(listingId)`       | Get count for listing    |

#### `report.service.ts`

| Function                                       | Description   |
| ---------------------------------------------- | ------------- |
| `submitReport(listingId, reason, description)` | Submit report |

#### `storage.service.ts`

| Function                          | Description                |
| --------------------------------- | -------------------------- |
| `uploadImage(file, bucket, path)` | Upload to Supabase Storage |
| `getPublicUrl(bucket, path)`      | Get public URL             |

---

## Deployment Guide

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase project (free tier works)
- Vercel account (free tier works)

### Environment Variables

Create `.env` file:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**Note:** App works without these (mock mode) but won't persist data.

### Local Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Database Setup

1. Create Supabase project at [supabase.com](https://supabase.com)
2. Go to SQL Editor
3. Run `supabase/migrations/001_initial_schema.sql`
4. Run `supabase/migrations/002_rsvp.sql`
5. Copy URL and anon key to `.env`

### Vercel Deployment

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy

**Note:** `vercel.json` handles SPA routing:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/" }]
}
```

### PWA Icons

Replace placeholder icons in `public/icons/`:

- `icon-192.png` (192x192)
- `icon-512.png` (512x512)

Use [realfavicongenerator.net](https://realfavicongenerator.net) to generate from your logo.

---

## Appendix

### Design Tokens

| Token            | Hex     | Usage                     |
| ---------------- | ------- | ------------------------- |
| `nz-bg`          | #16110c | Page background           |
| `nz-surface`     | #1f1810 | Cards, panels             |
| `nz-elevated`    | #2a2014 | Inputs, elevated elements |
| `nz-border`      | #3a2c1b | All borders               |
| `nz-text`        | #f5ecd9 | Primary text              |
| `nz-muted`       | #a08a72 | Secondary text            |
| `nz-accent`      | #ff7a3d | Brand orange, CTAs        |
| `nz-accent-text` | #ffb88a | Accent on dark            |
| `nz-apricot`     | #f4c477 | Food type accent          |

### Typography

- **Display:** Bricolage Grotesque, weight 800-900
- **Mono:** JetBrains Mono, labels and metadata
- **Body:** Inter (Tailwind default)

### Contact

- **GitHub:** [MagonnaMdebuka/jol-nightlife](https://github.com/MagonnaMdebuka/jol-nightlife)
- **Deployment:** Vercel

---

_Last updated: 2026-06-08_
