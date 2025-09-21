import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertAnimalSchema, insertCageSchema, insertQrCodeSchema } from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Dashboard statistics
  app.get('/api/dashboard/stats', isAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard statistics" });
    }
  });

  // Animal routes
  app.get('/api/animals', isAuthenticated, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const animals = await storage.getAnimals(limit);
      res.json(animals);
    } catch (error) {
      console.error("Error fetching animals:", error);
      res.status(500).json({ message: "Failed to fetch animals" });
    }
  });

  app.get('/api/animals/search', isAuthenticated, async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ message: "Query parameter 'q' is required" });
      }
      const animals = await storage.searchAnimals(query);
      res.json(animals);
    } catch (error) {
      console.error("Error searching animals:", error);
      res.status(500).json({ message: "Failed to search animals" });
    }
  });

  app.get('/api/animals/:id', isAuthenticated, async (req, res) => {
    try {
      const animal = await storage.getAnimal(req.params.id);
      if (!animal) {
        return res.status(404).json({ message: "Animal not found" });
      }
      res.json(animal);
    } catch (error) {
      console.error("Error fetching animal:", error);
      res.status(500).json({ message: "Failed to fetch animal" });
    }
  });

  app.post('/api/animals', isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = insertAnimalSchema.parse(req.body);
      const animal = await storage.createAnimal(validatedData);
      
      // Create audit log
      await storage.createAuditLog({
        userId: req.user.claims.sub,
        action: 'CREATE',
        tableName: 'animals',
        recordId: animal.id,
        changes: validatedData,
      });

      res.status(201).json(animal);
    } catch (error) {
      console.error("Error creating animal:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: fromZodError(error).toString() });
      }
      res.status(500).json({ message: "Failed to create animal" });
    }
  });

  app.put('/api/animals/:id', isAuthenticated, async (req: any, res) => {
    try {
      const partialSchema = insertAnimalSchema.partial();
      const validatedData = partialSchema.parse(req.body);
      const animal = await storage.updateAnimal(req.params.id, validatedData);
      
      // Create audit log
      await storage.createAuditLog({
        userId: req.user.claims.sub,
        action: 'UPDATE',
        tableName: 'animals',
        recordId: req.params.id,
        changes: validatedData,
      });

      res.json(animal);
    } catch (error) {
      console.error("Error updating animal:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: fromZodError(error).toString() });
      }
      res.status(500).json({ message: "Failed to update animal" });
    }
  });

  app.delete('/api/animals/:id', isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteAnimal(req.params.id);
      
      // Create audit log
      await storage.createAuditLog({
        userId: req.user.claims.sub,
        action: 'DELETE',
        tableName: 'animals',
        recordId: req.params.id,
        changes: null,
      });

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting animal:", error);
      res.status(500).json({ message: "Failed to delete animal" });
    }
  });

  // Cage routes
  app.get('/api/cages', isAuthenticated, async (req, res) => {
    try {
      const cages = await storage.getCages();
      res.json(cages);
    } catch (error) {
      console.error("Error fetching cages:", error);
      res.status(500).json({ message: "Failed to fetch cages" });
    }
  });

  app.get('/api/cages/:id', isAuthenticated, async (req, res) => {
    try {
      const cage = await storage.getCage(req.params.id);
      if (!cage) {
        return res.status(404).json({ message: "Cage not found" });
      }
      res.json(cage);
    } catch (error) {
      console.error("Error fetching cage:", error);
      res.status(500).json({ message: "Failed to fetch cage" });
    }
  });

  app.post('/api/cages', isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = insertCageSchema.parse(req.body);
      const cage = await storage.createCage(validatedData);
      
      // Create audit log
      await storage.createAuditLog({
        userId: req.user.claims.sub,
        action: 'CREATE',
        tableName: 'cages',
        recordId: cage.id,
        changes: validatedData,
      });

      res.status(201).json(cage);
    } catch (error) {
      console.error("Error creating cage:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: fromZodError(error).toString() });
      }
      res.status(500).json({ message: "Failed to create cage" });
    }
  });

  // QR Code routes
  app.get('/api/qr-codes', isAuthenticated, async (req, res) => {
    try {
      const qrCodes = await storage.getQrCodes();
      res.json(qrCodes);
    } catch (error) {
      console.error("Error fetching QR codes:", error);
      res.status(500).json({ message: "Failed to fetch QR codes" });
    }
  });

  app.post('/api/qr-codes', isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = insertQrCodeSchema.parse({
        ...req.body,
        generatedBy: req.user.claims.sub,
      });
      const qrCode = await storage.createQrCode(validatedData);
      
      // Create audit log
      await storage.createAuditLog({
        userId: req.user.claims.sub,
        action: 'CREATE',
        tableName: 'qr_codes',
        recordId: qrCode.id,
        changes: validatedData,
      });

      res.status(201).json(qrCode);
    } catch (error) {
      console.error("Error creating QR code:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: fromZodError(error).toString() });
      }
      res.status(500).json({ message: "Failed to create QR code" });
    }
  });

  // Audit log routes (for Success Manager only)
  app.get('/api/audit-logs', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'Success Manager') {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const logs = await storage.getAuditLogs(limit);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
