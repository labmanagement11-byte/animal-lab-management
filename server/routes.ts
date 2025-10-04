import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertAnimalSchema, insertCageSchema, insertQrCodeSchema, insertStrainSchema, insertGenotypeSchema } from "@shared/schema";
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

  // Global search
  app.get('/api/search', isAuthenticated, async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ message: "Query parameter 'q' is required" });
      }

      const results = await storage.globalSearch(query);
      
      // Format results for frontend
      const formattedResults = [
        ...results.animals.map(animal => ({
          id: animal.id,
          type: 'animal',
          data: animal
        })),
        ...results.cages.map(cage => ({
          id: cage.id,
          type: 'cage',
          data: cage
        })),
        ...results.users.map(user => ({
          id: user.id,
          type: 'user',
          data: user
        }))
      ];

      res.json(formattedResults);
    } catch (error) {
      console.error("Error performing global search:", error);
      res.status(500).json({ message: "Failed to perform search" });
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
      // Transform date strings to Date objects
      const transformedData = {
        ...req.body,
        dateOfBirth: req.body.dateOfBirth ? new Date(req.body.dateOfBirth) : undefined,
        breedingStartDate: req.body.breedingStartDate ? new Date(req.body.breedingStartDate) : undefined,
        dateOfGenotyping: req.body.dateOfGenotyping ? new Date(req.body.dateOfGenotyping) : undefined,
      };
      
      const validatedData = insertAnimalSchema.parse(transformedData);
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
      // Transform date strings to Date objects
      const transformedData = {
        ...req.body,
        dateOfBirth: req.body.dateOfBirth ? new Date(req.body.dateOfBirth) : undefined,
        breedingStartDate: req.body.breedingStartDate ? new Date(req.body.breedingStartDate) : undefined,
        dateOfGenotyping: req.body.dateOfGenotyping ? new Date(req.body.dateOfGenotyping) : undefined,
      };
      
      const partialSchema = insertAnimalSchema.partial();
      const validatedData = partialSchema.parse(transformedData);
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
      const userId = req.user.claims.sub;
      await storage.deleteAnimal(req.params.id, userId);
      
      // Create audit log
      await storage.createAuditLog({
        userId,
        action: 'SOFT_DELETE',
        tableName: 'animals',
        recordId: req.params.id,
        changes: { deletedBy: userId },
      });

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting animal:", error);
      res.status(500).json({ message: "Failed to delete animal" });
    }
  });

  // Restore deleted animal
  app.post('/api/animals/:id/restore', isAuthenticated, async (req: any, res) => {
    try {
      const animal = await storage.restoreAnimal(req.params.id);
      
      // Create audit log
      await storage.createAuditLog({
        userId: req.user.claims.sub,
        action: 'RESTORE',
        tableName: 'animals',
        recordId: req.params.id,
        changes: null,
      });

      res.json(animal);
    } catch (error: any) {
      console.error("Error restoring animal:", error);
      if (error.message === "Animal not found") {
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to restore animal" });
    }
  });

  // Get deleted animals (trash)
  app.get('/api/animals/trash', isAuthenticated, async (req, res) => {
    try {
      const deletedAnimals = await storage.getDeletedAnimals();
      res.json(deletedAnimals);
    } catch (error) {
      console.error("Error fetching deleted animals:", error);
      res.status(500).json({ message: "Failed to fetch deleted animals" });
    }
  });

  // Permanently delete animal (Admin/Director only)
  app.delete('/api/animals/:id/permanent', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || (user.role !== 'Admin' && user.role !== 'Director')) {
        return res.status(403).json({ message: "Only Admin and Director can permanently delete items" });
      }

      await storage.permanentlyDeleteAnimal(req.params.id);
      
      // Create audit log
      await storage.createAuditLog({
        userId: req.user.claims.sub,
        action: 'PERMANENT_DELETE',
        tableName: 'animals',
        recordId: req.params.id,
        changes: null,
      });

      res.status(204).send();
    } catch (error) {
      console.error("Error permanently deleting animal:", error);
      res.status(500).json({ message: "Failed to permanently delete animal" });
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

  app.put('/api/cages/:id', isAuthenticated, async (req: any, res) => {
    try {
      const partialSchema = insertCageSchema.partial();
      const validatedData = partialSchema.parse(req.body);
      const cage = await storage.updateCage(req.params.id, validatedData);
      
      // Create audit log
      await storage.createAuditLog({
        userId: req.user.claims.sub,
        action: 'UPDATE',
        tableName: 'cages',
        recordId: req.params.id,
        changes: validatedData,
      });

      res.json(cage);
    } catch (error) {
      console.error("Error updating cage:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: fromZodError(error).toString() });
      }
      res.status(500).json({ message: "Failed to update cage" });
    }
  });

  app.delete('/api/cages/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.deleteCage(req.params.id, userId);
      
      // Create audit log
      await storage.createAuditLog({
        userId,
        action: 'SOFT_DELETE',
        tableName: 'cages',
        recordId: req.params.id,
        changes: { deletedBy: userId },
      });

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting cage:", error);
      res.status(500).json({ message: "Failed to delete cage" });
    }
  });

  // Restore deleted cage
  app.post('/api/cages/:id/restore', isAuthenticated, async (req: any, res) => {
    try {
      const cage = await storage.restoreCage(req.params.id);
      
      // Create audit log
      await storage.createAuditLog({
        userId: req.user.claims.sub,
        action: 'RESTORE',
        tableName: 'cages',
        recordId: req.params.id,
        changes: null,
      });

      res.json(cage);
    } catch (error: any) {
      console.error("Error restoring cage:", error);
      if (error.message === "Cage not found") {
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to restore cage" });
    }
  });

  // Get deleted cages (trash)
  app.get('/api/cages/trash', isAuthenticated, async (req, res) => {
    try {
      const deletedCages = await storage.getDeletedCages();
      res.json(deletedCages);
    } catch (error) {
      console.error("Error fetching deleted cages:", error);
      res.status(500).json({ message: "Failed to fetch deleted cages" });
    }
  });

  // Permanently delete cage (Admin/Director only)
  app.delete('/api/cages/:id/permanent', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || (user.role !== 'Admin' && user.role !== 'Director')) {
        return res.status(403).json({ message: "Only Admin and Director can permanently delete items" });
      }

      await storage.permanentlyDeleteCage(req.params.id);
      
      // Create audit log
      await storage.createAuditLog({
        userId: req.user.claims.sub,
        action: 'PERMANENT_DELETE',
        tableName: 'cages',
        recordId: req.params.id,
        changes: null,
      });

      res.status(204).send();
    } catch (error) {
      console.error("Error permanently deleting cage:", error);
      res.status(500).json({ message: "Failed to permanently delete cage" });
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

  // Get QR code by scan data
  app.get('/api/qr-codes/scan/:qrData', isAuthenticated, async (req, res) => {
    try {
      const qrCode = await storage.getQrCodeByData(req.params.qrData);
      if (!qrCode) {
        return res.status(404).json({ message: "QR code not found" });
      }
      res.json(qrCode);
    } catch (error) {
      console.error("Error fetching QR code:", error);
      res.status(500).json({ message: "Failed to fetch QR code" });
    }
  });

  // Claim a blank QR code - fill in cage information after scanning
  app.post('/api/qr-codes/:id/claim', isAuthenticated, async (req: any, res) => {
    try {
      const { cageId } = req.body;
      if (!cageId) {
        return res.status(400).json({ message: "cageId is required" });
      }

      const userId = req.user.claims.sub;
      const qrCode = await storage.claimQrCode(req.params.id, cageId, userId);
      
      // Create audit log
      await storage.createAuditLog({
        userId,
        action: 'CLAIM_QR',
        tableName: 'qr_codes',
        recordId: req.params.id,
        changes: { cageId, claimedBy: userId },
      });

      res.json(qrCode);
    } catch (error: any) {
      console.error("Error claiming QR code:", error);
      const errorMessage = error.message || "Failed to claim QR code";
      if (errorMessage.includes("not found") || errorMessage.includes("deleted")) {
        return res.status(404).json({ message: errorMessage });
      }
      if (errorMessage.includes("already been claimed")) {
        return res.status(409).json({ message: errorMessage });
      }
      res.status(500).json({ message: errorMessage });
    }
  });

  // Audit log routes (for Success Manager and Admin only)
  app.get('/api/audit-logs', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'Success Manager' && user?.role !== 'Admin') {
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

  // Get all users endpoint (for Admin and Success Manager only)
  // Strain routes
  app.get('/api/strains', isAuthenticated, async (req, res) => {
    try {
      const strains = await storage.getStrains();
      res.json(strains);
    } catch (error) {
      console.error("Error fetching strains:", error);
      res.status(500).json({ message: "Failed to fetch strains" });
    }
  });

  app.post('/api/strains', isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = insertStrainSchema.parse(req.body);
      const strain = await storage.createStrain(validatedData);
      
      // Create audit log
      await storage.createAuditLog({
        userId: req.user.claims.sub,
        action: 'CREATE',
        tableName: 'strains',
        recordId: strain.id,
        changes: validatedData,
      });

      res.status(201).json(strain);
    } catch (error) {
      console.error("Error creating strain:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: fromZodError(error).toString() });
      }
      res.status(500).json({ message: "Failed to create strain" });
    }
  });

  // Genotype routes
  app.get('/api/genotypes', isAuthenticated, async (req, res) => {
    try {
      const genotypes = await storage.getGenotypes();
      res.json(genotypes);
    } catch (error) {
      console.error("Error fetching genotypes:", error);
      res.status(500).json({ message: "Failed to fetch genotypes" });
    }
  });

  app.post('/api/genotypes', isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = insertGenotypeSchema.parse(req.body);
      const genotype = await storage.createGenotype(validatedData);
      
      // Create audit log
      await storage.createAuditLog({
        userId: req.user.claims.sub,
        action: 'CREATE',
        tableName: 'genotypes',
        recordId: genotype.id,
        changes: validatedData,
      });

      res.status(201).json(genotype);
    } catch (error) {
      console.error("Error creating genotype:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: fromZodError(error).toString() });
      }
      res.status(500).json({ message: "Failed to create genotype" });
    }
  });

  app.get('/api/users', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'Success Manager' && user?.role !== 'Admin') {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Update user role endpoint (for Admin and Success Manager only)
  app.put('/api/users/:email/role', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'Success Manager' && user?.role !== 'Admin') {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const { role } = req.body;
      const targetEmail = req.params.email;

      // Only admins can assign admin role
      if (role === 'Admin' && user?.role !== 'Admin') {
        return res.status(403).json({ message: "Only admins can assign admin role" });
      }

      const updatedUser = await storage.updateUserRole(targetEmail, role);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Create audit log
      await storage.createAuditLog({
        userId: req.user.claims.sub,
        action: 'UPDATE',
        tableName: 'users',
        recordId: updatedUser.id,
        changes: { role },
      });

      res.json({ message: "User role updated successfully", user: updatedUser });
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  // Admin setup endpoint - sets galindo243@live.com as admin
  app.post('/api/setup-admin', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      
      // Only allow this if the user is galindo243@live.com or already an admin
      if (currentUser?.email !== 'galindo243@live.com' && currentUser?.role !== 'Admin') {
        return res.status(403).json({ message: "Only galindo243@live.com can set up admin privileges" });
      }
      
      const updatedUser = await storage.updateUserRole('galindo243@live.com', 'Admin');
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Create audit log
      await storage.createAuditLog({
        userId: req.user.claims.sub,
        action: 'UPDATE',
        tableName: 'users',
        recordId: updatedUser.id,
        changes: { role: 'Admin' },
      });

      res.json({ message: "Admin role successfully assigned to galindo243@live.com", user: updatedUser });
    } catch (error) {
      console.error("Error setting up admin:", error);
      res.status(500).json({ message: "Failed to set up admin" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
