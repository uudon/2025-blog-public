-- Analytics Database Schema for Cloudflare D1

-- Page views table - stores individual page views
CREATE TABLE IF NOT EXISTS page_views (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL,                    -- Article/page slug
  timestamp INTEGER NOT NULL,            -- Unix timestamp
  visitor_id TEXT NOT NULL,              -- Hashed visitor identifier
  referrer TEXT,                         -- HTTP referrer
  user_agent TEXT,                       -- HTTP user agent
  country TEXT,                          -- Country code (optional)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Daily aggregates table - stores daily statistics
CREATE TABLE IF NOT EXISTS daily_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL,                    -- Article/page slug or 'all' for total
  date TEXT NOT NULL,                    -- Date in YYYY-MM-DD format
  page_views INTEGER DEFAULT 0,          -- Total page views
  unique_visitors INTEGER DEFAULT 0,     -- Unique visitors
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(slug, date)                     -- Ensure one record per slug per day
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_page_views_slug_timestamp ON page_views(slug, timestamp);
CREATE INDEX IF NOT EXISTS idx_page_views_visitor_id ON page_views(visitor_id);
CREATE INDEX IF NOT EXISTS idx_page_views_timestamp ON page_views(timestamp);
CREATE INDEX IF NOT EXISTS idx_daily_stats_slug_date ON daily_stats(slug, date);
