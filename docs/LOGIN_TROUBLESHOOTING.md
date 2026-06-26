# Login Troubleshooting Guide

## Problem
Login fails with "Invalid credentials" or "Account pending approval" even though the user exists in the database.

## Root Causes

### 1. **User Exists in Database but Not in Supabase Auth**
If you manually created users in the `users` table without creating them in Supabase Auth:
- The user won't be able to login because Supabase Auth doesn't have their credentials
- **Solution**: Use the signup flow or create users via Supabase Auth admin API

### 2. **Email Mismatch**
If the email in the `users` table doesn't match the email in Supabase Auth:
- Login will fail because the system can't find the matching profile
- **Solution**: Ensure emails match exactly (case-sensitive in some cases)

### 3. **User Status is "pending"**
If the user's status is "pending", they can't login:
- **Solution**: Admin must approve the user by changing status to "active"

### 4. **User Status is "rejected" or "suspended"**
If the user's status is "rejected" or "suspended", they can't login:
- **Solution**: Admin must change status to "active"

## How to Debug

### Step 1: Check Current Session
Visit: `http://localhost:3000/api/debug/auth-status`

This will show:
- Whether you're currently authenticated
- Your user ID and email
- Your profile in the `users` table
- Your profile in the `agents` table
- Any errors from the database queries

### Step 2: Check Supabase Auth
1. Go to your Supabase dashboard
2. Navigate to Authentication → Users
3. Look for the email you're trying to login with
4. Verify the user exists and is confirmed

### Step 3: Check Database
Run these SQL queries in Supabase:

```sql
-- Check if user exists in auth.users
SELECT id, email, created_at FROM auth.users WHERE email = 'your-email@example.com';

-- Check if user exists in public.users
SELECT id, email, role, status FROM public.users WHERE email = 'your-email@example.com';

-- Check if agent profile exists
SELECT * FROM public.agents WHERE user_id = 'user-id-from-above';
```

## Common Scenarios

### Scenario 1: User Created Manually in Database
**Problem**: User exists in `users` table but not in Supabase Auth

**Solution**:
1. Delete the user from `users` table
2. Delete the agent from `agents` table
3. Use the signup flow to create the user properly

```sql
DELETE FROM public.agents WHERE user_id = 'user-id';
DELETE FROM public.users WHERE id = 'user-id';
```

### Scenario 2: User Needs Approval
**Problem**: User status is "pending"

**Solution**: Admin approves the user

```sql
UPDATE public.users 
SET status = 'active' 
WHERE email = 'user-email@example.com';
```

### Scenario 3: Email Mismatch
**Problem**: Email in `users` table doesn't match Supabase Auth email

**Solution**: Update the email in the `users` table to match

```sql
UPDATE public.users 
SET email = 'correct-email@example.com' 
WHERE id = 'user-id';
```

### Scenario 4: User Suspended
**Problem**: User status is "suspended"

**Solution**: Admin reactivates the user

```sql
UPDATE public.users 
SET status = 'active' 
WHERE email = 'user-email@example.com';
```

## Login Flow

Here's how the login process works:

1. **User submits email/password** → `/api/auth/login`
2. **Supabase Auth validates credentials** → If invalid, return 401
3. **Query `users` table for profile** → Using admin client (bypasses RLS)
4. **If profile doesn't exist** → Auto-create with status="pending"
5. **Check user status**:
   - If "pending" → Return 403 "Account pending approval"
   - If "rejected" or "suspended" → Return 403 "Account not active"
   - If "active" → Return 200 with role and status
6. **Frontend redirects** based on role:
   - admin → `/admin/dashboard`
   - manager → `/manager/dashboard`
   - agent → `/agent/dashboard`

## Testing the Fix

### Test 1: Create a New User
1. Go to `/signup`
2. Fill in the form with:
   - Email: `test@example.com`
   - Password: `TestPassword123!`
   - Full Name: `Test User`
   - Phone: `1234567890`
   - Region: `Test Region`
3. Submit
4. You should see "Account pending approval"

### Test 2: Approve the User
1. Go to `/admin/users` (as admin)
2. Find the user you just created
3. Click "Approve"
4. User status should change to "active"

### Test 3: Login as the User
1. Go to `/login`
2. Enter the email and password
3. You should be redirected to `/agent/dashboard`

## Still Having Issues?

1. **Check browser console** for error messages
2. **Check server logs** for detailed error information
3. **Visit `/api/debug/auth-status`** to see your current session
4. **Check Supabase logs** in the dashboard for auth errors
5. **Verify environment variables** are set correctly:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

## Key Points to Remember

- ✅ Users must be created through the signup flow or Supabase Auth admin API
- ✅ Email must match exactly between Supabase Auth and the `users` table
- ✅ New users start with status="pending" and need admin approval
- ✅ Only users with status="active" can login
- ✅ The system auto-creates profiles for users who login without a profile
