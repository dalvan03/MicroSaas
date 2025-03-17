import { storage } from "./storage";
import type { Express, Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

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

  // Endpoint de Social Login
  app.post("/api/social-login", async (req: Request, res: Response, next: NextFunction) => {
    const { access_token } = req.body;
    if (!access_token) {
      return res.status(400).json({ error: "Missing access_token." });
    }
    try {
      // Valida o token JWT usando a chave SUPABASE_JWT_SECRET definida no backend
      const decoded = jwt.verify(access_token, process.env.SUPABASE_JWT_SECRET!);
      // Cria a sessão Express com os dados extraídos do token.
      // Aqui, usamos "sub" como id; ajuste conforme as claims disponíveis no token.
      (req.session as any).user = {
        id: (decoded as any).sub,
        email: (decoded as any).email,
        name: (decoded as any).name,
        role: (decoded as any).role,
      };
      return res.json({ user: (req.session as any).user });
    } catch (err) {
      console.error("Invalid JWT in social-login", err);
      return res.status(401).json({ error: "Invalid token." });
    }
  });

  // Endpoint para obter um usuário específico
  app.get("/api/users/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
      // O ID é tratado como string (UUID)
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
