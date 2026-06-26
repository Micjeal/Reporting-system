-- =========================================
-- FIX EMAIL CONFIRMATION FOR ALL USERS
-- =========================================
-- This script confirms all unconfirmed emails
-- so users can login without email verification

-- Run this in Supabase SQL Editor

-- =========================================
-- CONFIRM ALL UNCONFIRMED EMAILS
-- =========================================
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;

-- =========================================
-- VERIFY CONFIRMATION
-- =========================================
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- =========================================
-- SUCCESS
-- =========================================
SELECT 'ALL EMAILS CONFIRMED ✅' AS result;
