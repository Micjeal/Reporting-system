# Signup Diagnostic Guide

## Current Error

```
[Signup] Auth signup error: null
POST /api/auth/signup 400
Error: Failed to create user account
```

This means Supabase Auth is returning `null` for both user and error, which is unusual.

## Diagnostic Steps

### Step 1: Check Server Logs

Look for `[Signup]` messages in your server terminal. You should see:

```
[Signup] Starting signup for: test@example.com
[Signup] Calling supabase.auth.signUp...
[Signup] Auth response: { hasUser: true, userId: 'uuid', error: 'null' }
[Signup] Created auth user: uuid
[Signup] Creating user profile...
[Signup] Creating agent profile...
[Signup] Creating audit log...
[Signup] Signup successful for: test@example.com
```

If you see different messages, note them down.

### Step 2: Check Supabase Connection

Verify environment variables are set:

```bash
# In your terminal
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
echo $SUPABASE_SERVICE_ROLE_KEY
```

All three should have values. If any are empty, set them in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Step 3: Check Supabase Project Status

1. Go to **Supabase Dashboard**
2. Check project status (should be "Active")
3. Check if Auth is enabled
4. Check if database is accessible

### Step 4: Test Auth Directly

In Supabase SQL Editor, check if auth is working:

```sql
-- Check if auth.users table exists
SELECT COUNT(*) FROM auth.users;

-- Check recent auth logs
SELECT * FROM auth.audit_log_entries 
ORDER BY created_at DESC LIMIT 10;
```

### Step 5: Check Email Uniqueness

If you've tried signup multiple times with the same email:

```sql
-- Check if email already exists in auth
SELECT id, email FROM auth.users WHERE email = 'test@example.com';

-- If it exists, you need to use a different email
```

### Step 6: Try Different Email

Try signup with a completely different email:
- `test2@example.com`
- `newuser@test.com`
- `user123@example.com`

If it works with a different email, the original email already exists.

### Step 7: Check Supabase Logs

1. Go to **Supabase Dashboard**
2. Navigate to **Logs**
3. Look for auth errors
4. Check for database errors
5. Look for any error messages

### Step 8: Check Network

1. Open **Browser DevTools** (F12)
2. Go to **Network** tab
3. Try signup
4. Look for the POST request to `/api/auth/signup`
5. Check the response status and body

## Common Issues & Solutions

### Issue 1: Email Already Exists
**Error**: `null` response from auth signup
**Solution**: Use a different email address

```sql
-- Check existing emails
SELECT email FROM auth.users;
```

### Issue 2: Supabase Project Down
**Error**: Connection timeout or `null` response
**Solution**: 
1. Check Supabase dashboard status
2. Wait a few minutes
3. Try again

### Issue 3: Invalid Environment Variables
**Error**: Connection refused or `null` response
**Solution**:
1. Verify `.env.local` has correct values
2. Restart the dev server
3. Try again

### Issue 4: Auth Service Disabled
**Error**: `null` response from auth
**Solution**:
1. Go to Supabase dashboard
2. Check Auth is enabled
3. Check Auth settings

### Issue 5: Database Trigger Error
**Error**: User created in auth but profile not created
**Solution**:
1. Check trigger exists: `SELECT * FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created'`
2. Check trigger function: `SELECT * FROM pg_proc WHERE proname = 'handle_new_user'`
3. Re-run the SQL fix script if needed

## Detailed Logging Output

After the fix, you should see detailed logs like:

```
[Signup] Starting signup for: test@example.com
[Signup] Calling supabase.auth.signUp...
[Signup] Auth response: { 
  hasUser: true, 
  userId: '550e8400-e29b-41d4-a716-446655440000',
  error: 'null',
  errorStatus: undefined
}
[Signup] Created auth user: 550e8400-e29b-41d4-a716-446655440000
[Signup] Creating user profile...
[Signup] Creating agent profile...
[Signup] Creating audit log...
[Signup] Signup successful for: test@example.com
```

## If Still Failing

1. **Check server logs** for `[Signup]` messages
2. **Check browser console** for network errors
3. **Check Supabase logs** for auth errors
4. **Verify environment variables** are correct
5. **Try different email** to rule out duplicates
6. **Check Supabase project status** is Active
7. **Restart dev server** to pick up env changes

## Quick Checklist

- [ ] Environment variables set in `.env.local`
- [ ] Supabase project is Active
- [ ] Auth is enabled in Supabase
- [ ] Database is accessible
- [ ] Trigger exists in database
- [ ] Using different email each time
- [ ] Dev server restarted after env changes
- [ ] No network errors in browser console
- [ ] Server logs show `[Signup]` messages

## Next Steps

1. **Check server logs** for `[Signup]` messages
2. **Note the exact error** from the logs
3. **Try with different email** to rule out duplicates
4. **Check Supabase dashboard** for any errors
5. **Verify environment variables** are correct
6. **Report the exact error** from server logs

## Support

If signup still doesn't work after these steps:
1. Share the full `[Signup]` log output
2. Share the browser console error
3. Share the Supabase error (if any)
4. Confirm environment variables are set
5. Confirm Supabase project is Active
