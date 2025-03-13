import { supabase } from "./db";
import { format } from "date-fns";
import {
  users, type User, type InsertUser,
  professionals, type Professional, type InsertProfessional,
  services, type Service, type InsertService,
  professionalServices, type ProfessionalService, type InsertProfessionalService,
  workSchedules, type WorkSchedule, type InsertWorkSchedule,
  appointments, type Appointment, type InsertAppointment,
  transactions, type Transaction, type InsertTransaction
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;

  // Professional operations
  getProfessional(id: number): Promise<Professional | undefined>;
  getAllProfessionals(): Promise<Professional[]>;
  createProfessional(professional: InsertProfessional): Promise<Professional>;
  updateProfessional(id: number, professional: Partial<InsertProfessional>): Promise<Professional | undefined>;
  deleteProfessional(id: number): Promise<boolean>;

  // Service operations
  getService(id: number): Promise<Service | undefined>;
  getAllServices(): Promise<Service[]>;
  createService(service: InsertService): Promise<Service>;
  updateService(id: number, service: Partial<InsertService>): Promise<Service | undefined>;
  deleteService(id: number): Promise<boolean>;

  // Professional-Service operations
  getProfessionalServices(professionalId: number): Promise<Service[]>;
  getServiceProfessionals(serviceId: number): Promise<Professional[]>;
  addServiceToProfessional(professionalService: InsertProfessionalService): Promise<ProfessionalService>;
  removeServiceFromProfessional(professionalId: number, serviceId: number): Promise<boolean>;

  // Schedule operations
  getWorkSchedule(professionalId: number): Promise<WorkSchedule[]>;
  addWorkSchedule(workSchedule: InsertWorkSchedule): Promise<WorkSchedule>;
  updateWorkSchedule(id: number, workSchedule: Partial<InsertWorkSchedule>): Promise<WorkSchedule | undefined>;
  deleteWorkSchedule(id: number): Promise<boolean>;

  // Appointment operations
  getAppointment(id: number): Promise<Appointment | undefined>;
  getUserAppointments(userId: number): Promise<Appointment[]>;
  getProfessionalAppointments(professionalId: number): Promise<Appointment[]>;
  getAppointmentsByDate(date: Date): Promise<Appointment[]>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointment(id: number, appointment: Partial<InsertAppointment>): Promise<Appointment | undefined>;
  deleteAppointment(id: number): Promise<boolean>;

  // Transaction operations
  getTransaction(id: number): Promise<Transaction | undefined>;
  getAllTransactions(): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: number, transaction: Partial<InsertTransaction>): Promise<Transaction | undefined>;
  deleteTransaction(id: number): Promise<boolean>;

  // Session store (não implementado; Supabase Auth gerencia sessões)
  sessionStore: any;
}

export class SupabaseStorage implements IStorage {
  // Supabase gerencia sessões; portanto, sessionStore não é necessário.
  sessionStore = null;

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();
    if (error) throw error;
    return data;
  }

  async getAllUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*');
    if (error) throw error;
    return data || [];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert([insertUser])
      .select('*')
      .single();
    if (error) throw error;
    return data;
  }

  async updateUser(id: number, updateData: Partial<InsertUser>): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return data;
  }

  // Professional operations
  async getProfessional(id: number): Promise<Professional | undefined> {
    const { data, error } = await supabase
      .from('professionals')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  }

  async getAllProfessionals(): Promise<Professional[]> {
    const { data, error } = await supabase
      .from('professionals')
      .select('*');
    if (error) throw error;
    return data || [];
  }

  async createProfessional(insertProfessional: InsertProfessional): Promise<Professional> {
    const { data, error } = await supabase
      .from('professionals')
      .insert([insertProfessional])
      .select('*')
      .single();
    if (error) throw error;
    return data;
  }

  async updateProfessional(id: number, updateData: Partial<InsertProfessional>): Promise<Professional | undefined> {
    const { data, error } = await supabase
      .from('professionals')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return data;
  }

  async deleteProfessional(id: number): Promise<boolean> {
    const { error, data } = await supabase
      .from('professionals')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return !!data;
  }

  // Service operations
  async getService(id: number): Promise<Service | undefined> {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  }

  async getAllServices(): Promise<Service[]> {
    const { data, error } = await supabase
      .from('services')
      .select('*');
    if (error) throw error;
    return data || [];
  }

  async createService(insertService: InsertService): Promise<Service> {
    const { data, error } = await supabase
      .from('services')
      .insert([insertService])
      .select('*')
      .single();
    if (error) throw error;
    return data;
  }

  async updateService(id: number, updateData: Partial<InsertService>): Promise<Service | undefined> {
    const { data, error } = await supabase
      .from('services')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return data;
  }

  async deleteService(id: string): Promise<boolean> {
    const { error, data } = await supabase
      .from('services')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return !!data;
  }

  // Professional-Service operations
  async getProfessionalServices(professionalId: string): Promise<Service[]> {
    const { data: psData, error: psError } = await supabase
      .from('professionalServices')
      .select('*')
      .eq('professionalId', professionalId);
    if (psError) throw psError;
    if (!psData || psData.length === 0) return [];
    const serviceIds = psData.map((ps: any) => ps.serviceId);
    const { data: servicesData, error: servicesError } = await supabase
      .from('services')
      .select('*')
      .in('id', serviceIds);
    if (servicesError) throw servicesError;
    return servicesData || [];
  }

  async getServiceProfessionals(serviceId: number): Promise<Professional[]> {
    const { data: psData, error: psError } = await supabase
      .from('professionalServices')
      .select('*')
      .eq('serviceId', serviceId);
    if (psError) throw psError;
    if (!psData || psData.length === 0) return [];
    const professionalIds = psData.map((ps: any) => ps.professionalId);
    const { data: professionalsData, error: professionalsError } = await supabase
      .from('professionals')
      .select('*')
      .in('id', professionalIds);
    if (professionalsError) throw professionalsError;
    return professionalsData || [];
  }

  async addServiceToProfessional(insertProfessionalService: InsertProfessionalService): Promise<ProfessionalService> {
    const { data, error } = await supabase
      .from('professionalServices')
      .insert([insertProfessionalService])
      .select('*')
      .single();
    if (error) throw error;
    return data;
  }

  async removeServiceFromProfessional(professionalId: number, serviceId: number): Promise<boolean> {
    const { error, data } = await supabase
      .from('professionalServices')
      .delete()
      .eq('professionalId', professionalId)
      .eq('serviceId', serviceId);
    if (error) throw error;
    return !!data;
  }

  // Schedule operations
  async getWorkSchedule(professionalId: number): Promise<WorkSchedule[]> {
    const { data, error } = await supabase
      .from('workSchedules')
      .select('*')
      .eq('professionalId', professionalId);
    if (error) throw error;
    return data || [];
  }

  async addWorkSchedule(insertWorkSchedule: InsertWorkSchedule): Promise<WorkSchedule> {
    const { data, error } = await supabase
      .from('workSchedules')
      .insert([insertWorkSchedule])
      .select('*')
      .single();
    if (error) throw error;
    return data;
  }

  async updateWorkSchedule(id: number, updateData: Partial<InsertWorkSchedule>): Promise<WorkSchedule | undefined> {
    const { data, error } = await supabase
      .from('workSchedules')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return data;
  }

  async deleteWorkSchedule(id: number): Promise<boolean> {
    const { error, data } = await supabase
      .from('workSchedules')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return !!data;
  }

  // Appointment operations
  async getAppointment(id: number): Promise<Appointment | undefined> {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  }

  async getUserAppointments(userId: number): Promise<Appointment[]> {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('userId', userId);
    if (error) throw error;
    return data || [];
  }

  async getProfessionalAppointments(professionalId: number): Promise<Appointment[]> {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('professionalId', professionalId);
    if (error) throw error;
    return data || [];
  }

  async getAppointmentsByDate(date: Date): Promise<Appointment[]> {
    const dateStr = format(date, 'yyyy-MM-dd');
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('date', dateStr);
    if (error) throw error;
    return data || [];
  }

  async createAppointment(insertAppointment: InsertAppointment): Promise<Appointment> {
    const { data, error } = await supabase
      .from('appointments')
      .insert([insertAppointment])
      .select('*')
      .single();
    if (error) throw error;
    return data;
  }

  async updateAppointment(id: number, updateData: Partial<InsertAppointment>): Promise<Appointment | undefined> {
    const { data, error } = await supabase
      .from('appointments')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return data;
  }

  async deleteAppointment(id: number): Promise<boolean> {
    const { error, data } = await supabase
      .from('appointments')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return !!data;
  }

  // Transaction operations
  async getTransaction(id: number): Promise<Transaction | undefined> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  }

  async getAllTransactions(): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*');
    if (error) throw error;
    return data || [];
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const { data, error } = await supabase
      .from('transactions')
      .insert([insertTransaction])
      .select('*')
      .single();
    if (error) throw error;
    return data;
  }

  async updateTransaction(id: number, updateData: Partial<InsertTransaction>): Promise<Transaction | undefined> {
    const { data, error } = await supabase
      .from('transactions')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return data;
  }

  async deleteTransaction(id: number): Promise<boolean> {
    const { error, data } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return !!data;
  }
}

export const storage = new SupabaseStorage();
