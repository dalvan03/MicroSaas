// server/routes-appointments.ts
import { Router } from "express";
import { storage } from "./storage";
import { insertAppointmentSchema, insertWorkScheduleSchema } from "../shared/schema"; // ajuste o caminho
const router = Router();

// Appointments API
router.get("/api/appointments", async (req, res, next) => {
  try {
    const { date } = req.query;
    if (date) {
      // Se a query "date" for informada, retorna os agendamentos daquela data (rota pública)
      const appointments = await storage.getAppointmentsByDate(new Date(date as string));
      return res.json(appointments);
    }
    // Sem parâmetro de data, exige autenticação
    if (!req.session || !(req.session as any).user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const sessionUser = (req.session as any).user;
    const appointments = await storage.getUserAppointments(sessionUser.id);
    res.json(appointments);
  } catch (error) {
    next(error);
  }
});

router.get("/api/appointments/:id", async (req, res, next) => {
  try {
    const id = req.params.id;
    const appointment = await storage.getAppointment(id);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }
    res.json(appointment);
  } catch (error) {
    next(error);
  }
});

router.get("/api/professionals/:id/appointments", async (req, res, next) => {
  try {
    const professionalId = req.params.id;
    const appointments = await storage.getProfessionalAppointments(professionalId);
    res.json(appointments);
  } catch (error) {
    next(error);
  }
});

router.post("/api/appointments", async (req, res, next) => {
  try {
    if (!req.session || !(req.session as any).user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const validatedData = insertAppointmentSchema.parse(req.body);
    const appointment = await storage.createAppointment(validatedData);
    res.status(201).json(appointment);
  } catch (error) {
    next(error);
  }
});

router.put("/api/appointments/:id", async (req, res, next) => {
  try {
    const id = req.params.id;
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

router.delete("/api/appointments/:id", async (req, res, next) => {
  try {
    const id = req.params.id;
    const success = await storage.deleteAppointment(id);
    if (!success) {
      return res.status(404).json({ message: "Appointment not found" });
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// Work Schedules API
router.get("/api/professionals/:id/schedules", async (req, res, next) => {
  try {
    const professionalId = req.params.id;
    const schedules = await storage.getWorkSchedule(professionalId);
    res.json(schedules);
  } catch (error) {
    next(error);
  }
});

router.post("/api/work-schedules", async (req, res, next) => {
  try {
    const validatedData = insertWorkScheduleSchema.parse(req.body);
    const workSchedule = await storage.addWorkSchedule(validatedData);
    res.status(201).json(workSchedule);
  } catch (error) {
    next(error);
  }
});

router.put("/api/work-schedules/:id", async (req, res, next) => {
  try {
    const id = req.params.id;
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

router.delete("/api/work-schedules/:id", async (req, res, next) => {
  try {
    const id = req.params.id;
    const success = await storage.deleteWorkSchedule(id);
    if (!success) {
      return res.status(404).json({ message: "Work schedule not found" });
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
