import { z } from "zod";

// User model for authentication
export const users = {
  id: "text",
  password: "text",
  name: "text",
  email: "text",
  tel: "text",
  role: "text",
  instagram: "text",
  profilePicture: "text",
};

// Professional model
export const professionals = {
  id: "integer",
  name: "text",
  tel: "text",
  email: "text",
  cpf: "text",
  profilePicture: "text",
  active: "boolean",
};

// Service model schema for Supabase
export const insertServiceSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  duration: z.number().min(1, "Duração deve ser maior que 0"), // in minutes
  price: z.number().min(0, "Preço deve ser maior ou igual a 0"),
  active: z.boolean().default(true),
  loja_id: z.string().optional(),
  created_at: z.string().optional(), // Timestamp with time zone
  updated_at: z.string().optional(), // Timestamp with time zone
});

export type InsertService = z.infer<typeof insertServiceSchema>;

export const serviceSchema = z.object({
  id: z.string(), // UUID
  ...insertServiceSchema.shape,
});

export type Service = z.infer<typeof serviceSchema>;

// Professional-Service relationship
export const professionalServices = {
  id: "integer",
  professionalId: "integer",
  serviceId: "integer",
  commission: "real",
};

// Work Schedule for professionals
export const workSchedules = {
  id: "integer",
  professionalId: "integer",
  dayOfWeek: "integer",
  startTime: "text",
  endTime: "text",
};

// Appointment model
export const appointments = {
  id: "integer",
  userId: "integer",
  professionalId: "integer",
  serviceId: "integer",
  date: "text",
  startTime: "text",
  endTime: "text",
  status: "text",
  notes: "text",
  createdAt: "text",
};

// Financial transactions
export const transactions = {
  id: "integer",
  appointmentId: "integer",
  type: "text",
  amount: "real",
  description: "text",
  date: "text",
  createdAt: "text",
};

// Zod schemas for input validation
export const insertUserSchema = z.object({
  password: z.string().min(1, "Password is required"),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email").min(1, "Email is required"),
  tel: z.string().optional(),
  role: z.string().default("authenticated"),
  instagram: z.string().optional(),
  profilePicture: z.string().optional(),
});

export const insertProfessionalSchema = z.object({
  name: z.string().min(1, "Name is required"),
  tel: z.string().min(1, "Tel is required"),
  email: z.string().email("Invalid email").min(1, "Email is required"),
  cpf: z.string().min(1, "CPF is required"),
  profilePicture: z.string().optional(),
  active: z.boolean().default(true),
});

export const insertProfessionalServiceSchema = z.object({
  professionalId: z.number().min(1, "Professional ID is required"),
  serviceId: z.number().min(1, "Service ID is required"),
  commission: z.number().default(0),
});

export const insertWorkScheduleSchema = z.object({
  professionalId: z.number().min(1, "Professional ID is required"),
  dayOfWeek: z.number().min(0).max(6, "Day of week must be between 0 and 6"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
});

export const insertAppointmentSchema = z.object({
  userId: z.number().min(1, "User ID is required"),
  professionalId: z.number().min(1, "Professional ID is required"),
  serviceId: z.number().min(1, "Service ID is required"),
  date: z.string().min(1, "Date is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  status: z.string().default("scheduled"),
  notes: z.string().optional(),
  createdAt: z.string().default("CURRENT_TIMESTAMP"),
});

export const insertTransactionSchema = z.object({
  appointmentId: z.number().optional(),
  type: z.string().min(1, "Type is required"),
  amount: z.number().min(0, "Amount must be greater than or equal to 0"),
  description: z.string().min(1, "Description is required"),
  date: z.string().min(1, "Date is required"),
  createdAt: z.string().default("CURRENT_TIMESTAMP"),
});

// Auth schemas for login
export const loginSchema = z.object({
  email: z.string().min(1, "Email is required"),
  password: z.string().min(1, "Password is required"),
});

// Export types
export type User = typeof users;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginData = z.infer<typeof loginSchema>;

export type Professional = typeof professionals;
export type InsertProfessional = z.infer<typeof insertProfessionalSchema>;

export type ProfessionalService = typeof professionalServices;
export type InsertProfessionalService = z.infer<typeof insertProfessionalServiceSchema>;

export type WorkSchedule = typeof workSchedules;
export type InsertWorkSchedule = z.infer<typeof insertWorkScheduleSchema>;

export type Appointment = typeof appointments;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;

export type Transaction = typeof transactions;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
