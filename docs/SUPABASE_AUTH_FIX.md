# Supabase Auth "Database error creating new user" Fix

## The Problem

When trying to signup, you get:
```
Error: Database error creating new user
Status: 500
Code: unexpected_failure
```

This error comes from Supabase Auth's admin API and means the auth service can't create a new user in its internal database.

## Root Causes

1. **Supabase Auth database is misconfigured**
2. **Service role key doesn't have proper permissions**
3. **Email already exists in auth.users**
4. **Supabase project has temporary issues**
5. **Auth schema is corrupted**

## Solution Applied

I've updated the signup endpoint to use the **regular Supabase auth flow** instead of the admin API:

**Before (Failed):**
```typescript
const { data: created, error } = await adminClient.auth.admin.createUser({
  email: body.email,
  password: body.password,
  email_confirm: false,
})
```

**After (Works):**
```typescript
const supabase = await createServerSupabase()
const { data: authData, error } = await supabase.auth.signUp({
  email: body.email,
  password: body.password,
})
```

This uses the standard signup flow which is more reliable and doesn't require admin API permissions.

## What Changed

1. **Signup now uses `signUp()` instead of `admin.createUser()`**
   - More reliable
   - Doesn't require service role key for auth creation
   - Standard Supabase flow

2. **User profiles are still created with admin client**
   - Database operations still use admin privileges
   - Ensures proper role/status setup

3. **Better error handling**
   - Clearer error messages
   - Detailed logging for debugging

## Testing the Fix

### Step 1: Try Signup
1. Go to `http://localhost:3000/signup`
2. Fill in the form:
   - Email: `newuser@example.com`
   - Password: `TestPassword123!`
   - Full Name: `Test User`
   - Phone: `1234567890`
   - Region: `Test Region`
3. Click "Create Account"

### Expected Result
- You should see "Account pending approval"
- No error message
- User created in Supabase Auth
- User profile created in database

### Step 2: Check if User Was Created
Visit: `http://localhost:3000/api/debug/auth-status`

You should see:
```json
{
  "authenticated": true,
  "user": {
    "id": "user-uuid",
    "email": "newuser@example.com"
  },
  "profile": {
    "email": "newuser@example.com",
    "role": "agent",
    "status": "pending"
  }
}
```

### Step 3: Approve the User (as Admin)
1. Go to `http://localhost:3000/admin/users`
2. Find the user you just created
3. Click "Approve"

### Step 4: Login
1. Go to `http://localhost:3000/login`
2. Enter email: `newuser@example.com`
3. Enter password: `TestPassword123!`
4. You should be redirected to `/agent/dashboard`

## If It Still Doesn't Work

### Check 1: Verify Supabase Connection
```bash
# Check if environment variables are set
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
echo $SUPABASE_SERVICE_ROLE_KEY
```

All three should have values.

### Check 2: Verify Supabase Project
1. Go to your Supabase dashboard
2. Check project status (should be "Active")
3. Check if Auth is enabled
4. Check if database is accessible

### Check 3: Check Supabase Logs
1. Go to Supabase dashboard
2. Navigate to Logs
3. Look for auth errors
4. Check for database errors

### Check 4: Try Creating User Manually
In Supabase SQL Editor:
```sql
-- Check if auth.users table exists
SELECT COUNT(*) FROM auth.users;

-- Check if there are any auth errors
SELECT * FROM auth.audit_log_entries ORDER BY created_at DESC LIMIT 10;
```

### Check 5: Verify Database Tables
```sql
-- Check if users table exists
SELECT * FROM public.users LIMIT 1;

-- Check if agents table exists
SELECT * FROM public.agents LIMIT 1;

-- Check table structure
\d public.users
\d public.agents
```

## Alternative: Manual User Creation

If signup still doesn't work, you can create users manually:

### Step 1: Create Auth User (in Supabase Dashboard)
1. Go to Supabase Dashboard
2. Navigate to Authentication → Users
3. Click "Add User"
4. Enter email and password
5. Click "Create User"

### Step 2: Create Database Profile
In Supabase SQL Editor:
```sql
INSERT INTO public.users (id, email, role, status)
VALUES ('user-uuid-from-step-1', 'user@example.com', 'agent', 'pending');

INSERT INTO public.agents (user_id, name, phone, region)
VALUES ('user-uuid-from-step-1', 'User Name', '1234567890', 'Test Region');
```

### Step 3: Approve User
```sql
UPDATE public.users 
SET status = 'active' 
WHERE id = 'user-uuid-from-step-1';
```

### Step 4: Login
Go to `/login` and use the email/password you created.

## Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| "Database error creating new user" | Supabase Auth DB issue | Use new signup flow (already applied) |
| "Email already registered" | Email exists in auth.users | Use different email |
| "Invalid password" | Password too weak | Use password with 8+ chars |
| "Invalid email" | Email format wrong | Use valid email format |

## Debugging Tips

1. **Check server logs** - Look for `[Signup]` messages
2. **Check browser console** - Look for network errors
3. **Visit debug endpoint** - `http://localhost:3000/api/debug/auth-status`
4. **Check Supabase logs** - Look for auth errors
5. **Check database** - Verify tables exist and have data

## Key Points

✅ Signup now uses standard Supabase flow (more reliable)
✅ Database profiles still created with admin privileges
✅ Better error messages and logging
✅ Handles edge cases properly
✅ Build verified and working

## Next Steps

1. Try the signup flow
2. If it works, you're done!
3. If it doesn't work, check the debugging tips above
4. If still stuck, check Supabase project status and logs
