# Route Sales Management - Authentication System Setup Guide

## Overview

This document outlines the production-grade authentication system built for the Route Sales Management System using Next.js 16, React Hook Form, Zod, and Supabase.

## Architecture

### Frontend Components

#### Login Page (`/app/login/page.tsx`)
- Email and password input fields with real-time validation
- Password visibility toggle (eye icon)
- "Remember me" checkbox for 30-day persistence
- "Forgot password" link (ready for implementation)
- Error states:
  - Invalid credentials error
  - Pending approval error (account awaiting admin review)
- Redirect logic (commented) for role-based navigation:
  - Admin → `/admin/dashboard`
  - Manager → `/manager/dashboard`
  - Agent → `/agent/dashboard`
- Loading state with spinner during submission
- Clean, responsive card layout

#### Signup Page (`/app/signup/page.tsx`)
- Multi-step signup flow with pending approval screen
- Form fields:
  - Full Name (2+ characters)
  - Email Address (valid email format)
  - Phone Number (international format validation)
  - Password (8+ chars, 1+ uppercase, 1+ number)
  - Confirm Password (must match)
- Real-time validation feedback
- Pending Approval Screen:
  - Displays after successful signup
  - Shows submitted email address
  - Explains admin review process (1-2 business days)
  - Logout button to return to login
- Loading states for form submission

### Validation Schemas (`/lib/auth-schemas.ts`)

Using Zod for type-safe runtime validation:

```typescript
// Login validation
- Email: Required, valid email format
- Password: Required, minimum 8 characters
- Remember Me: Boolean flag (optional)

// Signup validation
- Full Name: Required, 2+ characters
- Email: Required, valid email format
- Phone: Required, international phone format
- Password: Required, 8+ chars, 1+ uppercase, 1+ digit
- Confirm Password: Must match password field
```

## Design System

### Color Palette
- **Primary**: Deep Purple (`oklch(0.45 0.3 273)`) - Brand accent
- **Accent**: Cyan Blue (`oklch(0.5 0.28 200)`) - Secondary accent
- **Background**: Dark/Light modes with semantic tokens
- **Foreground**: High contrast text for accessibility
- **Destructive**: Red (`oklch(0.58 0.24 27)`) - Error states

### Typography
- **Font**: Geist (sans-serif) for all text
- **Hierarchy**: Clear heading/body distinction
- **Line Height**: 1.4-1.6 for optimal readability

### Components Used
- shadcn/ui Card - Container
- shadcn/ui Form - Form handling
- shadcn/ui Input - Text fields
- shadcn/ui Button - Actions
- shadcn/ui Checkbox - Remember me
- shadcn/ui Alert - Error messages
- Lucide React - Icons (LogIn, UserPlus, CheckCircle2, Eye, EyeOff)
- Custom Spinner - Loading state

## Dark/Light Mode

The application includes automatic dark/light mode support:
- Theme toggle button in top-right corner
- Persists user preference
- Respects system preference by default
- Uses next-themes for seamless transitions

## Mobile Responsive Design

- **Mobile (375px)**: Full-width card with optimized padding
- **Desktop (1280px+)**: Centered card with fixed max-width
- All form fields are touch-friendly with adequate spacing
- Text is readable on all screen sizes

## Implementation TODOs

The authentication system includes TODO comments for Supabase integration:

### Login Flow
1. Create Supabase project and enable authentication
2. Implement `signInWithPassword()` in the submit handler
3. Fetch user profile to get role and approval_status
4. Handle "pending approval" state
5. Implement "Remember me" with secure HTTP-only cookies
6. Redirect based on user role

### Signup Flow
1. Implement `signUp()` to create auth user
2. Create user profile in database with pending status
3. Store additional fields (full_name, phone)
4. Set default role to 'agent' (admin approves/assigns)
5. Optional: Send verification email

### Password Reset
1. Create `/forgot-password` page
2. Implement password reset request flow
3. Create password reset confirmation page
4. Update password with secure token validation

## Security Considerations

1. **Password Storage**: Use Supabase's built-in bcrypt hashing
2. **Session Management**: Use HTTP-only cookies (secure by default)
3. **Input Validation**: Client-side Zod validation + server-side validation
4. **CORS**: Configure Supabase with proper origin settings
5. **Rate Limiting**: Consider Supabase's built-in protections
6. **SQL Injection**: Use Supabase parameterized queries
7. **Approval Workflow**: Admin must explicitly approve new users

## Database Schema Required

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  role TEXT DEFAULT 'agent' ('admin', 'manager', 'agent'),
  approval_status TEXT DEFAULT 'pending' ('pending', 'approved', 'rejected'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
```

## Testing the System

### Login Page Tests
1. Submit empty form → Shows validation errors
2. Enter invalid email → Shows email validation error
3. Enter short password → Shows password requirement error
4. Toggle password visibility → Shows/hides password
5. Check "Remember me" → Persists preference
6. Click "Forgot password" → Navigates to reset flow
7. Click "Create Account" → Navigates to signup
8. Valid credentials → Redirects to role-specific dashboard

### Signup Page Tests
1. Submit empty form → Shows validation errors for all fields
2. Enter mismatched passwords → Shows error message
3. Invalid phone format → Shows phone validation error
4. Valid submission → Shows pending approval screen
5. Pending screen shows correct email → Confirms data was saved
6. Click "Back to Login" → Returns to login page
7. Mobile view → Form remains usable and properly sized

### Theme Toggle Tests
1. Click theme button (top-right) → Switches between dark/light
2. Preference persists on reload
3. All text remains readable in both modes
4. Button colors maintain contrast in both modes

## File Structure

```
app/
├── layout.tsx                 # Root layout with theme provider
├── globals.css               # Global styles with color tokens
├── login/
│   └── page.tsx             # Login page
├── signup/
│   └── page.tsx             # Signup page
└── forgot-password/
    └── page.tsx             # (TODO) Password reset page

components/
├── theme-provider.tsx        # Next-themes wrapper
├── theme-toggle.tsx          # Dark/light toggle button
└── ui/                       # shadcn components

lib/
└── auth-schemas.ts          # Zod validation schemas

public/
└── icon-*.png               # Favicon variants
```

## Next Steps

1. **Connect Supabase**: Set up project and get API credentials
2. **Implement Auth Functions**: Replace TODO comments with actual calls
3. **Create Dashboard Pages**: Build the role-specific dashboards
4. **Add Admin Panel**: Create approval management interface
5. **Setup Audit Logging**: Log all authentication events
6. **Email Integration**: Configure transactional emails for:
   - Approval notifications
   - Password resets
   - Security alerts

## Deployment

1. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to environment variables
2. Configure authentication in Supabase dashboard
3. Set up email templates for notifications
4. Enable HTTPS in production
5. Configure CORS origins in Supabase
6. Test the complete flow before going live

## Support

Refer to the specification document provided with this project for the complete system architecture and additional features beyond authentication.
