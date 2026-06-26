# Login 404 Error Fix

## Issue

Login failing with 404 error:
```
POST /api/auth/login 404
Error: Failed to parse response: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
```

The API is returning HTML (Next.js 404 page) instead of JSON, indicating the route isn't being found.

## Root Cause

The `/api/auth/login/route.ts` file exists and is correctly implemented, but Next.js is not recognizing it. This typically happens due to:

1. **Build cache issues** - Next.js cached an old version without the route
2. **Development server not restarted** after route creation
3. **File system watcher issues** - Next.js didn't detect the file
4. **TypeScript compilation errors** preventing route registration

## Solution

### Step 1: Clear Next.js Cache

```bash
# Stop the development server (Ctrl+C)

# Delete Next.js cache
rm -rf .next

# On Windows PowerShell:
Remove-Item -Recurse -Force .next

# On Windows CMD:
rmdir /s /q .next
```

### Step 2: Restart Development Server

```bash
npm run dev
```

### Step 3: Verify Route Registration

After restarting, check the terminal output for:
```
✓ Compiled /api/auth/login in XXXms
```

### Step 4: Test Login

1. Navigate to `/login`
2. Enter credentials
3. Check browser console and network tab
4. Should see `POST /api/auth/login 200` (or 401 for invalid credentials)

## Alternative Solutions

### If Step 1-4 Don't Work:

#### Solution A: Hard Restart

```bash
# Kill all Node processes
# On Windows:
taskkill /F /IM node.exe

# On Mac/Linux:
killall node

# Clear cache and restart
rm -rf .next node_modules/.cache
npm run dev
```

#### Solution B: Check TypeScript Errors

```bash
# Run TypeScript compiler
npx tsc --noEmit

# Fix any errors in app/api/auth/login/route.ts
```

#### Solution C: Verify File Structure

Ensure the file structure is correct:
```
app/
└── api/
    └── auth/
        └── login/
            └── route.ts  ← Must be named exactly "route.ts"
```

#### Solution D: Check Next.js Config

Verify `next.config.mjs` doesn't have any route exclusions:

```javascript
// next.config.mjs should NOT exclude /api/auth/*
const nextConfig = {
  // ... your config
}
```

## Verification

After applying the fix, verify:

1. **Terminal shows route compilation**:
   ```
   ✓ Compiled /api/auth/login
   ```

2. **Network tab shows 200 or 401** (not 404):
   ```
   POST /api/auth/login 200 OK
   or
   POST /api/auth/login 401 Unauthorized
   ```

3. **Response is JSON** (not HTML):
   ```json
   {
     "data": { "userId": "...", "role": "agent", "status": "active" },
     "error": null
   }
   ```

## Common Mistakes

❌ **Don't do this**:
- Rename `route.ts` to `login.ts` or `index.ts`
- Put the route in `app/api/auth.ts` instead of `app/api/auth/login/route.ts`
- Export default function instead of named `POST` export

✅ **Do this**:
- Keep file named exactly `route.ts`
- Use correct folder structure: `app/api/auth/login/route.ts`
- Export named function: `export async function POST(req: Request)`

## Prevention

To avoid this issue in the future:

1. **Always restart dev server** after creating new API routes
2. **Clear .next folder** if routes aren't being recognized
3. **Check terminal** for compilation errors
4. **Use browser DevTools Network tab** to verify actual HTTP status codes

## Related Files

- `app/api/auth/login/route.ts` - Login API route
- `app/login/page.tsx` - Login page component
- `services/auth.service.ts` - Auth service calling the API
- `services/api-client.ts` - API client with error handling

## Date Documented

May 25, 2026

## Status

⚠️ **Action Required**: Clear Next.js cache and restart development server
