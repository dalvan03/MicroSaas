import { storage } from "./storage";
import type { Express, Request, Response, NextFunction } from "express";

export function setupUserRoutes(app: Express): void {
  // Endpoint para listar todos os usuários (apenas admin)
  app.get("/api/users", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sessionUser = (req.session as any).user;
      if (sessionUser && sessionUser.role === "admin") {
        const users = await storage.getAllUsers();
        res.json(users);
      } else {
        res.status(401).json({ message: "Unauthorized" });
      }
    } catch (error) {
      next(error);
    }
  });

  // Endpoint para obter um usuário específico
  app.get("/api/users/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Agora o ID é tratado como string (UUID)
      const id = req.params.id;
      const sessionUser = (req.session as any).user;
      if (!sessionUser) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      // Permite acesso se o usuário logado for admin ou se for o próprio usuário
      if (sessionUser.role !== "admin" && sessionUser.id !== id) {
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
