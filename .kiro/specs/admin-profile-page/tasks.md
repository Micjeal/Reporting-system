# Implementation Plan: Admin Profile Page

## Overview

This implementation plan breaks down the admin profile page feature into discrete, actionable tasks. The feature will create a new profile page at `/admin/profile` that allows administrators to view and edit their profile information, similar to the existing agent profile page but adapted for admin users.

The implementation follows a layered approach:
1. Create the admin service layer for API interactions
2. Extend the existing API route to support profile updates
3. Build the admin profile page component with display and edit modes
4. Integrate avatar display, form validation, and session management

All tasks build incrementally, with each step validating functionality before moving forward.

## Tasks

- [ ] 1. Set up admin service layer
  - [ ] 1.1 Create admin service module with API functions
    - Create `services/admin.service.ts` file
    - Implement `getCurrentAdmin()` function to fetch current admin user data from `/api/users/me`
    - Implement `updateCurrentAdmin(updates)` function to update admin profile via PATCH `/api/users/me`
    - Add proper TypeScript types for `AdminUser` and `AdminProfileUpdate`
    - Handle API errors and return appropriate error messages
    - _Requirements: 9.1, 9.3_

- [ ] 2. Extend API route for profile updates
  - [ ] 2.1 Add PATCH handler to /api/users/me route
    - Open or create `app/api/users/me/route.ts`
    - Implement PATCH handler that accepts `name` and `phone` in request body
    - Validate request body using Zod schema (name min 2 chars, phone optional)
    - Extract authenticated user ID from session/auth context
    - Update user record in Supabase users table
    - Return updated user data in response
    - Handle validation errors and database errors with appropriate status codes
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 4.6, 4.7_

- [ ] 3. Checkpoint - Verify service and API layers
  - Test that `getCurrentAdmin()` successfully fetches admin user data
  - Test that `updateCurrentAdmin()` successfully updates profile
  - Test that PATCH `/api/users/me` validates input correctly
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Create admin profile page component structure
  - [ ] 4.1 Create admin profile page file and basic layout
    - Create `app/admin/profile/page.tsx` file
    - Set up 'use client' directive for client-side interactivity
    - Import necessary dependencies (React hooks, router, icons, UI components)
    - Define `AdminUser` interface matching the service types
    - Set up component state: `user`, `loading`, `isEditing`, `submitting`, `isLoggingOut`
    - Implement `useEffect` to fetch profile data on mount using `adminService.getCurrentAdmin()`
    - Create loading state UI with spinner and "Loading your profile..." message
    - Create error state UI for when profile fails to load with retry button
    - _Requirements: 1.1, 1.4, 7.1, 7.2_

  - [ ] 4.2 Implement profile display mode
    - Create main layout grid with left column (avatar/snapshot) and right column (detailed info)
    - Add page header with "Account Settings" title and description
    - Build left column card with avatar placeholder (User icon), admin name, role badge, and account status
    - Display "Administrator" role with Shield icon
    - Display account creation date formatted as human-readable string
    - Build right column "Personal Information" card showing name, email, phone in display mode
    - Show "—" or "Not set" for empty optional fields (phone)
    - Add "System Information" card displaying user ID and account metadata
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 2.5_

- [ ] 5. Implement avatar component with DiceBear API
  - [ ] 5.1 Add DiceBear avatar integration
    - Replace User icon placeholder with `<img>` element in left column card
    - Set `src` to `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`
    - Set dimensions to 96px x 96px (h-24 w-24) with rounded-full styling
    - Add `alt` attribute with user name for accessibility
    - Implement `onError` handler to show fallback User icon if DiceBear API fails
    - Add proper styling with border and shadow to match design
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 6. Implement profile editing functionality
  - [ ] 6.1 Set up React Hook Form with validation
    - Define Zod schema `profileSchema` with name (min 2 chars) and phone (optional) validation
    - Create TypeScript type `ProfileFormData` from schema
    - Initialize `useForm` with zodResolver and default values
    - Reset form values when profile data loads
    - _Requirements: 4.6, 4.7_

  - [ ] 6.2 Build edit mode UI and form controls
    - Add "Edit" button to Personal Information card header
    - Implement click handler to set `isEditing` to true
    - Create form using shadcn Form components with FormField, FormItem, FormLabel, FormControl
    - Add Input fields for name (required) and phone (optional)
    - Display email and role as read-only text in edit mode (not editable)
    - Add "Save Changes" button with Save icon and loading spinner
    - Add "Cancel" button to exit edit mode
    - Disable Save button while `submitting` is true
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.8, 4.9, 4.10_

  - [ ] 6.3 Implement form submission and cancel handlers
    - Create `handleSubmit` function that calls `adminService.updateCurrentAdmin(data)`
    - Set `submitting` to true during API call
    - On success: update user state, exit edit mode, show success toast
    - On error: show error toast with message, keep form in edit mode with user's values
    - Create `handleCancel` function that resets form to original values and exits edit mode
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

- [ ] 7. Implement session management and logout
  - [ ] 7.1 Add logout functionality
    - Create "Account Actions" card in danger zone styling (destructive colors)
    - Add "Sign Out" button with LogOut icon
    - Implement `handleLogout` function that calls `authService.logout()`
    - Set `isLoggingOut` to true during logout process
    - Disable logout button while `isLoggingOut` is true
    - Show loading spinner in button during logout
    - On success: show success toast and redirect to `/login` using router.push
    - On error: show error toast with descriptive message
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

- [ ] 8. Add loading states and user feedback
  - [ ] 8.1 Implement toast notifications and loading indicators
    - Import and use `useToast` hook from shadcn/ui
    - Add toast notification for successful profile update
    - Add toast notification for profile update errors
    - Add toast notification for successful logout
    - Add toast notification for logout errors
    - Add toast notification for profile load errors
    - Ensure loading spinner shows in Save button during submission
    - Ensure loading spinner shows in Sign Out button during logout
    - _Requirements: 7.3, 7.4, 5.2, 5.5, 6.3, 6.6_

- [ ] 9. Checkpoint - Test complete profile page functionality
  - Verify profile page loads and displays admin data correctly
  - Test edit mode toggles correctly
  - Test form validation for name and phone fields
  - Test profile update saves and displays updated data
  - Test cancel button restores original values
  - Test logout redirects to login page
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Implement responsive design and accessibility
  - [ ] 10.1 Add responsive layout and accessibility features
    - Ensure grid layout adapts to mobile (single column), tablet, and desktop (two columns)
    - Use Tailwind responsive classes (sm:, lg:) for breakpoints
    - Add proper ARIA labels to form inputs using FormLabel components
    - Ensure all interactive elements (buttons, inputs) are keyboard accessible
    - Add focus indicators to form fields and buttons
    - Verify color contrast meets WCAG standards using existing shadcn/ui theme
    - Test tab order is logical (avatar → edit button → form fields → save/cancel → logout)
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [ ] 11. Add authentication and authorization guards
  - [ ] 11.1 Implement route protection
    - Verify that admin layout already includes authentication middleware
    - Add role check to ensure only admin users can access `/admin/profile`
    - Handle unauthenticated users by redirecting to `/login`
    - Handle non-admin users by showing error or redirecting to appropriate dashboard
    - Test that agent users cannot access admin profile page
    - _Requirements: 1.2, 1.3, 9.4_

- [ ] 12. Final integration and testing
  - [ ] 12.1 End-to-end integration verification
    - Test complete flow: login as admin → navigate to profile → view data → edit → save → logout
    - Test error scenarios: network failure, validation errors, API errors
    - Verify avatar displays correctly with DiceBear API
    - Verify avatar fallback works when DiceBear fails
    - Test responsive behavior on mobile, tablet, and desktop viewports
    - Verify all toast notifications appear correctly
    - Ensure no console errors or warnings
    - _Requirements: All requirements_

- [ ] 13. Final checkpoint - Complete feature validation
  - Ensure all acceptance criteria are met
  - Verify integration with existing auth and admin services
  - Confirm responsive design works across devices
  - Validate accessibility with keyboard navigation and screen reader
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- This feature mirrors the existing agent profile page (`app/agent/profile/page.tsx`) but adapts it for admin users
- The implementation reuses existing services (`authService`) and creates a new `adminService` for admin-specific operations
- All UI components use shadcn/ui library for consistency with the rest of the application
- The PATCH `/api/users/me` endpoint is designed to work for both admin and agent users by using the authenticated user's ID
- Email and role fields are intentionally read-only to prevent unauthorized privilege escalation
- The DiceBear API provides consistent avatar generation using the user ID as a seed
- Loading states and error handling provide clear feedback for all asynchronous operations
- The feature follows Next.js 14+ App Router patterns with 'use client' directive for client-side interactivity

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2.1"] },
    { "id": 2, "tasks": ["4.1"] },
    { "id": 3, "tasks": ["4.2", "5.1", "6.1"] },
    { "id": 4, "tasks": ["6.2", "7.1"] },
    { "id": 5, "tasks": ["6.3", "8.1"] },
    { "id": 6, "tasks": ["10.1", "11.1"] },
    { "id": 7, "tasks": ["12.1"] }
  ]
}
```
