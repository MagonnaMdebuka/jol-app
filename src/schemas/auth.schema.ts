/**
 * Auth validation schemas
 */

import { z } from 'zod';

// South African phone number regex
const SA_PHONE_REGEX = /^(\+27|0)[6-8][0-9]{8}$/;

// Password requirements: min 8 chars, at least one uppercase, one lowercase, one number
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Enter a valid email address')
  .transform((v) => v.toLowerCase().trim());

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(PASSWORD_REGEX, 'Password must include uppercase, lowercase, and a number');

export const saPhoneSchema = z
  .string()
  .transform((v) => v.replace(/\s/g, ''))
  .refine((v) => SA_PHONE_REGEX.test(v), {
    message: 'Enter a valid SA mobile number (e.g. 082 000 0000)',
  });

export const optionalSaPhoneSchema = z
  .string()
  .optional()
  .transform((v) => (v ? v.replace(/\s/g, '') : undefined))
  .refine((v) => !v || SA_PHONE_REGEX.test(v), {
    message: 'Enter a valid SA mobile number (e.g. 082 000 0000)',
  });

// Login schemas
export const emailLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const phoneLoginSchema = z.object({
  phone: saPhoneSchema,
});

// Registration schema (owner)
export const ownerRegisterSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    displayName: z.string().min(1, 'Display name is required').max(50),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

// OTP verification
export const otpSchema = z.object({
  phone: saPhoneSchema,
  otp: z.string().length(6, 'OTP must be 6 digits').regex(/^\d+$/, 'OTP must be numbers only'),
});

// Types
export type EmailLogin = z.infer<typeof emailLoginSchema>;
export type PhoneLogin = z.infer<typeof phoneLoginSchema>;
export type OwnerRegister = z.infer<typeof ownerRegisterSchema>;
export type OtpVerify = z.infer<typeof otpSchema>;
