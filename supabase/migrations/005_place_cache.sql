-- Add columns for caching place data from Foursquare/Google APIs
-- This allows explorer-side to read from DB cache without direct API calls

ALTER TABLE public.venues
ADD COLUMN IF NOT EXISTS fsq_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS google_place_id TEXT,
ADD COLUMN IF NOT EXISTS cached_photos JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS cached_rating NUMERIC(2,1),
ADD COLUMN IF NOT EXISTS cached_category TEXT,
ADD COLUMN IF NOT EXISTS place_source TEXT CHECK (place_source IN ('foursquare', 'google', 'manual', 'osm')),
ADD COLUMN IF NOT EXISTS cache_fetched_at TIMESTAMPTZ;

-- Indexes for lookup by external place IDs
CREATE INDEX IF NOT EXISTS idx_venues_fsq_id ON public.venues (fsq_id);
CREATE INDEX IF NOT EXISTS idx_venues_google_place_id ON public.venues (google_place_id);

COMMENT ON COLUMN public.venues.fsq_id IS 'Foursquare place ID for deduplication';
COMMENT ON COLUMN public.venues.google_place_id IS 'Google Places ID for deduplication';
COMMENT ON COLUMN public.venues.cached_photos IS 'Array of external photo URLs from API';
COMMENT ON COLUMN public.venues.cached_rating IS 'Rating from API (1.0-10.0 scale)';
COMMENT ON COLUMN public.venues.cached_category IS 'Category name from API';
COMMENT ON COLUMN public.venues.place_source IS 'Data source: foursquare, google, manual, or osm';
COMMENT ON COLUMN public.venues.cache_fetched_at IS 'When API data was last fetched';
