import { z } from "zod";

// Password validation
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

// Email validation
export const emailSchema = z
  .string()
  .email("Please enter a valid email address")
  .transform((e) => e.toLowerCase().trim());

// Phone validation
export const phoneSchema = z
  .string()
  .regex(
    /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/,
    "Please enter a valid phone number"
  );

// Client schema
export const clientSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  email: emailSchema.optional().or(z.literal("")),
  phone: phoneSchema,
  notes: z.string().max(500).optional(),
});

// Service schema
export const serviceSchema = z.object({
  name: z.string().min(1, "Service name is required").max(100),
  description: z.string().max(500).optional(),
  duration: z.number().min(5, "Duration must be at least 5 minutes").max(480),
  price: z.number().min(0, "Price must be non-negative"),
  categoryId: z.string().min(1, "Category is required"),
});

// Product schema
export const productSchema = z.object({
  name: z.string().min(1, "Product name is required").max(100),
  description: z.string().max(500).optional(),
  sku: z.string().max(50).optional(),
  price: z.number().min(0, "Price must be non-negative"),
  cost: z.number().min(0, "Cost must be non-negative").optional(),
  stockQuantity: z.number().int().min(0, "Stock must be non-negative"),
  reorderPoint: z.number().int().min(0).optional(),
  categoryId: z.string().optional(),
});

// Staff schema
export const staffSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  email: emailSchema,
  phone: phoneSchema.optional().or(z.literal("")),
  title: z.string().min(1, "Title is required").max(100),
  role: z.enum(["STAFF", "MANAGER", "RECEPTIONIST"]),
});

// Appointment schema
export const appointmentSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  serviceId: z.string().min(1, "Service is required"),
  staffId: z.string().min(1, "Staff member is required"),
  date: z.string().min(1, "Date is required"),
  startTime: z.string().min(1, "Start time is required"),
  notes: z.string().max(500).optional(),
});

// Field-level validation helpers
export function validateField<T extends z.ZodType>(
  schema: T,
  value: unknown
): { valid: boolean; error?: string } {
  const result = schema.safeParse(value);
  if (result.success) return { valid: true };
  return { valid: false, error: result.error.issues[0]?.message };
}

export function validateForm<T extends z.ZodType>(
  schema: T,
  data: unknown
): { valid: boolean; errors: Record<string, string> } {
  const result = schema.safeParse(data);
  if (result.success) return { valid: true, errors: {} };

  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const path = issue.path.join(".");
    if (!errors[path]) {
      errors[path] = issue.message;
    }
  }
  return { valid: false, errors };
}

export type ClientFormData = z.infer<typeof clientSchema>;
export type ServiceFormData = z.infer<typeof serviceSchema>;
export type ProductFormData = z.infer<typeof productSchema>;
export type StaffFormData = z.infer<typeof staffSchema>;
export type AppointmentFormData = z.infer<typeof appointmentSchema>;
