/*
  # Add business settings

  1. Changes
    - Add currency_code column to restaurants table
    - Add business_type column to restaurants table
    - Set default values for both columns

  2. Data Migration
    - Set default values for existing records
*/

-- Add currency_code column with default value
ALTER TABLE restaurants 
ADD COLUMN IF NOT EXISTS currency_code text NOT NULL DEFAULT 'EUR';

-- Add business_type column with default value
ALTER TABLE restaurants 
ADD COLUMN IF NOT EXISTS business_type text NOT NULL DEFAULT 'restaurant';

-- Update existing records to have default values
UPDATE restaurants 
SET 
  currency_code = 'EUR',
  business_type = 'restaurant'
WHERE currency_code IS NULL OR business_type IS NULL;