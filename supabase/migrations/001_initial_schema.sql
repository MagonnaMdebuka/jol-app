-- ============================================================
-- Jol — Nightlife & Food Discovery App
-- Migration 001: Initial Schema
--
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- EXTENSIONS
-- ─────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ─────────────────────────────────────────────────────────────
-- HELPER: auto-stamp updated_at on any row change
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ═════════════════════════════════════════════════════════════
-- TABLE: profiles
-- Extends auth.users — created automatically on sign-up
-- Roles: 'user' (browse + buy tickets) | 'owner' (manage venue)
-- ═════════════════════════════════════════════════════════════
CREATE TABLE public.profiles (
  id           UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url   TEXT,                        -- Supabase Storage URL
  phone        TEXT,
  role         TEXT        NOT NULL DEFAULT 'user'
                             CHECK (role IN ('user', 'owner', 'admin')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Auto-create profile row every time a user signs up via Supabase Auth
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- ═════════════════════════════════════════════════════════════
-- TABLE: venues
-- A venue owner can have one or more venues (clubs, restaurants…)
-- Matches IVenue + VenueType in src/types/venue.types.ts
-- ═════════════════════════════════════════════════════════════
CREATE TABLE public.venues (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL,
  type        TEXT        NOT NULL DEFAULT 'Other'
                            CHECK (type IN ('Club','Tavern','Shebeen','Restaurant','Bar','Food Market','Other')),
  address     TEXT        NOT NULL,
  location    JSONB       NOT NULL,          -- { "lat": -26.xx, "lng": 28.xx }
  phone       TEXT,
  description TEXT,
  cover_photo TEXT,                          -- Supabase Storage URL
  logo_url    TEXT,                          -- Supabase Storage URL
  website     TEXT,
  instagram   TEXT,
  facebook    TEXT,
  verified    BOOLEAN     NOT NULL DEFAULT FALSE,
  status      TEXT        NOT NULL DEFAULT 'active'
                            CHECK (status IN ('pending','active','suspended')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_venues_updated_at
  BEFORE UPDATE ON public.venues
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ═════════════════════════════════════════════════════════════
-- TABLE: listings
-- Events and food spots — matches IListing in listing.types.ts
-- ═════════════════════════════════════════════════════════════
CREATE TABLE public.listings (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id        UUID        NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  owner_id        UUID        NOT NULL REFERENCES public.profiles(id),
  type            TEXT        NOT NULL CHECK (type IN ('event','food')),
  title           TEXT        NOT NULL,
  description     TEXT,
  address         TEXT        NOT NULL,
  location        JSONB       NOT NULL,      -- { "lat": -26.xx, "lng": 28.xx }
  images          TEXT[]      NOT NULL DEFAULT '{}',
  status          TEXT        NOT NULL DEFAULT 'active'
                                CHECK (status IN ('active','under_review','inactive','deleted')),
  view_count      INTEGER     NOT NULL DEFAULT 0,
  save_count      INTEGER     NOT NULL DEFAULT 0,

  -- Event-specific (null for food listings)
  event_date      TIMESTAMPTZ,
  event_end_date  TIMESTAMPTZ,
  entry_fee       TEXT,
  dress_code      TEXT        CHECK (dress_code IN ('Casual','Smart Casual','Formal','Any')),
  artist          TEXT,
  age_restriction TEXT,
  tags            TEXT[],
  capacity        INTEGER,                   -- max tickets sellable via PayFast

  -- Food-specific (null for event listings)
  cuisine_type    TEXT,
  opening_hours   TEXT,
  price_range     TEXT        CHECK (price_range IN ('R','RR','RRR','RRRR')),
  special         TEXT,

  -- Discovery / display fields
  vibe            TEXT[],
  when_chip       TEXT,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_listings_updated_at
  BEFORE UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ═════════════════════════════════════════════════════════════
-- TABLE: saved_listings
-- Moves saves from localStorage → DB so they sync across devices
-- ═════════════════════════════════════════════════════════════
CREATE TABLE public.saved_listings (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES public.profiles(id)  ON DELETE CASCADE,
  listing_id UUID        NOT NULL REFERENCES public.listings(id)  ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, listing_id)
);

-- Keep listings.save_count accurate automatically
CREATE OR REPLACE FUNCTION sync_save_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.listings
    SET save_count = save_count + 1
    WHERE id = NEW.listing_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.listings
    SET save_count = GREATEST(save_count - 1, 0)
    WHERE id = OLD.listing_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_save_count
  AFTER INSERT OR DELETE ON public.saved_listings
  FOR EACH ROW EXECUTE FUNCTION sync_save_count();


-- ═════════════════════════════════════════════════════════════
-- TABLE: listing_views  (analytics)
-- Tracks every view — anonymous users get a browser session_id;
-- logged-in users are linked by user_id.
-- When an anonymous user later signs up their session_id rows
-- can be back-filled with their new user_id.
-- ═════════════════════════════════════════════════════════════
CREATE TABLE public.listing_views (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID        NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  user_id    UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  session_id TEXT,                          -- anon browser UUID (localStorage)
  source     TEXT        CHECK (source IN ('map','feed','search','saved','direct')),
  viewed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ═════════════════════════════════════════════════════════════
-- TABLE: reports
-- Matches IReport + ReportReason in src/types/report.types.ts
-- Auto-flags listing for review after 3 pending reports
-- ═════════════════════════════════════════════════════════════
CREATE TABLE public.reports (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id  UUID        NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  reported_by UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  reason      TEXT        NOT NULL
                            CHECK (reason IN ('Fake event','Wrong info','Inappropriate content','Other')),
  description TEXT,
  status      TEXT        NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending','reviewed','dismissed')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- After 3 pending reports → set listing to under_review
CREATE OR REPLACE FUNCTION auto_review_listing()
RETURNS TRIGGER AS $$
DECLARE
  pending_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO pending_count
  FROM public.reports
  WHERE listing_id = NEW.listing_id
    AND status = 'pending';

  IF pending_count >= 3 THEN
    UPDATE public.listings
    SET status = 'under_review'
    WHERE id = NEW.listing_id
      AND status = 'active';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_auto_review
  AFTER INSERT ON public.reports
  FOR EACH ROW EXECUTE FUNCTION auto_review_listing();


-- ═════════════════════════════════════════════════════════════
-- TABLE: orders  (PayFast — future)
-- One order can contain multiple tickets
-- ═════════════════════════════════════════════════════════════
CREATE TABLE public.orders (
  id                         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                    UUID         NOT NULL REFERENCES public.profiles(id),
  total_amount               NUMERIC(10,2) NOT NULL,
  payfast_payment_id         TEXT,
  payfast_merchant_reference TEXT         UNIQUE,    -- your internal reference sent to PayFast
  status                     TEXT         NOT NULL DEFAULT 'pending'
                                            CHECK (status IN ('pending','complete','cancelled','failed')),
  created_at                 TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  paid_at                    TIMESTAMPTZ
);


-- ═════════════════════════════════════════════════════════════
-- TABLE: tickets  (PayFast — future)
-- Each ticket row represents purchased entry to a listing
-- qr_code is scanned at the venue door
-- ═════════════════════════════════════════════════════════════
CREATE TABLE public.tickets (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID          NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  listing_id  UUID          NOT NULL REFERENCES public.listings(id),
  user_id     UUID          NOT NULL REFERENCES public.profiles(id),
  ticket_type TEXT          NOT NULL DEFAULT 'general'
                              CHECK (ticket_type IN ('general','vip','ladies','gents')),
  quantity    INTEGER       NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price  NUMERIC(10,2) NOT NULL,
  total_price NUMERIC(10,2) NOT NULL,
  qr_code     TEXT          UNIQUE,                 -- generated server-side, scanned at door
  status      TEXT          NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending','active','used','cancelled','refunded')),
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);


-- ═════════════════════════════════════════════════════════════
-- INDEXES
-- ═════════════════════════════════════════════════════════════
CREATE INDEX idx_listings_venue_id      ON public.listings       (venue_id);
CREATE INDEX idx_listings_owner_id      ON public.listings       (owner_id);
CREATE INDEX idx_listings_type          ON public.listings       (type);
CREATE INDEX idx_listings_status        ON public.listings       (status);
CREATE INDEX idx_listing_views_listing  ON public.listing_views  (listing_id);
CREATE INDEX idx_listing_views_user     ON public.listing_views  (user_id);
CREATE INDEX idx_listing_views_session  ON public.listing_views  (session_id);
CREATE INDEX idx_saved_listings_user    ON public.saved_listings (user_id);
CREATE INDEX idx_reports_listing        ON public.reports        (listing_id);
CREATE INDEX idx_orders_user            ON public.orders         (user_id);
CREATE INDEX idx_tickets_listing        ON public.tickets        (listing_id);
CREATE INDEX idx_tickets_user           ON public.tickets        (user_id);


-- ═════════════════════════════════════════════════════════════
-- RPC: get_nearby_listings
-- Called by listing.service.ts → getNearbyListings()
-- Uses Haversine formula over JSONB location field
-- ═════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION get_nearby_listings(
  lat           DOUBLE PRECISION,
  lng           DOUBLE PRECISION,
  radius_metres INTEGER  DEFAULT 10000,
  listing_type  TEXT     DEFAULT NULL
)
RETURNS TABLE (
  id              UUID,
  venue_id        UUID,
  owner_id        UUID,
  type            TEXT,
  title           TEXT,
  description     TEXT,
  address         TEXT,
  location        JSONB,
  images          TEXT[],
  status          TEXT,
  view_count      INTEGER,
  save_count      INTEGER,
  event_date      TIMESTAMPTZ,
  event_end_date  TIMESTAMPTZ,
  entry_fee       TEXT,
  dress_code      TEXT,
  artist          TEXT,
  age_restriction TEXT,
  tags            TEXT[],
  capacity        INTEGER,
  cuisine_type    TEXT,
  opening_hours   TEXT,
  price_range     TEXT,
  special         TEXT,
  vibe            TEXT[],
  when_chip       TEXT,
  created_at      TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ,
  distance_metres DOUBLE PRECISION,
  venue_name      TEXT
)
LANGUAGE sql STABLE AS $$
  SELECT
    l.id, l.venue_id, l.owner_id, l.type, l.title, l.description,
    l.address, l.location, l.images, l.status, l.view_count, l.save_count,
    l.event_date, l.event_end_date, l.entry_fee, l.dress_code, l.artist,
    l.age_restriction, l.tags, l.capacity, l.cuisine_type, l.opening_hours,
    l.price_range, l.special, l.vibe, l.when_chip, l.created_at, l.updated_at,
    (
      6371000 * ACOS(
        LEAST(1.0,
          COS(RADIANS(lat))
          * COS(RADIANS((l.location->>'lat')::DOUBLE PRECISION))
          * COS(RADIANS((l.location->>'lng')::DOUBLE PRECISION) - RADIANS(lng))
          + SIN(RADIANS(lat))
          * SIN(RADIANS((l.location->>'lat')::DOUBLE PRECISION))
        )
      )
    ) AS distance_metres,
    v.name AS venue_name
  FROM  public.listings l
  JOIN  public.venues   v ON v.id = l.venue_id
  WHERE l.status = 'active'
    AND (listing_type IS NULL OR l.type = listing_type)
    AND (
      6371000 * ACOS(
        LEAST(1.0,
          COS(RADIANS(lat))
          * COS(RADIANS((l.location->>'lat')::DOUBLE PRECISION))
          * COS(RADIANS((l.location->>'lng')::DOUBLE PRECISION) - RADIANS(lng))
          + SIN(RADIANS(lat))
          * SIN(RADIANS((l.location->>'lat')::DOUBLE PRECISION))
        )
      )
    ) <= radius_metres
  ORDER BY distance_metres ASC;
$$;


-- ═════════════════════════════════════════════════════════════
-- RPC: increment_view_count
-- Called by listing.service.ts → incrementViewCount()
-- ═════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION increment_view_count(listing_id UUID)
RETURNS VOID LANGUAGE sql AS $$
  UPDATE public.listings
  SET view_count = view_count + 1
  WHERE id = listing_id;
$$;


-- ═════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- Every table is locked down. Supabase anon key alone cannot
-- write data — the user must be authenticated unless the policy
-- explicitly allows it (e.g. listing_views inserts).
-- ═════════════════════════════════════════════════════════════

-- profiles ────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Each user reads and updates only their own profile
CREATE POLICY "profiles: read own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles: update own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- venues ──────────────────────────────────────
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;

-- Anyone (incl. anon) can see active venues
CREATE POLICY "venues: public read active"
  ON public.venues FOR SELECT
  USING (status = 'active');

-- Owners can do everything to their own venues
CREATE POLICY "venues: owner full access"
  ON public.venues FOR ALL
  USING (auth.uid() = owner_id);

-- listings ────────────────────────────────────
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

-- Anyone can see active + under_review listings (under_review still visible but flagged)
CREATE POLICY "listings: public read"
  ON public.listings FOR SELECT
  USING (status IN ('active','under_review'));

-- Owners can do everything to their own listings
CREATE POLICY "listings: owner full access"
  ON public.listings FOR ALL
  USING (auth.uid() = owner_id);

-- saved_listings ──────────────────────────────
ALTER TABLE public.saved_listings ENABLE ROW LEVEL SECURITY;

-- Each user can only see and modify their own saves
CREATE POLICY "saved_listings: own"
  ON public.saved_listings FOR ALL
  USING (auth.uid() = user_id);

-- listing_views ───────────────────────────────
ALTER TABLE public.listing_views ENABLE ROW LEVEL SECURITY;

-- Anyone can insert a view (anonymous or logged in)
CREATE POLICY "listing_views: insert any"
  ON public.listing_views FOR INSERT
  WITH CHECK (true);

-- Users can only read their own view history
CREATE POLICY "listing_views: read own"
  ON public.listing_views FOR SELECT
  USING (auth.uid() = user_id);

-- reports ─────────────────────────────────────
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can file a report
CREATE POLICY "reports: authenticated insert"
  ON public.reports FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Users can read only the reports they filed
CREATE POLICY "reports: read own"
  ON public.reports FOR SELECT
  USING (auth.uid() = reported_by);

-- orders ──────────────────────────────────────
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orders: own"
  ON public.orders FOR ALL
  USING (auth.uid() = user_id);

-- tickets ─────────────────────────────────────
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tickets: own"
  ON public.tickets FOR ALL
  USING (auth.uid() = user_id);
