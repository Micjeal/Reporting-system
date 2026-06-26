# Bugfix Requirements Document

## Introduction

This bugfix addresses two related issues in the signup and user approval flow:

1. **Signup Flow Issue**: The signup API returns "Failed to create user account - no user returned" when email confirmation is disabled in Supabase settings, even though the user is successfully created.

2. **Email Confirmation Issue**: After admin approval, users cannot log in because they get the error "Email not confirmed". The signup API uses `adminClient.auth.admin.updateUserById(userId, { email_confirm: true })` which only updates the database record but doesn't actually confirm the email at the authentication level. Supabase requires `email_confirmed_at` to be set to a timestamp to actually confirm the email.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a user submits the signup form with valid credentials AND email confirmation is disabled in Supabase settings THEN the system calls `supabase.auth.signUp()` and receives a response where `authData?.user` is undefined

1.2 WHEN `authData?.user` is undefined after calling `supabase.auth.signUp()` THEN the system returns a 400 error "Failed to create user account - no user returned"

1.3 WHEN a user signs up successfully and admin approves the user (changes status to 'active' in the database) THEN the system uses `adminClient.auth.admin.updateUserById(userId, { email_confirm: true })` which only updates the database record

1.4 WHEN `adminClient.auth.admin.updateUserById()` is called with `email_confirm: true` THEN the system does NOT actually confirm the email at the authentication level

1.5 WHEN a user tries to log in after admin approval THEN the system returns "Email not confirmed" error

1.6 WHEN the user cannot access their account even though admin approved it THEN the system does not set `email_confirmed_at` to a timestamp

### Expected Behavior (Correct)

2.1 WHEN a user submits the signup form with valid credentials AND email confirmation is disabled in Supabase settings THEN the system SHOULD extract the user ID from the auth response and continue with profile creation

2.2 WHEN the user profile is created with `status: 'pending'` THEN the system SHOULD return a success response to the frontend

2.3 WHEN a user signs up successfully and admin approves the user THEN the system SHOULD set `email_confirmed_at: new Date().toISOString()` to actually confirm the email at the authentication level

2.4 WHEN email is properly confirmed at the authentication level THEN the user SHOULD be able to log in immediately after admin approval

2.5 WHEN the signup API returns success THEN the signup page SHOULD display the "Account Created! Pending Approval" screen

### Unchanged Behavior (Regression Prevention)

3.1 WHEN email confirmation is enabled in Supabase settings THEN the system SHALL CONTINUE TO return the user object in the auth response

3.2 WHEN a user profile is created with `status: 'pending'` THEN the system SHALL CONTINUE TO allow the user to log in after admin approval

3.3 WHEN an admin rejects or suspends a user account THEN the system SHALL CONTINUE TO prevent login with status-based error messages

3.4 WHEN a user tries to sign up with an email that already exists THEN the system SHALL CONTINUE TO return an appropriate error message

3.5 WHEN a user signs up with invalid credentials THEN the system SHALL CONTINUE TO return an appropriate error message
