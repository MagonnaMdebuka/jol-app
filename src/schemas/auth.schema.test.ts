/**
 * Tests for auth validation schemas
 */

import { describe, it, expect } from 'vitest';
import { emailSchema, passwordSchema, saPhoneSchema, ownerRegisterSchema } from './auth.schema';

describe('emailSchema', () => {
  it('accepts valid emails', () => {
    expect(emailSchema.safeParse('test@example.com').success).toBe(true);
    expect(emailSchema.safeParse('USER@EXAMPLE.COM').success).toBe(true);
  });

  it('transforms to lowercase', () => {
    const result = emailSchema.parse('USER@EXAMPLE.COM');
    expect(result).toBe('user@example.com');
  });

  it('rejects invalid emails', () => {
    expect(emailSchema.safeParse('').success).toBe(false);
    expect(emailSchema.safeParse('notanemail').success).toBe(false);
    expect(emailSchema.safeParse('missing@').success).toBe(false);
  });
});

describe('passwordSchema', () => {
  it('accepts strong passwords', () => {
    expect(passwordSchema.safeParse('Password1').success).toBe(true);
    expect(passwordSchema.safeParse('MySecure123').success).toBe(true);
    expect(passwordSchema.safeParse('abcDEF123!@#').success).toBe(true);
  });

  it('rejects weak passwords', () => {
    // Too short
    expect(passwordSchema.safeParse('Pass1').success).toBe(false);
    // No uppercase
    expect(passwordSchema.safeParse('password1').success).toBe(false);
    // No lowercase
    expect(passwordSchema.safeParse('PASSWORD1').success).toBe(false);
    // No number
    expect(passwordSchema.safeParse('Password').success).toBe(false);
  });
});

describe('saPhoneSchema', () => {
  it('accepts valid SA phone numbers', () => {
    expect(saPhoneSchema.safeParse('0821234567').success).toBe(true);
    expect(saPhoneSchema.safeParse('+27821234567').success).toBe(true);
    expect(saPhoneSchema.safeParse('082 123 4567').success).toBe(true);
  });

  it('rejects invalid phone numbers', () => {
    expect(saPhoneSchema.safeParse('123456').success).toBe(false);
    expect(saPhoneSchema.safeParse('+1234567890').success).toBe(false);
    expect(saPhoneSchema.safeParse('0121234567').success).toBe(false); // Not mobile prefix
  });
});

describe('ownerRegisterSchema', () => {
  it('accepts valid registration data', () => {
    const result = ownerRegisterSchema.safeParse({
      email: 'owner@venue.co.za',
      password: 'SecurePass1',
      confirmPassword: 'SecurePass1',
      displayName: 'Venue Owner',
    });
    expect(result.success).toBe(true);
  });

  it('rejects mismatched passwords', () => {
    const result = ownerRegisterSchema.safeParse({
      email: 'owner@venue.co.za',
      password: 'SecurePass1',
      confirmPassword: 'DifferentPass1',
      displayName: 'Venue Owner',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Passwords do not match');
    }
  });

  it('rejects weak password', () => {
    const result = ownerRegisterSchema.safeParse({
      email: 'owner@venue.co.za',
      password: 'weak',
      confirmPassword: 'weak',
      displayName: 'Venue Owner',
    });
    expect(result.success).toBe(false);
  });
});
