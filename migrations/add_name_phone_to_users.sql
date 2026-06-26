-- Migration: Add name, phone, and updated_at columns to users table
-- This migration adds optional name and phone fields to the users table
-- to support admin and user profile management

-- Add name column if it doesn't exist
ALTER TABLE users
ADD COLUMN IF NOT EXISTS name TEXT;

-- Add phone column if it doesn't exist
ALTER TABLE users
ADD COLUMN IF NOT EXISTS phone TEXT;

-- Add updated_at column if it doesn't exist
ALTER TABLE users
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add comment to document the columns
COMMENT ON COLUMN users.name IS 'User full name (optional)';
COMMENT ON COLUMN users.phone IS 'User phone number (optional)';
COMMENT ON COLUMN users.updated_at IS 'Timestamp of last update';
