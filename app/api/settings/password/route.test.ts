import { describe, it, expect } from 'vitest';
import { z } from 'zod';

/**
 * Password change validation schema (duplicated for testing)
 * Requirements: 5.5, 5.6, 5.7, 5.8
 */
const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

describe('Password Change Schema Validation', () => {
  describe('Valid passwords', () => {
    it('should accept a valid password with all requirements', () => {
      const validData = {
        currentPassword: 'OldPass123',
        newPassword: 'NewPass123',
      };
      const result = passwordChangeSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept password with exactly 8 characters', () => {
      const validData = {
        currentPassword: 'OldPass1',
        newPassword: 'NewPass1',
      };
      const result = passwordChangeSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept password with multiple uppercase letters', () => {
      const validData = {
        currentPassword: 'OldPass123',
        newPassword: 'NEWPass123',
      };
      const result = passwordChangeSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept password with multiple numbers', () => {
      const validData = {
        currentPassword: 'OldPass123',
        newPassword: 'NewPass12345',
      };
      const result = passwordChangeSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept password with special characters', () => {
      const validData = {
        currentPassword: 'OldPass123',
        newPassword: 'NewPass123!@#',
      };
      const result = passwordChangeSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('Invalid passwords - current password', () => {
    it('should reject empty current password', () => {
      const invalidData = {
        currentPassword: '',
        newPassword: 'NewPass123',
      };
      const result = passwordChangeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Current password is required');
      }
    });
  });

  describe('Invalid passwords - length requirement', () => {
    it('should reject password with less than 8 characters', () => {
      const invalidData = {
        currentPassword: 'OldPass123',
        newPassword: 'Pass1',
      };
      const result = passwordChangeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Password must be at least 8 characters');
      }
    });

    it('should reject password with exactly 7 characters', () => {
      const invalidData = {
        currentPassword: 'OldPass123',
        newPassword: 'Pass12A',
      };
      const result = passwordChangeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('Invalid passwords - uppercase requirement', () => {
    it('should reject password without uppercase letter', () => {
      const invalidData = {
        currentPassword: 'OldPass123',
        newPassword: 'newpass123',
      };
      const result = passwordChangeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const uppercaseError = result.error.issues.find(
          (issue) => issue.message === 'Password must contain at least one uppercase letter'
        );
        expect(uppercaseError).toBeDefined();
      }
    });
  });

  describe('Invalid passwords - lowercase requirement', () => {
    it('should reject password without lowercase letter', () => {
      const invalidData = {
        currentPassword: 'OldPass123',
        newPassword: 'NEWPASS123',
      };
      const result = passwordChangeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const lowercaseError = result.error.issues.find(
          (issue) => issue.message === 'Password must contain at least one lowercase letter'
        );
        expect(lowercaseError).toBeDefined();
      }
    });
  });

  describe('Invalid passwords - number requirement', () => {
    it('should reject password without number', () => {
      const invalidData = {
        currentPassword: 'OldPass123',
        newPassword: 'NewPassword',
      };
      const result = passwordChangeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const numberError = result.error.issues.find(
          (issue) => issue.message === 'Password must contain at least one number'
        );
        expect(numberError).toBeDefined();
      }
    });
  });

  describe('Invalid passwords - multiple requirements missing', () => {
    it('should reject password missing uppercase and number', () => {
      const invalidData = {
        currentPassword: 'OldPass123',
        newPassword: 'newpassword',
      };
      const result = passwordChangeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThanOrEqual(2);
      }
    });

    it('should reject password missing all requirements', () => {
      const invalidData = {
        currentPassword: 'OldPass123',
        newPassword: 'pass',
      };
      const result = passwordChangeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThanOrEqual(3);
      }
    });
  });

  describe('Edge cases', () => {
    it('should reject password with only spaces', () => {
      const invalidData = {
        currentPassword: 'OldPass123',
        newPassword: '        ',
      };
      const result = passwordChangeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should accept password with spaces if it meets all requirements', () => {
      const validData = {
        currentPassword: 'OldPass123',
        newPassword: 'New Pass 123',
      };
      const result = passwordChangeSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });
});
