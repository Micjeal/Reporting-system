# Email Confirmation Fix

## Problem

Login fails with: **"Email not confirmed"**

This happens because:
1. Users are created with `email_confirm: false`
2. Supabase requires email confirmation before login
3. Users can't confirm email without email service configured

## Solution

### For New Signups (Going Forward)

✅ **Fixed in code** - New signups will auto-confirm email

The signup endpoint now:
1. Creates user with Supabase Auth
2. **Automatically confirms email** using admin API
3. Creates user profile
4. Creates agent profile
5. User can login immediately

### For Existing Users (Already Signed Up)

Run this SQL script to confirm all existing unconfirmed emails:

```sql
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;
```

## How to Apply

### Step 1: Fix Existing Users

1. Go to **Supabase Dashboard**
2. **SQL Editor**
3. **Paste the SQL script** from `FIX_EMAIL_CONFIRMATION.sql`
4. **Click "Run"**
5. Wait for: **"ALL EMAILS CONFIRMED ✅"**

### Step 2: Test Login

1. Go to `http://localhost:3000/login`
2. Enter email and password
3. **Should login successfully** ✅

### Step 3: Test New Signup

1. Go to `http://localhost:3000/signup`
2. Create new account
3. **Should see "Account pending approval"** ✅
4. Approve in `/admin/users`
5. **Should login successfully** ✅

## What Changed

### Signup Endpoint

**Before:**
```typescript
const { data: authData, error } = await supabase.auth.signUp({
  email: body.email,
  password: body.password,
})
// Email NOT confirmed - user can't login
```

**After:**
```typescript
const { data: authData, error } = await supabase.auth.signUp({
  email: body.email,
  password: body.password,
})

// Confirm email automatically
await adminClient.auth.admin.updateUserById(userId, {
  email_confirm: true,
})
// Email confirmed - user can login after approval
```

## Complete Workflow Now

```
1. User signs up
   ↓
2. Supabase Auth creates user
   ↓
3. Email auto-confirmed ✅
   ↓
4. Database trigger creates profiles
   ↓
5. User sees "Account pending approval"
   ↓
6. Admin approves user
   ↓
7. User can login ✅
```

## Testing Checklist

- [ ] Run SQL script to confirm existing emails
- [ ] Try login with existing user
- [ ] Try signup with new email
- [ ] Approve new user in admin panel
- [ ] Try login with new user
- [ ] Check audit logs show all actions

## SQL Script

```sql
-- Confirm all unconfirmed emails
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;

-- Verify
SELECT id, email, email_confirmed_at FROM auth.users;
```

## Troubleshooting

### Still Getting "Email not confirmed"

1. Run the SQL script above
2. Restart dev server
3. Try login again

### User can't login after approval

1. Check user status is "active" in `/admin/users`
2. Check email is confirmed in Supabase dashboard
3. Try different email/password
4. Check server logs

### New signup still requires email confirmation

1. Restart dev server (picks up code changes)
2. Try signup again
3. Check server logs for `[Signup] Email confirmed`

## Build Status

✅ **Build Successful**
- No errors
- All routes compiled
- Ready for testing

## Next Steps

1. **Run the SQL script** to confirm existing emails
2. **Restart dev server** to pick up code changes
3. **Test login** with existing user
4. **Test signup** with new email
5. **Approve user** in admin panel
6. **Test login** with new user

## Success Indicators

✅ Existing users can login
✅ New signups show "Account pending approval"
✅ Admin can approve users
✅ Approved users can login
✅ No "Email not confirmed" errors
✅ Audit logs record all actions

## Files Modified

- ✅ `/api/auth/signup` - Auto-confirms email
- ✅ `FIX_EMAIL_CONFIRMATION.sql` - Confirms existing emails

## Support

If still having issues:
1. Check server logs for `[Signup]` messages
2. Run the SQL script to confirm emails
3. Restart dev server
4. Try login again
