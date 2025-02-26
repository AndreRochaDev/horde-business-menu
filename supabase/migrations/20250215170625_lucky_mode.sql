-- Create a view for public user information
CREATE VIEW users_public AS
SELECT
  id,
  email,
  created_at
FROM auth.users;

-- Grant access to the view
GRANT SELECT ON users_public TO authenticated;