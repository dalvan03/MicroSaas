// server/routes-transactions.ts
import { Router } from "express";
import { storage } from "./storage";
import { insertTransactionSchema } from "../shared/schema"; // ajuste o caminho se necessário
const router = Router();

// Transactions API (restrito a admin)
router.get("/api/transactions", async (req, res, next) => {
  try {
    if (!req.session || !(req.session as any).user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const sessionUser = (req.session as any).user;
    if (sessionUser.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    const transactions = await storage.getAllTransactions();
    res.json(transactions);
  } catch (error) {
    next(error);
  }
});

router.post("/api/transactions", async (req, res, next) => {
  try {
    if (!req.session || !(req.session as any).user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const sessionUser = (req.session as any).user;
    if (sessionUser.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    const validatedData = insertTransactionSchema.parse(req.body);
    const transaction = await storage.createTransaction(validatedData);
    res.status(201).json(transaction);
  } catch (error) {
    next(error);
  }
});

router.put("/api/transactions/:id", async (req, res, next) => {
  try {
    if (!req.session || !(req.session as any).user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const sessionUser = (req.session as any).user;
    if (sessionUser.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    const id = req.params.id;
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

router.delete("/api/transactions/:id", async (req, res, next) => {
  try {
    if (!req.session || !(req.session as any).user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const sessionUser = (req.session as any).user;
    if (sessionUser.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    const id = req.params.id;
    const success = await storage.deleteTransaction(id);
    if (!success) {
      return res.status(404).json({ message: "Transaction not found" });
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
