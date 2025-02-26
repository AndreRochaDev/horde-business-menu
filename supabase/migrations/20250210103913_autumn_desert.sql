/*
  # Add delete policy for menu categories

  1. Changes
    - Add delete policy for menu_categories table

  2. Security
    - Users can only delete their own menu categories
    - Deleting a category will automatically delete all its menu items (via CASCADE)
*/

-- Add delete policy for menu_categories
CREATE POLICY "Users can delete their menu categories" ON menu_categories
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM restaurants 
      WHERE restaurants.id = menu_categories.restaurant_id 
      AND restaurants.user_id = auth.uid()
    )
  );