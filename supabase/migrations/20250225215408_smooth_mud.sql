/*
  # Fix menu categories RLS policies

  1. Changes
    - Drop existing policies for menu_categories
    - Create new policies with proper checks for restaurant ownership
    - Add policies for all CRUD operations

  2. Security
    - Ensure users can only manage categories for restaurants they own
    - Maintain public read access for menus
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view menu categories" ON menu_categories;
DROP POLICY IF EXISTS "Users can insert menu categories" ON menu_categories;
DROP POLICY IF EXISTS "Users can update their menu categories" ON menu_categories;
DROP POLICY IF EXISTS "Public can view menu categories" ON menu_categories;

-- Create new policies
CREATE POLICY "Public can view menu categories"
  ON menu_categories
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can manage own menu categories"
  ON menu_categories
  USING (
    EXISTS (
      SELECT 1 FROM restaurants 
      WHERE restaurants.id = menu_categories.restaurant_id 
      AND (
        restaurants.user_id = auth.uid()
        OR 
        is_admin(auth.jwt() ->> 'email')
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM restaurants 
      WHERE restaurants.id = restaurant_id 
      AND (
        restaurants.user_id = auth.uid()
        OR 
        is_admin(auth.jwt() ->> 'email')
      )
    )
  );

-- Enable RLS
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;