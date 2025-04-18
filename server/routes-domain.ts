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

const domainSchema = z.object({
  tel: z.string().nonempty("Phone is required"),
});

// Schema de validação para criação de profissionais
const createProfessionalSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  tel: z.string().min(1, "Telefone é obrigatório"),
  cpf: z.string().min(1, "CPF é obrigatório"),
  profilePicture: z.string().optional(),
  active: z.boolean().default(true),
});

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
    const validatedData = createProfessionalSchema.parse(req.body);
    const newProfessional = await storage.createProfessional(validatedData);
    res.status(201).json(newProfessional);
  } catch (error) {
    console.error("Error creating professional:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
    res.status(500).json({ message: errorMessage });
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
    console.log("Request body:", req.body); // Log do corpo da requisição
    const validatedData = insertServiceSchema.parse(req.body); // Valida os dados recebidos
    console.log("Validated data:", validatedData); // Log dos dados validados

    const service = await storage.createService(validatedData); // Cria o serviço no Supabase
    res.status(201).json(service); // Retorna o serviço criado
  } catch (error) {
    console.error("Error creating service:", error); // Log detalhado do erro
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
    res.status(500).json({ message: errorMessage }); // Retorna mensagem de erro
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

router.post("/api/domain", async (req, res, next) => {
  try {
    const validatedData = domainSchema.parse(req.body);
    // ...existing code...
  } catch (error) {
    next(error);
  }
});

export default router;
