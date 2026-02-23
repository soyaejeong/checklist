-- Checklist items table
CREATE TABLE checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trip_id TEXT NOT NULL,
  item_name TEXT NOT NULL,
  category TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 1),
  priority TEXT NOT NULL DEFAULT 'recommended'
    CHECK (priority IN ('essential', 'recommended', 'optional')),
  assigned_day INTEGER,
  activity_ref TEXT,
  CHECK (NOT (assigned_day IS NOT NULL AND activity_ref IS NOT NULL)),
  reasoning TEXT,
  checked BOOLEAN NOT NULL DEFAULT FALSE,
  booking_link TEXT,
  source TEXT NOT NULL DEFAULT 'user' CHECK (source IN ('user', 'ai')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Dismissed suggestions table
CREATE TABLE dismissed_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trip_id TEXT NOT NULL,
  item_name TEXT NOT NULL,
  category TEXT,
  activity_ref TEXT,
  dismissed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, trip_id, item_name, category)
);

-- Custom categories table
CREATE TABLE user_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trip_id TEXT NOT NULL,
  category_name TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, trip_id, category_name)
);

-- Performance indexes
CREATE INDEX idx_checklist_items_user_trip ON checklist_items(user_id, trip_id);
CREATE INDEX idx_dismissed_user_trip ON dismissed_suggestions(user_id, trip_id);
CREATE INDEX idx_user_categories_user_trip ON user_categories(user_id, trip_id);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER checklist_items_updated_at
  BEFORE UPDATE ON checklist_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Row Level Security
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE dismissed_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own checklist items"
  ON checklist_items FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own dismissed suggestions"
  ON dismissed_suggestions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own categories"
  ON user_categories FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
