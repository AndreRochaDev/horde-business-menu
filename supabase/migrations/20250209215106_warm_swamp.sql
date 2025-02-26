/*
  # Add delete policy for menu items

  1. Changes
    - Add delete policy for menu_items table to allow users to delete their own menu items

  2. Security
    - Policy ensures users can only delete menu items from their own restaurants
*/

CREATE POLICY "Users can delete their menu items" ON menu_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM menu_categories 
      JOIN restaurants ON restaurants.id = menu_categories.restaurant_id 
      WHERE menu_categories.id = menu_items.category_id 
      AND restaurants.user_id = auth.uid()
    )
  );