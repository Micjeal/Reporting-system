# Authentication Setup & Troubleshooting Guide

## Overview

Your system has a two-part authentication system:

1. **Supabase Auth** - Handles email/password authentication
2. **Database Profiles** - Stores user roles and approval status

Both must be in sync for login to work.

## How Authentication Works

### Signup Flow
1. User fills signup form with email, password, name, phone, region
2. System creates user in Supabase Auth
3. System creates user profile in `users` table with status="pending"
4. System creates agent profile in `agents` table
5. User sees "Account pending approval" message
6. Admin must approve the user

### Login Flow
1. User enters email and password
2. Supabase Auth validates credentials
3. System checks `users` table for role and status
4. If status="active" → Login succeeds, redirect to dashboard
5. If status="pending" → Show "Account pending approval"
6. If status="rejected"/"suspended" → Show "Account not active"

## Common Issues & Solutions

### Issue 1: "Invalid credentials" on login
**Possible causes:**
- Email doesn't exist in Supabase Auth
- Password is incorrect
- User was created manually in database without Supabase Auth account

**Solution:**
1. Visit `http://localhost:3000/api/debug/auth-status` to check your session
2. Check Supabase dashboard → Authentication → Users
3. If user doesn't exist in Supabase Auth, use signup form to create account

### Issue 2: "Account pending approval" on login
**Possible causes:**
- User status is "pending" in database
- User hasn't been approved by admin yet

**Solution:**
1. Admin goes to `/admin/users`
2. Find the user in the list
3. Click "Approve" button
4. User status changes to "active"
5. User can now login

### Issue 3: "Account not active" on login
**Possible causes:**
- User status is "rejected" or "suspended"
- Admin has disabled the account

**Solution:**
1. Admin goes to `/admin/users`
2. Find the user in the list
3. Click "Activate" or "Unsuspend" button
4. User status changes to "active"
5. User can now login

### Issue 4: Signup fails with "Database error creating new user"
**Possible causes:**
- Email already exists in Supabase Auth
- Database constraints are violated
- `region` field is required but empty

**Solution:**
1. Check server logs for detailed error message
2. Verify email isn't already registered
3. Try signup with different email
4. Check that all required fields are filled

## Database Schema

### users table
```sql
CREATE TABLE public.users (
  id uuid PRIMARY KEY,
  email text NOT NULL UNIQUE,
  role text NOT NULL DEFAULT 'agent' CHECK (role IN ('admin', 'manager', 'agent')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'rejected', 'suspended')),
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);
```

### agents table
```sql
CREATE TABLE public.agents (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id uuid NOT NULL UNIQUE REFERENCES public.users(id),
  name text NOT NULL,
  phone text NOT NULL,
  region text NOT NULL,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);
```

## User Roles

### Admin
- Can approve/reject user signups
- Can suspend/activate users
- Can view all data
- Can manage products, inventory, sales, expenses
- Access: `/admin/dashboard`

### Manager
- Can view analytics and reports
- Can manage inventory and sales
- Cannot approve users
- Access: `/manager/dashboard`

### Agent
- Can record sales
- Can claim expenses
- Can view their own data
- Cannot approve other users
- Access: `/agent/dashboard`

## Testing the Auth System

### Test 1: Create a New User
1. Go to `/signup`
2. Fill in form:
   - Email: `test@example.com`
   - Password: `TestPassword123!`
   - Full Name: `Test User`
   - Phone: `1234567890`
   - Region: `Test Region`
3. Click "Create Account"
4. You should see "Account pending approval"

### Test 2: Approve the User (as Admin)
1. Go to `/admin/users`
2. Find the user you just created
3. Click "Approve"
4. User status should change to "active"

### Test 3: Login as the User
1. Go to `/login`
2. Enter email: `test@example.com`
3. Enter password: `TestPassword123!`
4. Click "Sign In"
5. You should be redirected to `/agent/dashboard`

### Test 4: Suspend the User (as Admin)
1. Go to `/admin/users`
2. Find the user
3. Click "Suspend"
4. User status should change to "suspended"

### Test 5: Try to Login as Suspended User
1. Go to `/login`
2. Enter email and password
3. You should see "Account not active"

## Debug Endpoint

### GET /api/debug/auth-status
Shows your current authentication status and database profiles.

**Response:**
```json
{
  "authenticated": true,
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "created_at": "2024-01-01T00:00:00Z"
  },
  "profile": {
    "id": "user-uuid",
    "email": "user@example.com",
    "role": "agent",
    "status": "active",
    "created_at": "2024-01-01T00:00:00Z"
  },
  "agent": {
    "id": 1,
    "user_id": "user-uuid",
    "name": "User Name",
    "phone": "1234567890",
    "region": "Test Region",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

## SQL Queries for Manual Fixes

### Check if user exists in Supabase Auth
```sql
-- Run in Supabase SQL Editor
SELECT id, email, created_at FROM auth.users WHERE email = 'user@example.com';
```

### Check if user exists in database
```sql
SELECT id, email, role, status FROM public.users WHERE email = 'user@example.com';
```

### Approve a user
```sql
UPDATE public.users 
SET status = 'active' 
WHERE email = 'user@example.com';
```

### Suspend a user
```sql
UPDATE public.users 
SET status = 'suspended' 
WHERE email = 'user@example.com';
```

### Reject a user
```sql
UPDATE public.users 
SET status = 'rejected' 
WHERE email = 'user@example.com';
```

### Delete a user (if needed)
```sql
-- Delete from agents first (foreign key constraint)
DELETE FROM public.agents WHERE user_id = 'user-uuid';

-- Then delete from users
DELETE FROM public.users WHERE id = 'user-uuid';

-- Then delete from auth (in Supabase dashboard or via admin API)
```

## Environment Variables

Make sure these are set in your `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Troubleshooting Checklist

- [ ] User exists in Supabase Auth (check dashboard)
- [ ] User exists in `users` table (check database)
- [ ] User exists in `agents` table (check database)
- [ ] User status is "active" (not "pending", "rejected", or "suspended")
- [ ] Email matches exactly between Supabase Auth and database
- [ ] Environment variables are set correctly
- [ ] Server logs show no errors (check terminal)
- [ ] Browser console shows no errors (check DevTools)

## Getting Help

1. Check the server logs for error messages
2. Visit `/api/debug/auth-status` to see your current status
3. Check Supabase dashboard for auth errors
4. Review this guide for common issues
5. Check the browser console for client-side errors
