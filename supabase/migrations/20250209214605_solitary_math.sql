/*
  # Menu Management Schema

  1. New Tables
    - `menu_categories`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text, nullable)
      - `order` (integer)
      - `restaurant_id` (uuid, foreign key)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `menu_items`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text, nullable)
      - `price` (numeric)
      - `category_id` (uuid, foreign key)
      - `order` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for restaurant owners to manage their menu
*/

-- Create menu_categories table
CREATE TABLE IF NOT EXISTS menu_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  "order" integer NOT NULL DEFAULT 0,
  restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create menu_items table
CREATE TABLE IF NOT EXISTS menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price numeric(10,2) NOT NULL CHECK (price >= 0),
  category_id uuid NOT NULL REFERENCES menu_categories(id) ON DELETE CASCADE,
  "order" integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

-- Create policies for menu_categories
CREATE POLICY "Users can view menu categories" ON menu_categories
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM restaurants 
      WHERE restaurants.id = menu_categories.restaurant_id 
      AND restaurants.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert menu categories" ON menu_categories
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM restaurants 
      WHERE restaurants.id = restaurant_id 
      AND restaurants.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their menu categories" ON menu_categories
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM restaurants 
      WHERE restaurants.id = menu_categories.restaurant_id 
      AND restaurants.user_id = auth.uid()
    )
  );

-- Create policies for menu_items
CREATE POLICY "Users can view menu items" ON menu_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM menu_categories 
      JOIN restaurants ON restaurants.id = menu_categories.restaurant_id 
      WHERE menu_categories.id = menu_items.category_id 
      AND restaurants.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert menu items" ON menu_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM menu_categories 
      JOIN restaurants ON restaurants.id = menu_categories.restaurant_id 
      WHERE menu_categories.id = category_id 
      AND restaurants.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their menu items" ON menu_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM menu_categories 
      JOIN restaurants ON restaurants.id = menu_categories.restaurant_id 
      WHERE menu_categories.id = menu_items.category_id 
      AND restaurants.user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS menu_categories_restaurant_id_idx ON menu_categories(restaurant_id);
CREATE INDEX IF NOT EXISTS menu_items_category_id_idx ON menu_items(category_id);