# Signup Flow Bugfix Design

## Overview

This bugfix addresses two related issues in the signup and user approval flow:

1. **Signup Flow Issue**: The signup API returns "Failed to create user account - no user returned" when email confirmation is disabled in Supabase settings. The fix involves extracting the user ID from alternative sources in the auth response when `authData?.user` is undefined.

2. **Email Confirmation Issue**: After admin approval, users cannot log in because the signup API uses `adminClient.auth.admin.updateUserById(userId, { email_confirm: true })` which only updates the database record but doesn't actually confirm the email at the authentication level. The fix should use `email_confirmed_at: new Date().toISOString()` to properly confirm the email.

## Glossary

- **Bug_Condition_1 (C1)**: The condition where `supabase.auth.signUp()` returns a response where `authData?.user` is undefined despite successful user creation (email confirmation disabled scenario)
- **Bug_Condition_2 (C2)**: The condition where `adminClient.auth.admin.updateUserById()` is called with `email_confirm: true` instead of `email_confirmed_at: new Date().toISOString()` (admin approval scenario)
- **Property_1 (P1)**: The expected behavior where the system extracts the user ID from the auth response and continues with profile creation when email confirmation is disabled
- **Property_2 (P2)**: The expected behavior where the system sets `email_confirmed_at` to a timestamp to actually confirm the email at the authentication level
- **Preservation**: Existing behavior for email confirmation enabled, error handling, and admin approval that must remain unchanged
- **supabase.auth.signUp()**: The Supabase authentication method that creates a new user account
- **adminClient.auth.admin.updateUserById()**: The Supabase admin method to update user properties
- **users table**: The database table storing user profiles with role and status fields
- **email_confirmed_at**: The Supabase auth field that actually confirms the email at the authentication level

## Bug Details

### Bug Condition 1: Email Confirmation Disabled Handling

The bug manifests when `supabase.auth.signUp()` is called and email confirmation is disabled in Supabase settings. The function creates the auth user but does not return the user object in the response, causing `authData?.user` to be undefined. This occurs because Supabase's `signUp()` method only returns the user object when email confirmation is enabled or when the email is automatically confirmed.

**Formal Specification:**
```
FUNCTION isBugCondition1(authResponse)
  INPUT: authResponse of type AuthResponse
  OUTPUT: boolean
  
  RETURN authResponse.data.user IS NULL
         AND authResponse.data.userId IS NOT NULL
         AND authResponse.error IS NULL
END FUNCTION
```

### Bug Condition 2: Email Confirmation Not Set at Auth Level

The bug manifests when admin approves a user by calling `adminClient.auth.admin.updateUserById(userId, { email_confirm: true })`. This only updates the database record but doesn't actually confirm the email at the authentication level. Supabase requires `email_confirmed_at` to be set to a timestamp to actually confirm the email.

**Formal Specification:**
```
FUNCTION isBugCondition2(userUpdateParams)
  INPUT: userUpdateParams of type UserUpdateParams
  OUTPUT: boolean
  
  RETURN userUpdateParams.email_confirm = true
         AND userUpdateParams.email_confirmed_at IS NULL
END FUNCTION
```

### Examples

- **Example 1**: User signs up with email confirmation disabled
  - Expected: User object returned in auth response
  - Actual: `{ hasUser: false, userId: undefined, error: null, errorStatus: undefined }`
  - Root cause: Email confirmation disabled in Supabase settings
  - Bug Condition: isBugCondition1 returns true

- **Example 2**: Admin approves user with email_confirm: true
  - Expected: Email confirmed at authentication level
  - Actual: Email not confirmed, user gets "Email not confirmed" error on login
  - Root cause: `email_confirmed_at` not set to timestamp
  - Bug Condition: isBugCondition2 returns true

- **Example 3**: User signs up with email confirmation enabled
  - Expected: User object returned in auth response
  - Actual: User object returned successfully
  - This case works correctly and should be preserved

- **Example 4**: User signs up with invalid email
  - Expected: Error returned from signUp()
  - Actual: Error returned (e.g., "Invalid email address")
  - This case works correctly and should be preserved

- **Example 5**: User signs up with existing email
  - Expected: Error returned from signUp()
  - Actual: Error returned (e.g., "User already registered")
  - This case works correctly and should be preserved

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- When email confirmation is enabled in Supabase settings, the system shall continue to return the user object in the auth response
- When a user profile is created with `status: 'pending'`, the system shall continue to allow login after admin approval
- When an admin rejects or suspends a user account, the system shall continue to prevent login with status-based error messages
- When a user tries to sign up with an email that already exists, the system shall continue to return an appropriate error message
- When a user signs up with invalid credentials, the system shall continue to return an appropriate error message

**Scope:**
All inputs that do NOT involve the email confirmation disabled scenario or the admin approval email confirmation scenario should be completely unaffected by this fix. This includes:
- Valid signups with email confirmation enabled
- Invalid email addresses
- Duplicate email addresses
- Password validation failures
- Other error scenarios

## Hypothesized Root Cause

Based on the bug description and code analysis, the most likely issues are:

1. **Email Confirmation Disabled (Bug Condition 1)**: Supabase's `signUp()` method only returns the user object when email confirmation is enabled
   - When email confirmation is disabled, the user is created but not returned in the response
   - The `authData?.user` check fails because the user object is not in the response
   - The `userId` field may still be available in the auth response

2. **Incorrect Email Confirmation Method (Bug Condition 2)**: The signup API uses `adminClient.auth.admin.updateUserById(userId, { email_confirm: true })` which only updates the database record
   - This does NOT actually confirm the email at the authentication level
   - Supabase requires `email_confirmed_at` to be set to a timestamp to actually confirm the email
   - When admin approves the user, the email is still not confirmed at the auth level

3. **Incorrect User ID Extraction**: The code relies solely on `authData?.user?.id` to get the user ID
   - When `authData?.user` is undefined, the code cannot extract the user ID
   - Alternative methods to get the user ID should be considered

4. **Timing Issue**: The user profile creation happens after the user object check
   - The code checks for `authData?.user` before attempting to confirm email
   - Even if email confirmation is done afterward, the damage is already done

5. **Supabase Configuration**: The Supabase project settings may have email confirmation disabled
   - This causes the `signUp()` method to behave differently
   - The user is created but not returned in the response

## Correctness Properties

Property 1: Bug Condition - Email Confirmation Disabled Handling

_For any_ signup request where email confirmation is disabled in Supabase settings, the fixed signup API SHALL extract the user ID from the auth response (using alternative methods if `authData?.user` is undefined), create the user profile with `status: 'pending'`, and return a success response to the frontend.

**Validates: Requirements 2.1, 2.2, 2.3**

Property 2: Preservation - Email Confirmation Enabled Behavior

_For any_ signup request where email confirmation is enabled in Supabase settings, the fixed signup API SHALL produce the same result as the original function, preserving the existing behavior of returning the user object in the auth response.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

## Fix Implementation

### Changes Required

**File**: `app/api/auth/signup/route.ts`

**Function**: `POST` handler

**Specific Changes**:
1. **Extract User ID from Auth Response**: Add logic to extract user ID from alternative sources when `authData?.user` is undefined
   - Check if `authData.user?.id` is available
   - If not, check if the error response contains user information
   - If still not available, attempt to create the user profile and return success

2. **Handle Email Confirmation Disabled Scenario**: Modify the user object check to handle cases where the user is created but not returned
   - When `authData?.user` is undefined but no error occurred, attempt to retrieve the user using the email
   - Use `adminClient.auth.admin.getUserByEmail()` to get the user object

3. **Update User Profile Creation**: Ensure user profile creation continues even when user object is not immediately available
   - Move the user profile creation logic to execute regardless of user object availability
   - Use the email from the signup request to create the user profile

4. **Add Logging**: Add additional logging to track when email confirmation is disabled
   - Log when `authData?.user` is undefined
   - Log the alternative method used to extract user ID

5. **Test the Fix**: Verify the fix works for both email confirmation enabled and disabled scenarios
   - Test with email confirmation enabled (existing behavior)
   - Test with email confirmation disabled (new behavior)

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, write tests that demonstrate the bug exists on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Write tests that simulate signup requests with email confirmation disabled and assert that the API returns a success response with user profile created. Run these tests on the UNFIXED code to observe failures and understand the root cause.

**Test Cases**:
1. **Email Confirmation Disabled Test**: Simulate signup with email confirmation disabled and assert that the API returns a 400 error (will fail on unfixed code)
2. **Email Confirmation Enabled Test**: Simulate signup with email confirmation enabled and assert that the API returns a success response (should pass on unfixed code)
3. **Duplicate Email Test**: Simulate signup with existing email and assert that the API returns an error (should pass on unfixed code)
4. **Invalid Email Test**: Simulate signup with invalid email and assert that the API returns an error (should pass on unfixed code)

**Expected Counterexamples**:
- API returns 400 error "Failed to create user account - no user returned" when email confirmation is disabled
- User profile is not created when email confirmation is disabled
- Possible causes: `authData?.user` check fails, no alternative user ID extraction method

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode**:
```
FOR ALL signupRequest WHERE isBugCondition(signupRequest) DO
  result := signupAPI_fixed(signupRequest)
  ASSERT result.status = 200
  ASSERT result.data.userId IS NOT NULL
  ASSERT result.data.status = 'pending'
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same result as the original function.

**Pseudocode**:
```
FOR ALL signupRequest WHERE NOT isBugCondition(signupRequest) DO
  ASSERT signupAPI_original(signupRequest) = signupAPI_fixed(signupRequest)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all non-buggy inputs

**Test Plan**: Observe behavior on UNFIXED code first for email confirmation enabled and error scenarios, then write property-based tests capturing that behavior.

**Test Cases**:
1. **Email Confirmation Enabled Preservation**: Verify signup with email confirmation enabled returns user object
2. **Duplicate Email Preservation**: Verify duplicate email signup returns appropriate error
3. **Invalid Email Preservation**: Verify invalid email signup returns appropriate error
4. **Password Validation Preservation**: Verify password validation continues to work correctly

### Unit Tests

- Test signup with email confirmation disabled
- Test signup with email confirmation enabled
- Test duplicate email handling
- Test invalid email handling
- Test password validation

### Property-Based Tests

- Generate random valid signup requests and verify success response
- Generate random invalid signup requests and verify error responses
- Test that email confirmation enabled behavior is preserved across many scenarios

### Integration Tests

- Test full signup flow with email confirmation disabled
- Test full signup flow with email confirmation enabled
- Test user can log in after admin approval
- Test user cannot log in with pending status
- Test user cannot log in with rejected/suspended status
