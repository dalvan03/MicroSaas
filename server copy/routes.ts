import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { setupUserRoutes } from "./routes-users";
import { 
  insertProfessionalSchema, 
  insertServiceSchema, 
  insertProfessionalServiceSchema,
  insertWorkScheduleSchema,
  insertAppointmentSchema,
  insertTransactionSchema
} from "@shared/schema";
import { format } from "date-fns";
import { z } from "zod";

interface AuthenticatedRequest extends Request {
  isAuthenticated: () => boolean;
  user: {
    id: number;
    role: string;
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);
  
  // Setup user routes
  setupUserRoutes(app);

  // API routes (all prefixed with /api)

  // Professionals API
  app.get("/api/professionals", async (req, res, next) => {
    try {
      const professionals = await storage.getAllProfessionals();
      res.json(professionals);
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/professionals/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      const professional = await storage.getProfessional(id);
      if (!professional) {
        return res.status(404).json({ message: "Professional not found" });
      }
      res.json(professional);
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/professionals", async (req, res, next) => {
    try {
      const validatedData = insertProfessionalSchema.parse(req.body);
      const professional = await storage.createProfessional(validatedData);
      res.status(201).json(professional);
    } catch (error) {
      next(error);
    }
  });
  
  app.put("/api/professionals/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      const validatedData = insertProfessionalSchema.partial().parse(req.body);
      const professional = await storage.updateProfessional(id, validatedData);
      if (!professional) {
        return res.status(404).json({ message: "Professional not found" });
      }
      res.json(professional);
    } catch (error) {
      next(error);
    }
  });
  
  app.delete("/api/professionals/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      const success = await storage.deleteProfessional(id);
      if (!success) {
        return res.status(404).json({ message: "Professional not found" });
      }
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  // Services API
  app.get("/api/services", async (req, res, next) => {
    try {
      const services = await storage.getAllServices();
      res.json(services);
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/services/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      const service = await storage.getService(id);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      res.json(service);
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/services", async (req, res, next) => {
    try {
      const validatedData = insertServiceSchema.parse(req.body);
      const service = await storage.createService(validatedData);
      res.status(201).json(service);
    } catch (error) {
      next(error);
    }
  });
  
  app.put("/api/services/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      const validatedData = insertServiceSchema.partial().parse(req.body);
      const service = await storage.updateService(id, validatedData);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      res.json(service);
    } catch (error) {
      next(error);
    }
  });
  
  app.delete("/api/services/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      const success = await storage.deleteService(id);
      if (!success) {
        return res.status(404).json({ message: "Service not found" });
      }
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  // Professional-Service Relationship API
  app.get("/api/professionals/:id/services", async (req, res, next) => {
    try {
      const professionalId = parseInt(req.params.id, 10);
      const services = await storage.getProfessionalServices(professionalId);
      res.json(services);
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/services/:id/professionals", async (req, res, next) => {
    try {
      const serviceId = parseInt(req.params.id, 10);
      const professionals = await storage.getServiceProfessionals(serviceId);
      res.json(professionals);
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/professional-services", async (req, res, next) => {
    try {
      const validatedData = insertProfessionalServiceSchema.parse(req.body);
      const professionalService = await storage.addServiceToProfessional(validatedData);
      res.status(201).json(professionalService);
    } catch (error) {
      next(error);
    }
  });
  
  app.delete("/api/professional-services", async (req, res, next) => {
    try {
      const schema = z.object({
        professionalId: z.string(),
        serviceId: z.string()
      });
      const validatedData = schema.parse(req.body);
      const success = await storage.removeServiceFromProfessional(
        parseInt(validatedData.professionalId, 10), 
        parseInt(validatedData.serviceId, 10)
      );
      if (!success) {
        return res.status(404).json({ message: "Relationship not found" });
      }
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  // Work Schedules API
  app.get("/api/professionals/:id/schedules", async (req, res, next) => {
    try {
      const professionalId = parseInt(req.params.id, 10);
      const schedules = await storage.getWorkSchedule(professionalId);
      res.json(schedules);
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/work-schedules", async (req, res, next) => {
    try {
      const validatedData = insertWorkScheduleSchema.parse(req.body);
      const workSchedule = await storage.addWorkSchedule(validatedData);
      res.status(201).json(workSchedule);
    } catch (error) {
      next(error);
    }
  });
  
  app.put("/api/work-schedules/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      const validatedData = insertWorkScheduleSchema.partial().parse(req.body);
      const workSchedule = await storage.updateWorkSchedule(id, validatedData);
      if (!workSchedule) {
        return res.status(404).json({ message: "Work schedule not found" });
      }
      res.json(workSchedule);
    } catch (error) {
      next(error);
    }
  });
  
  app.delete("/api/work-schedules/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      const success = await storage.deleteWorkSchedule(id);
      if (!success) {
        return res.status(404).json({ message: "Work schedule not found" });
      }
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  // Appointments API
  app.get("/api/appointments", async (req, res, next) => {
    try {
      const { date } = req.query;
      if (!((req as unknown) as AuthenticatedRequest).isAuthenticated()) {
        const appointments = await storage.getAppointmentsByDate(new Date(date as string));
        return res.json(appointments);
      }
      if (!((req as unknown) as AuthenticatedRequest).isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const user = (req as unknown as AuthenticatedRequest).user;
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const appointments = await storage.getUserAppointments(user.id);
      res.json(appointments);
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/appointments/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      const appointment = await storage.getAppointment(id);
      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }
      res.json(appointment);
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/professionals/:id/appointments", async (req, res, next) => {
    try {
      const professionalId = parseInt(req.params.id, 10);
      const appointments = await storage.getProfessionalAppointments(professionalId);
      res.json(appointments);
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/appointments", async (req, res, next) => {
    try {
      if (!((req as unknown) as AuthenticatedRequest).isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const validatedData = insertAppointmentSchema.parse(req.body);
      const appointment = await storage.createAppointment(validatedData);
      res.status(201).json(appointment);
    } catch (error) {
      next(error);
    }
  });
  
  app.put("/api/appointments/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      const validatedData = insertAppointmentSchema.partial().parse(req.body);
      const appointment = await storage.updateAppointment(id, validatedData);
      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }
      res.json(appointment);
    } catch (error) {
      next(error);
    }
  });
  
  app.delete("/api/appointments/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      const success = await storage.deleteAppointment(id);
      if (!success) {
        return res.status(404).json({ message: "Appointment not found" });
      }
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  // Transactions API
  app.get("/api/transactions", async (req, res, next) => {
    try {
      if (!(req as AuthenticatedRequest).isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const user = (req as AuthenticatedRequest).user;
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }
      const transactions = await storage.getAllTransactions();
      res.json(transactions);
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/transactions", async (req, res, next) => {
    try {
      if (!(req as AuthenticatedRequest).isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const user = (req as AuthenticatedRequest).user;
      if (user.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }
      const validatedData = insertTransactionSchema.parse(req.body);
      const transaction = await storage.createTransaction(validatedData);
      res.status(201).json(transaction);
    } catch (error) {
      next(error);
    }
  });
  
  app.put("/api/transactions/:id", async (req, res, next) => {
    try {
      if (!(req as AuthenticatedRequest).isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const user = (req as AuthenticatedRequest).user;
      if (user.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }
      const id = parseInt(req.params.id, 10);
      const validatedData = insertTransactionSchema.partial().parse(req.body);
      const transaction = await storage.updateTransaction(id, validatedData);
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      res.json(transaction);
    } catch (error) {
      next(error);
    }
  });
  
  app.delete("/api/transactions/:id", async (req, res, next) => {
    try {
      if (!(req as AuthenticatedRequest).isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const user = (req as AuthenticatedRequest).user;
      if (user.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }
      const id = parseInt(req.params.id, 10);
      const success = await storage.deleteTransaction(id);
      if (!success) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
