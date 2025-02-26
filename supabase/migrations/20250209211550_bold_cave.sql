/*
  # Add restaurant alias

  1. Changes
    - Add `alias` column to restaurants table
    - Add unique constraint on alias
    - Add function to generate slug from name
  
  2. Security
    - Existing RLS policies will cover the new column
*/

-- Function to generate a slug from text
CREATE OR REPLACE FUNCTION generate_slug(text) RETURNS text AS $$
  SELECT lower(regexp_replace(regexp_replace($1, '[^a-zA-Z0-9\s-]', ''), '\s+', '-', 'g'));
$$ LANGUAGE SQL IMMUTABLE;

-- Add alias column
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'restaurants' AND column_name = 'alias'
  ) THEN
    ALTER TABLE restaurants ADD COLUMN alias text UNIQUE;
    
    -- Update existing restaurants with an alias based on their name
    UPDATE restaurants 
    SET alias = generate_slug(name) 
    WHERE alias IS NULL;
    
    -- Make alias required for future entries
    ALTER TABLE restaurants ALTER COLUMN alias SET NOT NULL;
  END IF;
END $$;