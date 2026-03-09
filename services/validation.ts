import { z } from 'zod';

// ── Login ──
export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

// ── Registration ──
export const registerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().optional(),
  email: z.string().min(1, 'Email is required').email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().optional(),
  unit: z.string().optional(),
});

// ── Phone OTP ──
export const phoneOtpSchema = z.object({
  phone: z.string().min(10, 'Please enter a valid phone number (e.g. +60123456789)'),
});

export const otpVerifySchema = z.object({
  code: z.string().length(6, 'Please enter the 6-digit code'),
});

// ── Reset Password ──
export const resetPasswordSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email'),
});

// ── Parking Booking ──
export const parkingBookingSchema = z.object({
  date: z.string().min(1, 'Please select a date'),
  startTime: z.string().min(1, 'Please select a start time'),
  duration: z.string().min(1, 'Please select duration'),
  plateNumber: z.string()
    .min(1, 'License plate is required')
    .regex(/^[A-Za-z0-9\s-]+$/, 'License plate can only contain letters, numbers, spaces and hyphens'),
  selectedSlot: z.string().min(1, 'Please select a parking slot'),
});

// ── Amenity Booking ──
export const amenityBookingSchema = z.object({
  bookingDate: z.string().min(1, 'Please select a date'),
  bookingTime: z.string().min(1, 'Please select a time slot'),
});

// ── Issue Reporting ──
export const reportingSchema = z.object({
  category: z.string().min(1, 'Please select a category'),
  subcategory: z.string().min(1, 'Please select a subcategory'),
  description: z.string().min(10, 'Please provide at least 10 characters of description'),
});

// ── Profile: Add Vehicle ──
export const addVehicleSchema = z.object({
  plate: z.string()
    .min(1, 'License plate is required')
    .regex(/^[A-Za-z0-9\s-]+$/, 'Invalid plate format'),
  model: z.string().optional(),
});

// ── Profile: Add Tenant ──
export const addTenantSchema = z.object({
  name: z.string().min(1, 'Tenant name is required'),
  email: z.string().min(1, 'Email is required').email('Please enter a valid email'),
  unit: z.string().optional(),
});

// ── Helper: validate and return typed errors ──
type ValidationSuccess<T> = { success: true; data: T; errors: undefined };
type ValidationFailure = { success: false; data: undefined; errors: Record<string, string> };
type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

export function validate<T>(schema: z.ZodSchema<T>, data: unknown): ValidationResult<T> {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data, errors: undefined };
  }
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path[0]?.toString() || '_';
    if (!errors[key]) errors[key] = issue.message;
  }
  return { success: false, data: undefined, errors };
}
