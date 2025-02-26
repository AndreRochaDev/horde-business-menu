/*
  # Update RLS policies for restaurants table

  1. Changes
    - Add policy for admin users to manage all restaurants
    - Update existing policies to handle admin access

  2. Security
    - Maintain existing user restrictions
    - Add admin-level access for specific users
*/

-- Create a function to check if a user is an admin
CREATE OR REPLACE FUNCTION is_admin(user_email text)
RETURNS boolean AS $$
BEGIN
  RETURN user_email = ANY(ARRAY['kuriseest@gmail.com', 'contact@horde.software']);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the SELECT policy
DROP POLICY IF EXISTS "Users can read own restaurants" ON restaurants;
CREATE POLICY "Users can read own restaurants"
  ON restaurants
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id 
    OR 
    is_admin(auth.jwt() ->> 'email')
  );

-- Update the INSERT policy
DROP POLICY IF EXISTS "Users can insert own restaurants" ON restaurants;
CREATE POLICY "Users can insert own restaurants"
  ON restaurants
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id 
    OR 
    is_admin(auth.jwt() ->> 'email')
  );

-- Update the UPDATE policy
DROP POLICY IF EXISTS "Users can update own restaurants" ON restaurants;
CREATE POLICY "Users can update own restaurants"
  ON restaurants
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id 
    OR 
    is_admin(auth.jwt() ->> 'email')
  )
  WITH CHECK (
    auth.uid() = user_id 
    OR 
    is_admin(auth.jwt() ->> 'email')
  );

-- Update the DELETE policy
DROP POLICY IF EXISTS "Users can delete own restaurants" ON restaurants;
CREATE POLICY "Users can delete own restaurants"
  ON restaurants
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id 
    OR 
    is_admin(auth.jwt() ->> 'email')
  );