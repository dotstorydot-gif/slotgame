-- 1. CLEAN UP: Remove all existing policies to avoid name conflicts
DROP POLICY IF EXISTS "Enable read for all users" ON inventory;
DROP POLICY IF EXISTS "Enable update for all users" ON inventory;
DROP POLICY IF EXISTS "inventory_public_access" ON inventory;
DROP POLICY IF EXISTS "Enable insert for all users" ON leads;
DROP POLICY IF EXISTS "Enable read for all users" ON leads;
DROP POLICY IF EXISTS "Enable update for all users" ON leads;
DROP POLICY IF EXISTS "Enable delete for all users" ON leads;
DROP POLICY IF EXISTS "leads_public_access" ON leads;

-- 2. RESET TABLES: Recreate tables for per-venue support
DROP TABLE IF EXISTS inventory;
CREATE TABLE inventory (
  id TEXT NOT NULL,
  venue TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  label TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id, venue)
);

-- Note: We keep the leads table but ensure columns are correct
ALTER TABLE leads ADD COLUMN IF NOT EXISTS venue TEXT;

-- 3. SEED Data: Fresh stock for all 3 venues
INSERT INTO inventory (id, venue, count, label)
VALUES 
  ('duffle_bag', 'Le Méridien Airport', 100, 'Heineken Bag'),
  ('laptop_bag', 'Le Méridien Airport', 50, 'Laptop Case'),
  ('laptop_sleeve', 'Le Méridien Airport', 20, 'Laptop Sleeve'),
  ('try_again', 'Le Méridien Airport', 200, 'Try Again'),
  
  ('duffle_bag', 'Buffalo Wings & Rings', 100, 'Heineken Bag'),
  ('laptop_bag', 'Buffalo Wings & Rings', 50, 'Laptop Case'),
  ('laptop_sleeve', 'Buffalo Wings & Rings', 20, 'Laptop Sleeve'),
  ('try_again', 'Buffalo Wings & Rings', 200, 'Try Again'),
  
  ('duffle_bag', 'The Villa Hub', 100, 'Heineken Bag'),
  ('laptop_bag', 'The Villa Hub', 50, 'Laptop Case'),
  ('laptop_sleeve', 'The Villa Hub', 20, 'Laptop Sleeve'),
  ('try_again', 'The Villa Hub', 200, 'Try Again')
ON CONFLICT (id, venue) DO UPDATE SET count = EXCLUDED.count;

-- 4. ENABLE SECURITY: Apply clean, new policies
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "inventory_public_access" ON inventory FOR ALL USING (true);
CREATE POLICY "leads_public_access" ON leads FOR ALL USING (true);

