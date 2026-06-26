# Implementation Plan

## Overview

This bugfix addresses the signup flow issue where users see an error "Failed to create user account - no user returned" instead of being redirected to the "wait for admin approval" page.

## Tasks

- [ ] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Email Confirmation Disabled Handling
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: For deterministic bugs, scope the property to the concrete failing case(s) to ensure reproducibility
  - Test implementation details from Bug Condition in design
  - The test assertions should match the Expected Behavior Properties from design
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found to understand root cause
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Email Confirmation Enabled Behavior
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for non-buggy inputs
  - Write property-based tests capturing observed behavior patterns from Preservation Requirements
  - Property-based testing generates many test cases for stronger guarantees
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 3. Fix for signup flow - email confirmation disabled handling

  - [ ] 3.1 Implement the fix
    - Add logic to extract user ID from auth response when `authData?.user` is undefined
    - Use `adminClient.auth.admin.getUserByEmail()` to retrieve user object when needed
    - Update user profile creation to continue regardless of user object availability
    - Add logging to track when email confirmation is disabled
    - _Bug_Condition: isBugCondition(authResponse) where authResponse.data.user IS NULL AND authResponse.data.userId IS NOT NULL AND authResponse.error IS NULL_
    - _Expected_Behavior: expectedBehavior(result) from design - extract user ID and create profile_
    - _Preservation: Preservation Requirements from design - preserve email confirmation enabled behavior_
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4_

  - [ ] 3.2 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Email Confirmation Disabled Handling
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [ ] 3.3 Verify preservation tests still pass
    - **Property 2: Preservation** - Email Confirmation Enabled Behavior
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all tests still pass after fix (no regressions)

- [ ] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Task Dependency Graph

```json
{
  "tasks": [
    {
      "id": "1",
      "dependsOn": [],
      "waves": [1]
    },
    {
      "id": "2",
      "dependsOn": [],
      "waves": [1]
    },
    {
      "id": "3",
      "dependsOn": ["1", "2"],
      "waves": [2]
    },
    {
      "id": "4",
      "dependsOn": ["3"],
      "waves": [3]
    }
  ],
  "waves": [
    {
      "id": 1,
      "tasks": ["1", "2"]
    },
    {
      "id": 2,
      "tasks": ["3"]
    },
    {
      "id": 3,
      "tasks": ["4"]
    }
  ]
}
```

## Notes

- The root cause is that when email confirmation is disabled in Supabase, the `signUp()` method creates the user but doesn't return the user object in the response
- The fix involves extracting the user ID from alternative sources and continuing with profile creation
- All tests should pass before marking this bugfix complete
