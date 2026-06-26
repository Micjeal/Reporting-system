# Password Change API Testing Guide

## Endpoint
`POST /api/settings/password`

## Requirements Implemented
- **5.5**: Verify current password is correct
- **5.6**: Display error if current password is incorrect
- **5.7**: Validate new password strength (min 8 chars, uppercase, lowercase, number)
- **5.8**: Update password and display success notification

## Authentication
- Requires authenticated user session
- Returns 401 if not authenticated

## Request Body
```json
{
  "currentPassword": "string (required)",
  "newPassword": "string (min 8 chars, must contain uppercase, lowercase, and number)"
}
```

## Response Codes

### Success (200)
```json
{
  "data": {
    "success": true,
    "message": "Password updated successfully"
  },
  "error": null
}
```

### Validation Error (400)
```json
{
  "data": null,
  "error": "Password must be at least 8 characters"
}
```

### Incorrect Current Password (403)
```json
{
  "data": null,
  "error": "Current password is incorrect"
}
```

### Unauthorized (401)
```json
{
  "data": null,
  "error": "Unauthorized"
}
```

## Manual Testing Steps

### Test 1: Successful Password Change
1. Log in as an admin user
2. Send POST request to `/api/settings/password`:
   ```json
   {
     "currentPassword": "YourCurrentPassword123",
     "newPassword": "NewSecurePass123"
   }
   ```
3. Expected: 200 response with success message
4. Verify: Can log in with new password

### Test 2: Incorrect Current Password
1. Log in as an admin user
2. Send POST request with wrong current password:
   ```json
   {
     "currentPassword": "WrongPassword123",
     "newPassword": "NewSecurePass123"
   }
   ```
3. Expected: 403 response with "Current password is incorrect"

### Test 3: Weak New Password (Too Short)
1. Log in as an admin user
2. Send POST request with short password:
   ```json
   {
     "currentPassword": "YourCurrentPassword123",
     "newPassword": "Pass1"
   }
   ```
3. Expected: 400 response with "Password must be at least 8 characters"

### Test 4: Weak New Password (No Uppercase)
1. Log in as an admin user
2. Send POST request without uppercase:
   ```json
   {
     "currentPassword": "YourCurrentPassword123",
     "newPassword": "newpass123"
   }
   ```
3. Expected: 400 response with "Password must contain at least one uppercase letter"

### Test 5: Weak New Password (No Lowercase)
1. Log in as an admin user
2. Send POST request without lowercase:
   ```json
   {
     "currentPassword": "YourCurrentPassword123",
     "newPassword": "NEWPASS123"
   }
   ```
3. Expected: 400 response with "Password must contain at least one lowercase letter"

### Test 6: Weak New Password (No Number)
1. Log in as an admin user
2. Send POST request without number:
   ```json
   {
     "currentPassword": "YourCurrentPassword123",
     "newPassword": "NewPassword"
   }
   ```
3. Expected: 400 response with "Password must contain at least one number"

### Test 7: Unauthenticated Request
1. Log out or use no session
2. Send POST request to `/api/settings/password`
3. Expected: 401 response with "Unauthorized"

## Security Features

1. **Current Password Verification**: Always verifies current password before allowing change
2. **Password Strength Validation**: Enforces minimum 8 characters with complexity requirements
3. **Audit Logging**: Logs all password changes for security monitoring
4. **Secure Transmission**: Uses HTTPS (in production)
5. **Session-Based Auth**: Uses Supabase session authentication

## Unit Tests

Run unit tests with:
```bash
npm test app/api/settings/password/route.test.ts
```

All 15 tests should pass:
- ✓ Valid password acceptance (5 tests)
- ✓ Current password validation (1 test)
- ✓ Length requirement validation (2 tests)
- ✓ Uppercase requirement validation (1 test)
- ✓ Lowercase requirement validation (1 test)
- ✓ Number requirement validation (1 test)
- ✓ Multiple requirements validation (2 tests)
- ✓ Edge cases (2 tests)

## Integration with Frontend

The frontend password change form should:
1. Collect current password, new password, and confirmation
2. Validate password confirmation matches new password (client-side)
3. Call this API endpoint with currentPassword and newPassword
4. Display success toast on 200 response
5. Display error message on 400/403 response
6. Handle 401 by redirecting to login

## Audit Trail

Every successful password change creates an audit log entry:
- **Action**: `auth.password_changed`
- **Actor**: User ID who changed the password
- **Target Table**: `users`
- **Target ID**: User ID
- **Details**: Timestamp of change

Check audit logs with:
```sql
SELECT * FROM audit_logs 
WHERE action = 'auth.password_changed' 
ORDER BY created_at DESC;
```
