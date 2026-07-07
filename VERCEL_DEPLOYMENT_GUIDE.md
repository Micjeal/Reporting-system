# Vercel Deployment & Environment Configuration Guide

## Overview
This guide walks you through fixing the Vercel deployment issues for the Reporting System.

## Issues Fixed

### 1. ✅ Root Route (`/`) Error Handling
**File**: `app/page.tsx`
- Added try-catch block to handle unexpected errors gracefully
- Added fallback redirect to `/login` on authentication failures
- Improved error logging for debugging

### 2. ✅ Production Environment Variables
**Files**: `.env.production`, `.env.local.example`
- Created `.env.production` with correct production URLs
- Updated example file with guidance for production setup

---

## Required Steps to Complete Deployment

### Step 1: Configure Vercel Environment Variables

1. Go to **[Vercel Dashboard](https://vercel.com/micjeals-projects/reporting-system)**
2. Click **Settings** → **Environment Variables**
3. Add/Update these variables for **Production** environment:

| Variable | Value | Type |
|----------|-------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://zyazywhjqcbcmupjdxob.supabase.co` | Public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Public |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Secret |
| `NEXT_PUBLIC_APP_URL` | `https://reporting-system-fawn.vercel.app` | Public |

**Important**: 
- Remove or unset `NEXT_PUBLIC_NGROK_URL` (not needed in production)
- Keep local `.env.local` for development (already has correct values)

### Step 2: Redeploy

Option A: **Auto-redeploy** (recommended)
- Push the code changes we made to main branch
- Vercel will auto-trigger a new deployment

Option B: **Manual redeploy**
- Go to **Vercel Dashboard** → **Deployments**
- Click the three dots on latest deployment → **Redeploy**

### Step 3: Verify Deployment

After redeployment completes:
1. Visit `https://reporting-system-fawn.vercel.app/`
2. Expected behavior:
   - ✅ **Unauthenticated users** → redirect to `/login`
   - ✅ **Authenticated users** → redirect to role-based dashboard
   - ✅ **Pending approval** → redirect to `/pending-approval`
   - ✅ **Suspended users** → redirect to `/unauthorized`

---

## Architecture: How Root Route Works

```
User visits: https://reporting-system-fawn.vercel.app/
        ↓
[app/page.tsx - Server Component]
        ↓
Check Supabase Auth Session
        ↓
    No Session?
    ├─→ redirect('/login')
        ↓
    Has Session?
    ├─→ Query users table (admin client - bypasses RLS)
        ├─→ No profile found?
        │  └─→ redirect('/pending-approval')
        ├─→ Status = 'pending'?
        │  └─→ redirect('/pending-approval')
        ├─→ Status = 'rejected' or 'suspended'?
        │  └─→ redirect('/unauthorized')
        ├─→ role = 'admin'?
        │  └─→ redirect('/admin/dashboard')
        ├─→ role = 'manager'?
        │  └─→ redirect('/manager/dashboard')
        └─→ else (agent)?
           └─→ redirect('/agent/dashboard')
```

---

## Troubleshooting

### Issue: Still getting 404 or 500 error

**Cause**: Environment variables not updated in Vercel
- **Fix**: Double-check all 4 variables are set in Vercel (Step 1 above)
- **Check**: Go to Vercel Dashboard → Deployments → Latest → "View Source" tab

### Issue: Redirect loop or blank page

**Cause**: Supabase RLS policy blocking user profile lookup
- **Fix**: Verify RLS policy allows admin client to read `users` table
- **Check Supabase**:
  1. Go to **Authentication** → **Policies**
  2. Ensure service role has access to read user profiles

### Issue: Email redirects not working

**Cause**: `NEXT_PUBLIC_APP_URL` pointing to localhost
- **Fix**: Already fixed in `.env.production` → should work after redeploy
- **Verify**: Check that `NEXT_PUBLIC_APP_URL=https://reporting-system-fawn.vercel.app`

### Issue: Build fails with "ignoreBuildErrors"

**Current config**: `next.config.mjs` has `typescript: { ignoreBuildErrors: true }`
- This is **temporary** and masks real issues
- **Recommendation**: Fix TypeScript errors and remove this flag

---

## Summary of Changes Made

| File | Change | Purpose |
|------|--------|---------|
| `app/page.tsx` | Added error handling & try-catch | Prevents 500 errors; graceful fallbacks |
| `.env.production` | Created new file | Production-specific environment config |
| `.env.local.example` | Updated with guidance | Better documentation for developers |

---

## Next Steps (Post-Deployment)

1. ✅ Monitor Vercel deployment logs for errors
2. ✅ Test all user roles (admin, manager, agent) redirects
3. ✅ Test unauthenticated access (should go to `/login`)
4. ✅ Verify email authentication flows work with correct `NEXT_PUBLIC_APP_URL`
5. ⚠️ Consider removing `typescript: { ignoreBuildErrors: true }` once bugs are fixed

---

## Questions?

Check these files for implementation details:
- `lib/supabase-server.ts` - Server-side Supabase client
- `lib/supabase-admin.ts` - Admin client for RLS bypass
- `types/database.ts` - Database type definitions
