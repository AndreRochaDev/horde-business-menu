/*
  # Add delete policy for restaurants

  1. Changes
    - Add policy allowing authenticated users to delete their own restaurants
  2. Security
    - Users can only delete restaurants they own
*/

CREATE POLICY "Users can delete own restaurants"
  ON restaurants
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);