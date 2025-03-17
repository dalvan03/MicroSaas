// server/routes-domain.ts
import { Router } from "express";
import { storage } from "./storage";
import { z } from "zod";
import { 
  insertProfessionalSchema, 
  insertServiceSchema, 
  insertProfessionalServiceSchema 
} from "../shared/schema"; // ajuste o caminho conforme sua estrutura

const router = Router();

// Professionals API
router.get("/api/professionals", async (req, res, next) => {
  try {
    const professionals = await storage.getAllProfessionals();
    res.json(professionals);
  } catch (error) {
    next(error);
  }
});

router.get("/api/professionals/:id", async (req, res, next) => {
  try {
    const id = req.params.id;
    const professional = await storage.getProfessional(id);
    if (!professional) {
      return res.status(404).json({ message: "Professional not found" });
    }
    res.json(professional);
  } catch (error) {
    next(error);
  }
});

router.post("/api/professionals", async (req, res, next) => {
  try {
    const validatedData = insertProfessionalSchema.parse(req.body);
    const professional = await storage.createProfessional(validatedData);
    res.status(201).json(professional);
  } catch (error) {
    next(error);
  }
});

router.put("/api/professionals/:id", async (req, res, next) => {
  try {
    const id = req.params.id;
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

router.delete("/api/professionals/:id", async (req, res, next) => {
  try {
    const id = req.params.id;
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
router.get("/api/services", async (req, res, next) => {
  try {
    const services = await storage.getAllServices();
    res.json(services);
  } catch (error) {
    next(error);
  }
});

router.get("/api/services/:id", async (req, res, next) => {
  try {
    const id = req.params.id;
    const service = await storage.getService(id);
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }
    res.json(service);
  } catch (error) {
    next(error);
  }
});

router.post("/api/services", async (req, res, next) => {
  try {
    const validatedData = insertServiceSchema.parse(req.body);
    const service = await storage.createService(validatedData);
    res.status(201).json(service);
  } catch (error) {
    next(error);
  }
});

router.put("/api/services/:id", async (req, res, next) => {
  try {
    const id = req.params.id;
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

router.delete("/api/services/:id", async (req, res, next) => {
  try {
    const id = req.params.id;
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
router.get("/api/professionals/:id/services", async (req, res, next) => {
  try {
    const professionalId = req.params.id;
    const services = await storage.getProfessionalServices(professionalId);
    res.json(services);
  } catch (error) {
    next(error);
  }
});

router.get("/api/services/:id/professionals", async (req, res, next) => {
  try {
    const serviceId = req.params.id;
    const professionals = await storage.getServiceProfessionals(serviceId);
    res.json(professionals);
  } catch (error) {
    next(error);
  }
});

router.post("/api/professional-services", async (req, res, next) => {
  try {
    const validatedData = insertProfessionalServiceSchema.parse(req.body);
    const professionalService = await storage.addServiceToProfessional(validatedData);
    res.status(201).json(professionalService);
  } catch (error) {
    next(error);
  }
});

router.delete("/api/professional-services", async (req, res, next) => {
  try {
    const schema = z.object({
      professionalId: z.string(),
      serviceId: z.string()
    });
    const validatedData = schema.parse(req.body);
    const success = await storage.removeServiceFromProfessional(
      validatedData.professionalId, 
      validatedData.serviceId
    );
    if (!success) {
      return res.status(404).json({ message: "Relationship not found" });
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
