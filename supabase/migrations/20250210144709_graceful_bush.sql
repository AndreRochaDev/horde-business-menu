/*
  # Update restaurant policies for better access control

  1. Changes
    - Update the SELECT policy for authenticated users to only see their own restaurants
    - Keep the public SELECT policy for unauthenticated access
    - Keep existing INSERT, UPDATE, and DELETE policies unchanged

  2. Security
    - Authenticated users can only see their own restaurants
    - Public users can still view restaurant details for menu access
*/

-- Drop the existing SELECT policy for authenticated users
DROP POLICY IF EXISTS "Users can read own restaurants" ON restaurants;

-- Create new SELECT policy for authenticated users to only see their own restaurants
CREATE POLICY "Users can read own restaurants"
  ON restaurants
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Keep the existing public SELECT policy
-- This allows unauthenticated users to view restaurant details for the public menu
-- The policy was created in a previous migration (tender_forest.sql)