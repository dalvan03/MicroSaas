// server/routes.ts
import type { Express } from "express";
import { createServer, type Server } from "http";
import authRoutes from "./auth";
import { setupUserRoutes } from "./routes-users";
import domainRoutes from "./routes-domain";
import appointmentRoutes from "./routes-appointments";
import transactionRoutes from "./routes-transactions";

export async function registerRoutes(app: Express): Promise<Server> {
  // Rotas de autenticação
  app.use(authRoutes);
  // Rotas de usuários
  setupUserRoutes(app);
  // Rotas do domínio (Profissionais, Serviços e relacionamento)
  app.use(domainRoutes);
  // Rotas de Agendamentos e Horários de Trabalho
  app.use(appointmentRoutes);
  // Rotas de Transações
  app.use(transactionRoutes);

  const httpServer = createServer(app);
  return httpServer;
}
