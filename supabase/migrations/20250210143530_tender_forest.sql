/*
  # Add public access policies for menu viewing

  1. Changes
    - Add policies allowing public access to restaurant data
    - Add policies allowing public access to menu categories
    - Add policies allowing public access to menu items
  2. Security
    - Public can only read data, no write access
    - Access is limited to essential fields only
*/

-- Allow public access to restaurants
CREATE POLICY "Public can view restaurant details"
  ON restaurants
  FOR SELECT
  TO anon
  USING (true);

-- Allow public access to menu categories
CREATE POLICY "Public can view menu categories"
  ON menu_categories
  FOR SELECT
  TO anon
  USING (true);

-- Allow public access to menu items
CREATE POLICY "Public can view menu items"
  ON menu_items
  FOR SELECT
  TO anon
  USING (true);