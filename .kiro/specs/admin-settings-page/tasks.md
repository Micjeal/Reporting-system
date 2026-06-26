# Implementation Plan: Admin Settings Page (MVP)

## Overview

This implementation plan creates an admin settings page at `/admin/settings` with three core MVP features: password change functionality, theme selector (light/dark/system), and notification preferences management. The implementation follows existing patterns from the admin profile page, using Next.js 16 App Router, React 19, TypeScript, Supabase for backend services, and shadcn/ui components.

The architecture is designed for future extensibility to support additional features like two-factor authentication, session management, data export, and third-party integrations without requiring major refactoring.

## Tasks

- [x] 1. Set up database schema and migrations
  - Create `user_settings` table with columns: id, user_id, theme, notification_preferences (JSONB), created_at, updated_at
  - Add unique constraint on user_id
  - Create index on user_id for fast lookups
  - Add trigger for automatic updated_at timestamp updates
  - Insert default settings for existing users
  - _Requirements: 14.1, 14.2, 14.3_

- [ ] 2. Create API routes for settings management
  - [ ] 2.1 Implement GET /api/settings route
    - Verify user authentication using middleware
    - Fetch user settings from database by user_id
    - Create default settings if none exist
    - Return settings with proper error handling
    - _Requirements: 14.1, 14.2, 14.3_

  - [ ] 2.2 Implement PATCH /api/settings route
    - Verify user authentication
    - Validate request body with Zod schema
    - Update theme and/or notification_preferences
    - Return updated settings
    - Handle validation and database errors
    - _Requirements: 3.4, 5.5, 8.4, 9.3, 9.4, 14.5_

  - [x] 2.3 Implement POST /api/settings/password route
    - Verify user authentication
    - Validate request body (currentPassword, newPassword)
    - Verify current password with Supabase Auth
    - Validate new password strength (min 8 chars, uppercase, lowercase, number)
    - Update password using Supabase Auth API
    - Return success/error response with appropriate status codes
    - _Requirements: 5.5, 5.6, 5.7, 5.8_

- [ ] 3. Create settings service layer
  - [ ] 3.1 Implement settings.service.ts
    - Create `getUserSettings()` function using api-client
    - Create `updateUserSettings()` function for theme and notifications
    - Create `updatePassword()` function for password changes
    - Add proper TypeScript interfaces for request/response types
    - Implement error transformation and handling
    - _Requirements: 14.1, 14.3, 3.4, 5.5_

- [ ] 4. Checkpoint - Verify API routes and services
  - Test GET /api/settings returns user settings or creates defaults
  - Test PATCH /api/settings updates theme and notification preferences
  - Test POST /api/settings/password validates and updates password
  - Verify authentication requirements on all routes
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Create settings page layout and navigation
  - [ ] 5.1 Create app/admin/settings/page.tsx
    - Set up client component with 'use client' directive
    - Implement route protection for admin users only
    - Create tab-based navigation using Radix UI Tabs (Security, Appearance, Notifications)
    - Add page header with title "Settings" or "Admin Settings"
    - Implement loading state with spinner during data fetch
    - Fetch user settings on mount using settings service
    - Handle error states with user-friendly messages
    - _Requirements: 1.1, 1.3, 2.1, 2.2, 2.3, 2.4, 2.5, 14.2_

  - [ ] 5.2 Update navbar dropdown to include Settings link
    - Add Settings menu item to components/admin/navbar.tsx dropdown
    - Add onClick handler to navigate to /admin/settings
    - Position Settings link between Profile and Logout
    - _Requirements: 1.1, 1.2_

- [ ] 6. Implement password change form component
  - [ ] 6.1 Create components/admin/settings/password-change-form.tsx
    - Create form with react-hook-form and Zod validation
    - Add three password inputs: current password, new password, confirm password
    - Implement password strength validation (min 8 chars, uppercase, lowercase, number)
    - Add password confirmation matching validation
    - Display inline validation errors below each field
    - Add submit button with loading state during submission
    - Show password strength indicator for new password
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 13.1, 13.2, 13.3_

  - [ ] 6.2 Integrate password change form with API
    - Call settings service updatePassword function on form submit
    - Handle current password verification errors (display error message)
    - Handle password mismatch errors
    - Display success toast notification on successful password change
    - Display error toast notification on failure
    - Reset form after successful submission
    - _Requirements: 5.5, 5.6, 5.7, 5.8_

- [ ] 7. Implement theme selector component
  - [ ] 7.1 Create components/admin/settings/theme-selector.tsx
    - Create radio group with three options: Light, Dark, System
    - Use next-themes package for theme management
    - Add visual preview icons for each theme option
    - Display current theme selection
    - Apply theme immediately on selection (no save button needed)
    - _Requirements: 9.1, 9.2, 9.3, 9.5_

  - [ ] 7.2 Integrate theme selector with persistence
    - Persist theme preference to database via settings service
    - Sync theme with localStorage using next-themes
    - Handle system theme detection for "System" option
    - Display success toast on theme change
    - _Requirements: 9.3, 9.4, 14.5_

- [ ] 8. Implement notification preferences component
  - [ ] 8.1 Create components/admin/settings/notification-preferences.tsx
    - Create three sections: Email Notifications, Push Notifications, In-App Notifications
    - Add Switch components for each notification type (Sales Alerts, Inventory Alerts, User Approvals, System Updates)
    - Display descriptive labels and helper text for each toggle
    - Note: System Updates only available for email and in-app (not push)
    - Implement local state management for toggle changes
    - _Requirements: 8.1, 8.2, 8.3_

  - [ ] 8.2 Integrate notification preferences with API
    - Add Save button to persist changes
    - Call settings service updateUserSettings on save
    - Display success toast notification on save
    - Display error toast on failure
    - Update local state to reflect saved preferences
    - _Requirements: 8.4, 8.5, 14.5_

- [ ] 9. Checkpoint - Test core functionality
  - Verify password change works with correct current password
  - Verify password change fails with incorrect current password
  - Verify theme selector applies theme immediately
  - Verify notification preferences save correctly
  - Verify all form validations work as expected
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Implement responsive design and accessibility
  - [ ] 10.1 Add responsive layout for mobile, tablet, and desktop
    - Ensure settings page works on mobile (320px+), tablet (768px+), desktop (1024px+)
    - Stack tabs vertically on mobile, use horizontal tabs on desktop
    - Ensure all forms are usable on touch devices
    - Test all components at different viewport sizes
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

  - [ ] 10.2 Implement accessibility features
    - Add proper ARIA labels to all form inputs
    - Ensure logical tab order through form fields
    - Add visible focus indicators for keyboard navigation
    - Ensure color contrast meets WCAG AA standards
    - Test with keyboard-only navigation
    - Add screen reader announcements for validation errors and success messages
    - _Requirements: 13.1_

- [ ] 11. Add error handling and loading states
  - [ ] 11.1 Implement comprehensive error handling
    - Add error boundaries for component-level errors
    - Display user-friendly error messages for API failures
    - Add retry mechanisms for transient failures
    - Log errors for debugging (client and server)
    - Handle network errors gracefully
    - _Requirements: 14.4_

  - [ ] 11.2 Add loading states throughout
    - Show spinner during initial settings fetch
    - Disable form inputs during submission
    - Show loading indicators on buttons during async operations
    - Prevent duplicate form submissions
    - _Requirements: 14.2_

- [ ] 12. Final integration and testing
  - [ ] 12.1 Integration testing
    - Test complete flow: navigate to settings → change password → switch theme → update notifications
    - Verify settings persist after page reload
    - Test error scenarios: incorrect password, network failures, validation errors
    - Verify authentication redirects work correctly
    - Test with different user roles (admin only access)
    - _Requirements: 1.3, 1.4, 14.5_

  - [ ] 12.2 Cross-browser and device testing
    - Test on Chrome, Firefox, Safari, Edge
    - Test on iOS and Android mobile devices
    - Verify responsive design works across all breakpoints
    - Test theme switching in different browsers
    - _Requirements: 15.1, 15.2, 15.3_

- [ ] 13. Final checkpoint - Complete verification
  - Verify all MVP features work end-to-end
  - Confirm all requirements are met
  - Test accessibility with keyboard and screen reader
  - Verify error handling and loading states
  - Ensure code follows existing patterns from admin profile page
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- This implementation focuses on MVP features: password change, theme selector, and notification preferences
- The architecture is designed for future extensibility (2FA, session management, data export, integrations)
- All components follow existing patterns from the admin profile page for consistency
- Uses existing dependencies: next-themes, react-hook-form, zod, @radix-ui components
- Database schema supports future features through extensible design
- All API routes include proper authentication and validation
- Responsive design ensures mobile-first approach with desktop optimization
- Accessibility is built-in from the start, not added as an afterthought
- Error handling and loading states provide excellent user experience
- Settings persist across sessions and sync with localStorage for theme

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1"] },
    { "id": 1, "tasks": ["2.1", "2.2", "2.3"] },
    { "id": 2, "tasks": ["3.1"] },
    { "id": 3, "tasks": ["5.1", "5.2"] },
    { "id": 4, "tasks": ["6.1", "7.1", "8.1"] },
    { "id": 5, "tasks": ["6.2", "7.2", "8.2"] },
    { "id": 6, "tasks": ["10.1", "10.2", "11.1", "11.2"] },
    { "id": 7, "tasks": ["12.1", "12.2"] }
  ]
}
```
