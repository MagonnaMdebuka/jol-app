-- ============================================================
-- Jol — Migration 009: Secure Function Search Paths
--
-- Fixes the "Function Search Path Mutable" security vulnerability
-- by setting immutable search_path on all functions.
--
-- Run this in: Supabase Dashboard → SQL Editor
-- Safe to re-run — uses CREATE OR REPLACE
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- FUNCTION: set_updated_at (001)
-- Auto-stamp updated_at on any row change
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- FUNCTION: handle_new_user (001)
-- Auto-create profile row on user signup
-- SECURITY DEFINER — must have search_path set
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- FUNCTION: sync_save_count (001)
-- Keep listings.save_count accurate automatically
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.sync_save_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
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
$$;

-- ─────────────────────────────────────────────────────────────
-- FUNCTION: auto_review_listing (001)
-- After 3 pending reports → set listing to under_review
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.auto_review_listing()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
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
$$;

-- ─────────────────────────────────────────────────────────────
-- FUNCTION: increment_view_count (001)
-- Increment listing view counter
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.increment_view_count(listing_id UUID)
RETURNS VOID
LANGUAGE sql
SET search_path = ''
AS $$
  UPDATE public.listings
  SET view_count = view_count + 1
  WHERE id = listing_id;
$$;

-- ─────────────────────────────────────────────────────────────
-- FUNCTION: sync_interested_count (002)
-- Keep listings.interested_count accurate automatically
-- THIS IS THE FUNCTION FLAGGED BY SUPABASE SECURITY ADVISOR
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.sync_interested_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.listings
    SET interested_count = interested_count + 1
    WHERE id = NEW.listing_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.listings
    SET interested_count = GREATEST(interested_count - 1, 0)
    WHERE id = OLD.listing_id;
  END IF;
  RETURN NULL;
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- NOTES
-- ─────────────────────────────────────────────────────────────
--
-- This migration sets search_path on all non-PostGIS functions
-- to prevent the "Function Search Path Mutable" vulnerability.
--
-- PostGIS-dependent functions (sync_geog_from_location,
-- get_nearby_listings, search_listings) are not included here.
-- Run migration 010_secure_postgis_functions.sql after enabling
-- PostGIS to secure those functions.
--
-- For trigger functions (plpgsql): SET search_path = ''
--   - Empty path forces fully qualified table names (public.*)
--
-- For SECURITY DEFINER functions: SET search_path = public
--   - These need the schema accessible for auth.uid() etc.
--
