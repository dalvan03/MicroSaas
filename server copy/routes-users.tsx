import { storage } from "./storage";
import type { Express, Request, Response, NextFunction } from "express";

export function setupUserRoutes(app: Express): void {
  // Users API
  app.get("/api/users", async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Verifica se o usuário está autenticado e se é admin
      if (req.session && req.session.user && req.session.user.role === "admin") {
        const users = await storage.getAllUsers();
        res.json(users);
      } else {
        res.status(401).json({ message: "Unauthorized" });
      }
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/users/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Supondo que os IDs agora sejam strings (UUID), retire o parseInt
      const id = req.params.id;
      // Verifica se há sessão e permite acesso somente se o usuário for admin ou se for o próprio usuário
      if (!req.session || !req.session.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const requestingUser = req.session.user;
      if (requestingUser.role !== "admin" && requestingUser.id !== id) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      next(error);
    }
  });
}
