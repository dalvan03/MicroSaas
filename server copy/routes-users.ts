import { storage } from "./storage";
import type { Express } from "express";

export function setupUserRoutes(app: Express): void {
  // Users API
  app.get("/api/users", async (req, res, next) => {
    try {
      // Check if user is authenticated and is admin
      if (req.isAuthenticated()) {
        const users = await storage.getAllUsers();
        res.json(users);
      } else {
        res.status(401).json({ message: "Unauthorized" });
      }
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/users/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
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