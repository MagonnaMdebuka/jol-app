/**
 * Form validation utilities
 */

export interface IValidationResult {
  valid: boolean;
  error?: string;
}

// Email validation
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateEmail = (email: string): IValidationResult => {
  if (!email.trim()) return { valid: false, error: 'Email is required' };
  if (!EMAIL_REGEX.test(email)) return { valid: false, error: 'Enter a valid email address' };
  return { valid: true };
};

// South African phone validation
const SA_PHONE_REGEX = /^(\+27|0)[6-8][0-9]{8}$/;

export const validateSAPhone = (phone: string, required = false): IValidationResult => {
  const cleaned = phone.replace(/\s/g, '');
  if (!cleaned) {
    return required ? { valid: false, error: 'Phone number is required' } : { valid: true };
  }
  if (!SA_PHONE_REGEX.test(cleaned)) {
    return { valid: false, error: 'Enter a valid SA mobile number (e.g. 082 000 0000)' };
  }
  return { valid: true };
};

// Password validation
export const validatePassword = (password: string): IValidationResult => {
  if (!password) return { valid: false, error: 'Password is required' };
  if (password.length < 6) return { valid: false, error: 'Password must be at least 6 characters' };
  return { valid: true };
};

export const validatePasswordMatch = (password: string, confirm: string): IValidationResult => {
  if (!confirm) return { valid: false, error: 'Please confirm your password' };
  if (password !== confirm) return { valid: false, error: 'Passwords do not match' };
  return { valid: true };
};

// Required text field
export const validateRequired = (value: string, fieldName: string): IValidationResult => {
  if (!value.trim()) return { valid: false, error: `${fieldName} is required` };
  return { valid: true };
};

// Min/max length
export const validateLength = (
  value: string,
  fieldName: string,
  min?: number,
  max?: number,
): IValidationResult => {
  const len = value.trim().length;
  if (min !== undefined && len < min) {
    return { valid: false, error: `${fieldName} must be at least ${min} characters` };
  }
  if (max !== undefined && len > max) {
    return { valid: false, error: `${fieldName} cannot exceed ${max} characters` };
  }
  return { valid: true };
};

// Date validation (must be in future)
export const validateFutureDate = (dateStr: string, required = false): IValidationResult => {
  if (!dateStr) {
    return required ? { valid: false, error: 'Date is required' } : { valid: true };
  }
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return { valid: false, error: 'Enter a valid date' };
  if (date <= new Date()) return { valid: false, error: 'Date must be in the future' };
  return { valid: true };
};

// Date range validation (end must be after start)
export const validateDateRange = (startStr: string, endStr: string): IValidationResult => {
  if (!startStr || !endStr) return { valid: true }; // Only validate if both are present
  const start = new Date(startStr);
  const end = new Date(endStr);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return { valid: true };
  if (end <= start) return { valid: false, error: 'End time must be after start time' };
  return { valid: true };
};

// South African coordinates validation
export const validateSACoordinates = (lat: string, lng: string): IValidationResult => {
  const parsedLat = parseFloat(lat);
  const parsedLng = parseFloat(lng);
  if (isNaN(parsedLat) || isNaN(parsedLng)) {
    return { valid: false, error: 'Enter valid coordinates' };
  }
  // Rough South Africa bounding box
  if (parsedLat < -35 || parsedLat > -22 || parsedLng < 16 || parsedLng > 33) {
    return { valid: false, error: 'Coordinates appear to be outside South Africa' };
  }
  return { valid: true };
};

// URL validation (optional field)
export const validateUrl = (url: string, required = false): IValidationResult => {
  if (!url.trim()) {
    return required ? { valid: false, error: 'URL is required' } : { valid: true };
  }
  try {
    new URL(url);
    return { valid: true };
  } catch {
    return { valid: false, error: 'Enter a valid URL' };
  }
};

// Currency/price validation (South African Rand format)
export const validatePrice = (price: string): IValidationResult => {
  if (!price.trim()) return { valid: true }; // Optional
  // Accept formats: R100, R 100, 100, R100.00, Free, TBC
  const cleaned = price.trim().toLowerCase();
  if (cleaned === 'free' || cleaned === 'tbc' || cleaned === 'tba') return { valid: true };
  const numMatch = price.match(/^R?\s*(\d+(?:\.\d{2})?)$/i);
  if (!numMatch) {
    return { valid: false, error: 'Enter a valid price (e.g. R100, Free)' };
  }
  return { valid: true };
};

// Generic form validation helper
export type FieldValidators<T> = {
  [K in keyof T]?: (value: T[K], allValues: T) => IValidationResult;
};

export const validateForm = <T extends Record<string, unknown>>(
  values: T,
  validators: FieldValidators<T>,
): Record<keyof T, string | undefined> => {
  const errors = {} as Record<keyof T, string | undefined>;
  for (const key in validators) {
    const validator = validators[key];
    if (validator) {
      const result = validator(values[key], values);
      errors[key] = result.valid ? undefined : result.error;
    }
  }
  return errors;
};

export const hasErrors = (errors: Record<string, string | undefined>): boolean =>
  Object.values(errors).some((e) => e !== undefined);
