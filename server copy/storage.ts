import { 
  users, type User, type InsertUser,
  professionals, type Professional, type InsertProfessional,
  services, type Service, type InsertService,
  professionalServices, type ProfessionalService, type InsertProfessionalService,
  workSchedules, type WorkSchedule, type InsertWorkSchedule,
  appointments, type Appointment, type InsertAppointment,
  transactions, type Transaction, type InsertTransaction
} from "@shared/schema";
import session from "express-session";
import MemoryStore from "memorystore";
import { db } from "./db";
import { eq, and, inArray } from "drizzle-orm";
import { format } from "date-fns";

const MemoryStoreSession = MemoryStore(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByemail(email: string): Promise<User | undefined>;
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

  // Session store
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new MemoryStoreSession({
      checkPeriod: 86400000 // prune expired entries every 24h
    });

    // Add seed data for initial testing
    this.seedData();
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByemail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, updateData: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db.update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Professional operations
  async getProfessional(id: number): Promise<Professional | undefined> {
    const [professional] = await db.select().from(professionals).where(eq(professionals.id, id));
    return professional;
  }

  async getAllProfessionals(): Promise<Professional[]> {
    return await db.select().from(professionals);
  }

  async createProfessional(insertProfessional: InsertProfessional): Promise<Professional> {
    const [professional] = await db.insert(professionals).values(insertProfessional).returning();
    return professional;
  }

  async updateProfessional(id: number, updateData: Partial<InsertProfessional>): Promise<Professional | undefined> {
    const [professional] = await db.update(professionals)
      .set(updateData)
      .where(eq(professionals.id, id))
      .returning();
    return professional;
  }

  async deleteProfessional(id: number): Promise<boolean> {
    const result = await db.delete(professionals).where(eq(professionals.id, id));
    return result.count > 0;
  }

  // Service operations
  async getService(id: number): Promise<Service | undefined> {
    const [service] = await db.select().from(services).where(eq(services.id, id));
    return service;
  }

  async getAllServices(): Promise<Service[]> {
    return await db.select().from(services);
  }

  async createService(insertService: InsertService): Promise<Service> {
    const [service] = await db.insert(services).values(insertService).returning();
    return service;
  }

  async updateService(id: number, updateData: Partial<InsertService>): Promise<Service | undefined> {
    const [service] = await db.update(services)
      .set(updateData)
      .where(eq(services.id, id))
      .returning();
    return service;
  }

  async deleteService(id: number): Promise<boolean> {
    // Check if service exists first
    const service = await this.getService(id);
    if (!service) {
      return false;
    }

    // Delete related appointments first
    await db.delete(appointments).where(eq(appointments.serviceId, id));
    
    // Then delete related professional_services records
    await db.delete(professionalServices).where(eq(professionalServices.serviceId, id));
    
    // Finally delete the service
    const result = await db.delete(services).where(eq(services.id, id));
    return result.count > 0;
  }

  // Professional-Service operations
  async getProfessionalServices(professionalId: number): Promise<Service[]> {
    const ps = await db.select()
      .from(professionalServices)
      .where(eq(professionalServices.professionalId, professionalId));

    const serviceIds = ps.map(p => p.serviceId);

    if (serviceIds.length === 0) {
      return [];
    }

    // Usando inArray em vez de multiple OR conditions
    return await db.select()
      .from(services)
      .where(inArray(services.id, serviceIds));
  }

  async getServiceProfessionals(serviceId: number): Promise<Professional[]> {
    console.log(`Buscando profissionais para o serviço com ID: ${serviceId}`);

    const ps = await db.select()
      .from(professionalServices)
      .where(eq(professionalServices.serviceId, serviceId));

    const professionalIds = ps.map(p => p.professionalId);
    console.log(`IDs de profissionais encontrados: ${professionalIds.join(', ')}`);

    if (professionalIds.length === 0) {
      console.log("Nenhum profissional encontrado para este serviço");
      return [];
    }

    // Usando inArray em vez de multiple OR conditions
    const result = await db.select()
      .from(professionals)
      .where(inArray(professionals.id, professionalIds));

    console.log(`Profissionais encontrados: ${result.length}`);
    console.log(`Detalhes: ${JSON.stringify(result)}`);

    return result;
  }

  async addServiceToProfessional(insertProfessionalService: InsertProfessionalService): Promise<ProfessionalService> {
    const [professionalService] = await db.insert(professionalServices)
      .values(insertProfessionalService)
      .returning();
    return professionalService;
  }

  async removeServiceFromProfessional(professionalId: number, serviceId: number): Promise<boolean> {
    const result = await db.delete(professionalServices)
      .where(
        and(
          eq(professionalServices.professionalId, professionalId),
          eq(professionalServices.serviceId, serviceId)
        )
      );
    return result.count > 0;
  }

  // Schedule operations
  async getWorkSchedule(professionalId: number): Promise<WorkSchedule[]> {
    return await db.select()
      .from(workSchedules)
      .where(eq(workSchedules.professionalId, professionalId));
  }

  async addWorkSchedule(insertWorkSchedule: InsertWorkSchedule): Promise<WorkSchedule> {
    const [workSchedule] = await db.insert(workSchedules)
      .values(insertWorkSchedule)
      .returning();
    return workSchedule;
  }

  async updateWorkSchedule(id: number, updateData: Partial<InsertWorkSchedule>): Promise<WorkSchedule | undefined> {
    const [workSchedule] = await db.update(workSchedules)
      .set(updateData)
      .where(eq(workSchedules.id, id))
      .returning();
    return workSchedule;
  }

  async deleteWorkSchedule(id: number): Promise<boolean> {
    const result = await db.delete(workSchedules).where(eq(workSchedules.id, id));
    return result.count > 0;
  }

  // Appointment operations
  async getAppointment(id: number): Promise<Appointment | undefined> {
    const [appointment] = await db.select().from(appointments).where(eq(appointments.id, id));
    return appointment;
  }

  async getUserAppointments(userId: number): Promise<Appointment[]> {
    return await db.select()
      .from(appointments)
      .where(eq(appointments.userId, userId));
  }

  async getProfessionalAppointments(professionalId: number): Promise<Appointment[]> {
    return await db.select()
      .from(appointments)
      .where(eq(appointments.professionalId, professionalId));
  }

  async getAppointmentsByDate(date: Date): Promise<Appointment[]> {
    const dateStr = format(date, "yyyy-MM-dd");
    console.log(`Fetching appointments for date: ${dateStr}`);
    const result = await db.select()
      .from(appointments)
      .where(eq(appointments.date, dateStr));
    console.log(`Found ${result.length} appointments for date ${dateStr}`);
    return result;
  }

  async createAppointment(insertAppointment: InsertAppointment): Promise<Appointment> {
    console.log(`Criando agendamento: ${JSON.stringify(insertAppointment)}`);

    const [appointment] = await db.insert(appointments)
      .values(insertAppointment)
      .returning();

    console.log(`Agendamento criado: ${JSON.stringify(appointment)}`);
    return appointment;
  }

  async updateAppointment(id: number, updateData: Partial<InsertAppointment>): Promise<Appointment | undefined> {
    const [appointment] = await db.update(appointments)
      .set(updateData)
      .where(eq(appointments.id, id))
      .returning();
    return appointment;
  }

  async deleteAppointment(id: number): Promise<boolean> {
    const result = await db.delete(appointments).where(eq(appointments.id, id));
    return result.count > 0;
  }

  // Transaction operations
  async getTransaction(id: number): Promise<Transaction | undefined> {
    const [transaction] = await db.select().from(transactions).where(eq(transactions.id, id));
    return transaction;
  }

  async getAllTransactions(): Promise<Transaction[]> {
    return await db.select().from(transactions);
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const [transaction] = await db.insert(transactions)
      .values(insertTransaction)
      .returning();
    return transaction;
  }

  async updateTransaction(id: number, updateData: Partial<InsertTransaction>): Promise<Transaction | undefined> {
    const [transaction] = await db.update(transactions)
      .set(updateData)
      .where(eq(transactions.id, id))
      .returning();
    return transaction;
  }

  async deleteTransaction(id: number): Promise<boolean> {
    const result = await db.delete(transactions).where(eq(transactions.id, id));
    return result.count > 0;
  }

  private async seedData() {
    try {
      // Check if admin user already exists
      const adminEmail = "admin@salao.com";
      const existingAdmin = await db.select().from(users).where(eq(users.email, adminEmail));
      
      if (existingAdmin.length > 0) {
        console.log("Admin user already exists, skipping seed data");
        return;
      }

      // Add an admin user for initial access
      const admin = await this.createUser({
        email: "123456",
        password: "123456", // Plain text password as requested
        name: "Administrator",
        email: adminEmail,
        role: "admin",
        phone: "",
        address: "",
        instagram: "",
        profilePicture: ""
      });

      // Add sample services
      const haircut = await this.createService({
        name: "Haircut",
        description: "Basic haircut with styling",
        duration: 30,
        price: 35.0,
        active: true
      });

      const hairColoring = await this.createService({
        name: "Hair Coloring",
        description: "Full hair coloring service",
        duration: 120,
        price: 100.0,
        active: true
      });

      const manicure = await this.createService({
        name: "Manicure",
        description: "Basic manicure service",
        duration: 45,
        price: 25.0,
        active: true
      });

      // Add sample professionals
      const john = await this.createProfessional({
        name: "John Smith",
        phone: "11 9999-8888",
        email: "john@salao.com",
        cpf: "123.456.789-00",
        address: "123 Main St, City",
        profilePicture: "",
        active: true
      });

      const maria = await this.createProfessional({
        name: "Maria Silva",
        phone: "11 9999-7777",
        email: "maria@salao.com",
        cpf: "987.654.321-00",
        address: "456 Palm Ave, City",
        profilePicture: "",
        active: true
      });

      // Assign services to professionals
      await this.addServiceToProfessional({
        professionalId: john.id,
        serviceId: haircut.id
      });

      await this.addServiceToProfessional({
        professionalId: john.id,
        serviceId: hairColoring.id
      });

      await this.addServiceToProfessional({
        professionalId: maria.id,
        serviceId: hairColoring.id
      });

      await this.addServiceToProfessional({
        professionalId: maria.id,
        serviceId: manicure.id
      });

      // Set work schedules
      for (let i = 1; i <= 5; i++) { // Monday to Friday
        await this.addWorkSchedule({
          professionalId: john.id,
          dayOfWeek: i,
          startTime: '09:00:00',
          endTime: '18:00:00'
        });

        await this.addWorkSchedule({
          professionalId: maria.id,
          dayOfWeek: i,
          startTime: '10:00:00',
          endTime: '19:00:00'
        });
      }

      console.log("Database seeded successfully");
    } catch (error) {
      console.error("Error seeding database:", error);
    }
  }
}

export const storage = new DatabaseStorage();