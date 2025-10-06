import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertAnimalSchema, insertCageSchema, insertQrCodeSchema, insertStrainSchema, insertGenotypeSchema, insertUserInvitationSchema, insertCompanySchema, insertUserSchema } from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";

// Helper function to safely get companyId with security check
function getCompanyIdForUser(user: any | null | undefined): string | undefined {
  if (!user) {
    throw new Error('User not found');
  }
  
  // Admin users can access all companies
  if (user.role === 'Admin') {
    return undefined;
  }
  
  // Non-admin users must have a companyId
  if (!user.companyId) {
    throw new Error('User has no company assigned');
  }
  
  return user.companyId;
}

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
  app.get('/api/dashboard/stats', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      let companyId: string | undefined;
      try {
        companyId = getCompanyIdForUser(user);
      } catch (error) {
        return res.status(403).json({ message: "User has no company assigned" });
      }
      const stats = await storage.getDashboardStats(companyId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard statistics" });
    }
  });

  // Monthly activity report (Admin/Director only)
  app.get('/api/reports/monthly', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || (user.role !== 'Admin' && user.role !== 'Director')) {
        return res.status(403).json({ message: "Only Admin and Director can access reports" });
      }

      const year = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear();
      const month = req.query.month ? parseInt(req.query.month as string) : new Date().getMonth() + 1;
      
      let companyId: string | undefined;
      try {
        companyId = getCompanyIdForUser(user);
      } catch (error) {
        return res.status(403).json({ message: "User has no company assigned" });
      }
      const report = await storage.getMonthlyActivityReport(year, month, companyId);
      res.json(report);
    } catch (error) {
      console.error("Error fetching monthly report:", error);
      res.status(500).json({ message: "Failed to fetch monthly report" });
    }
  });

  // Global search
  app.get('/api/search', isAuthenticated, async (req: any, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ message: "Query parameter 'q' is required" });
      }

      const user = await storage.getUser(req.user.claims.sub);
      let companyId: string | undefined;
      try {
        companyId = getCompanyIdForUser(user);
      } catch (error) {
        return res.status(403).json({ message: "User has no company assigned" });
      }
      const results = await storage.globalSearch(query, companyId);
      
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
  app.get('/api/animals', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      let companyId: string | undefined;
      try {
        companyId = getCompanyIdForUser(user);
      } catch (error) {
        return res.status(403).json({ message: "User has no company assigned" });
      }
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const animals = await storage.getAnimals(limit, false, companyId);
      res.json(animals);
    } catch (error) {
      console.error("Error fetching animals:", error);
      res.status(500).json({ message: "Failed to fetch animals" });
    }
  });

  app.get('/api/animals/search', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      let companyId: string | undefined;
      try {
        companyId = getCompanyIdForUser(user);
      } catch (error) {
        return res.status(403).json({ message: "User has no company assigned" });
      }
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ message: "Query parameter 'q' is required" });
      }
      const animals = await storage.searchAnimals(query, companyId);
      res.json(animals);
    } catch (error) {
      console.error("Error searching animals:", error);
      res.status(500).json({ message: "Failed to search animals" });
    }
  });

  // Get deleted animals (trash)
  app.get('/api/animals/trash', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      let companyId: string | undefined;
      try {
        companyId = getCompanyIdForUser(user);
      } catch (error) {
        return res.status(403).json({ message: "User has no company assigned" });
      }
      const deletedAnimals = await storage.getDeletedAnimals(companyId);
      res.json(deletedAnimals);
    } catch (error) {
      console.error("Error fetching deleted animals:", error);
      res.status(500).json({ message: "Failed to fetch deleted animals" });
    }
  });

  app.get('/api/animals/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      let companyId: string | undefined;
      try {
        companyId = getCompanyIdForUser(user);
      } catch (error) {
        return res.status(403).json({ message: "User has no company assigned" });
      }
      const animal = await storage.getAnimal(req.params.id, companyId);
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
      const user = await storage.getUser(req.user.claims.sub);
      
      // Transform date strings to Date objects
      const transformedData = {
        ...req.body,
        companyId: user.companyId || (() => { throw new Error('User has no company assigned'); })(),
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
      if (error instanceof Error && error.message === 'User has no company assigned') {
        return res.status(403).json({ message: "User has no company assigned" });
      }
      res.status(500).json({ message: "Failed to create animal" });
    }
  });

  app.put('/api/animals/:id', isAuthenticated, async (req: any, res) => {
    try {
      // Validate user has access to this animal
      const user = await storage.getUser(req.user.claims.sub);
      let companyId: string | undefined;
      try {
        companyId = getCompanyIdForUser(user);
      } catch (error) {
        return res.status(403).json({ message: "User has no company assigned" });
      }
      const existing = await storage.getAnimal(req.params.id, companyId);
      if (!existing) {
        return res.status(404).json({ message: "Animal not found" });
      }

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
      // Validate user has access to this animal
      const user = await storage.getUser(req.user.claims.sub);
      let companyId: string | undefined;
      try {
        companyId = getCompanyIdForUser(user);
      } catch (error) {
        return res.status(403).json({ message: "User has no company assigned" });
      }
      const existing = await storage.getAnimal(req.params.id, companyId);
      if (!existing) {
        return res.status(404).json({ message: "Animal not found" });
      }

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
      // Validate user has access to this resource
      const user = await storage.getUser(req.user.claims.sub);
      let companyId: string | undefined;
      try {
        companyId = getCompanyIdForUser(user);
      } catch (error) {
        return res.status(403).json({ message: "User has no company assigned" });
      }

      // Fetch the deleted animal to validate access
      const deletedAnimals = await storage.getDeletedAnimals(companyId);
      const animal = deletedAnimals.find(a => a.id === req.params.id);
      if (!animal) {
        return res.status(404).json({ message: "Animal not found" });
      }

      const restoredAnimal = await storage.restoreAnimal(req.params.id);
      
      // Create audit log
      await storage.createAuditLog({
        userId: req.user.claims.sub,
        action: 'RESTORE',
        tableName: 'animals',
        recordId: req.params.id,
        changes: null,
      });

      res.json(restoredAnimal);
    } catch (error: any) {
      console.error("Error restoring animal:", error);
      if (error.message === "Animal not found") {
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to restore animal" });
    }
  });

  // Permanently delete animal (Admin/Director only)
  app.delete('/api/animals/:id/permanent', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || (user.role !== 'Admin' && user.role !== 'Director')) {
        return res.status(403).json({ message: "Only Admin and Director can permanently delete items" });
      }

      // Validate user has access to this resource
      let companyId: string | undefined;
      try {
        companyId = getCompanyIdForUser(user);
      } catch (error) {
        return res.status(403).json({ message: "User has no company assigned" });
      }

      // Fetch the deleted animal to validate access
      const deletedAnimals = await storage.getDeletedAnimals(companyId);
      const animal = deletedAnimals.find(a => a.id === req.params.id);
      if (!animal) {
        return res.status(404).json({ message: "Animal not found" });
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

  // Batch permanently delete animals (Admin/Director only)
  app.post('/api/animals/batch-delete', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || (user.role !== 'Admin' && user.role !== 'Director')) {
        return res.status(403).json({ message: "Only Admin and Director can permanently delete items" });
      }

      // Validate user has access to resources
      let companyId: string | undefined;
      try {
        companyId = getCompanyIdForUser(user);
      } catch (error) {
        return res.status(403).json({ message: "User has no company assigned" });
      }

      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "Invalid request: ids array is required" });
      }

      // Fetch deleted animals to validate access
      const deletedAnimals = await storage.getDeletedAnimals(companyId);
      const deletedAnimalIds = new Set(deletedAnimals.map(a => a.id));

      const results = {
        success: [] as string[],
        failed: [] as string[],
      };

      for (const id of ids) {
        try {
          // Validate this animal belongs to user's company
          if (!deletedAnimalIds.has(id)) {
            results.failed.push(id);
            continue;
          }

          await storage.permanentlyDeleteAnimal(id);
          await storage.createAuditLog({
            userId: req.user.claims.sub,
            action: 'PERMANENT_DELETE',
            tableName: 'animals',
            recordId: id,
            changes: null,
          });
          results.success.push(id);
        } catch (error) {
          console.error(`Error deleting animal ${id}:`, error);
          results.failed.push(id);
        }
      }

      res.json({ 
        message: `Deleted ${results.success.length} of ${ids.length} animals`, 
        results 
      });
    } catch (error) {
      console.error("Error batch deleting animals:", error);
      res.status(500).json({ message: "Failed to batch delete animals" });
    }
  });

  // Cage routes
  app.get('/api/cages', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      let companyId: string | undefined;
      try {
        companyId = getCompanyIdForUser(user);
      } catch (error) {
        return res.status(403).json({ message: "User has no company assigned" });
      }
      const cages = await storage.getCages(false, companyId);
      res.json(cages);
    } catch (error) {
      console.error("Error fetching cages:", error);
      res.status(500).json({ message: "Failed to fetch cages" });
    }
  });

  // Get deleted cages (trash)
  app.get('/api/cages/trash', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      let companyId: string | undefined;
      try {
        companyId = getCompanyIdForUser(user);
      } catch (error) {
        return res.status(403).json({ message: "User has no company assigned" });
      }
      const deletedCages = await storage.getDeletedCages(companyId);
      res.json(deletedCages);
    } catch (error) {
      console.error("Error fetching deleted cages:", error);
      res.status(500).json({ message: "Failed to fetch deleted cages" });
    }
  });

  app.get('/api/cages/:id', isAuthenticated, async (req: any, res) => {
    try {
      // Validate user has access to this cage
      const user = await storage.getUser(req.user.claims.sub);
      let companyId: string | undefined;
      try {
        companyId = getCompanyIdForUser(user);
      } catch (error) {
        return res.status(403).json({ message: "User has no company assigned" });
      }
      const cage = await storage.getCage(req.params.id, companyId);
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
      const user = await storage.getUser(req.user.claims.sub);
      const dataWithCompany = {
        ...req.body,
        companyId: user.companyId || (() => { throw new Error('User has no company assigned'); })()
      };
      
      const validatedData = insertCageSchema.parse(dataWithCompany);
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
      if (error instanceof Error && error.message === 'User has no company assigned') {
        return res.status(403).json({ message: "User has no company assigned" });
      }
      res.status(500).json({ message: "Failed to create cage" });
    }
  });

  app.put('/api/cages/:id', isAuthenticated, async (req: any, res) => {
    try {
      // Validate user has access to this resource
      const user = await storage.getUser(req.user.claims.sub);
      let companyId: string | undefined;
      try {
        companyId = getCompanyIdForUser(user);
      } catch (error) {
        return res.status(403).json({ message: "User has no company assigned" });
      }

      const cage = await storage.getCage(req.params.id, companyId);
      if (!cage) {
        return res.status(404).json({ message: "Cage not found" });
      }

      const partialSchema = insertCageSchema.partial();
      const validatedData = partialSchema.parse(req.body);
      const updatedCage = await storage.updateCage(req.params.id, validatedData);
      
      // Create audit log
      await storage.createAuditLog({
        userId: req.user.claims.sub,
        action: 'UPDATE',
        tableName: 'cages',
        recordId: req.params.id,
        changes: validatedData,
      });

      res.json(updatedCage);
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
      // Validate user has access to this resource
      const user = await storage.getUser(req.user.claims.sub);
      let companyId: string | undefined;
      try {
        companyId = getCompanyIdForUser(user);
      } catch (error) {
        return res.status(403).json({ message: "User has no company assigned" });
      }

      const cage = await storage.getCage(req.params.id, companyId);
      if (!cage) {
        return res.status(404).json({ message: "Cage not found" });
      }

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
      // Validate user has access to this resource
      const user = await storage.getUser(req.user.claims.sub);
      let companyId: string | undefined;
      try {
        companyId = getCompanyIdForUser(user);
      } catch (error) {
        return res.status(403).json({ message: "User has no company assigned" });
      }

      // Fetch the deleted cage to validate access
      const deletedCages = await storage.getDeletedCages(companyId);
      const cage = deletedCages.find(c => c.id === req.params.id);
      if (!cage) {
        return res.status(404).json({ message: "Cage not found" });
      }

      const restoredCage = await storage.restoreCage(req.params.id);
      
      // Create audit log
      await storage.createAuditLog({
        userId: req.user.claims.sub,
        action: 'RESTORE',
        tableName: 'cages',
        recordId: req.params.id,
        changes: null,
      });

      res.json(restoredCage);
    } catch (error: any) {
      console.error("Error restoring cage:", error);
      if (error.message === "Cage not found") {
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to restore cage" });
    }
  });

  // Permanently delete cage (Admin/Director only)
  app.delete('/api/cages/:id/permanent', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || (user.role !== 'Admin' && user.role !== 'Director')) {
        return res.status(403).json({ message: "Only Admin and Director can permanently delete items" });
      }

      // Validate user has access to this resource
      let companyId: string | undefined;
      try {
        companyId = getCompanyIdForUser(user);
      } catch (error) {
        return res.status(403).json({ message: "User has no company assigned" });
      }

      // Fetch the deleted cage to validate access
      const deletedCages = await storage.getDeletedCages(companyId);
      const cage = deletedCages.find(c => c.id === req.params.id);
      if (!cage) {
        return res.status(404).json({ message: "Cage not found" });
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

  // Batch permanently delete cages (Admin/Director only)
  app.post('/api/cages/batch-delete', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || (user.role !== 'Admin' && user.role !== 'Director')) {
        return res.status(403).json({ message: "Only Admin and Director can permanently delete items" });
      }

      // Validate user has access to resources
      let companyId: string | undefined;
      try {
        companyId = getCompanyIdForUser(user);
      } catch (error) {
        return res.status(403).json({ message: "User has no company assigned" });
      }

      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "Invalid request: ids array is required" });
      }

      // Fetch deleted cages to validate access
      const deletedCages = await storage.getDeletedCages(companyId);
      const deletedCageIds = new Set(deletedCages.map(c => c.id));

      const results = {
        success: [] as string[],
        failed: [] as string[],
      };

      for (const id of ids) {
        try {
          // Validate this cage belongs to user's company
          if (!deletedCageIds.has(id)) {
            results.failed.push(id);
            continue;
          }

          await storage.permanentlyDeleteCage(id);
          await storage.createAuditLog({
            userId: req.user.claims.sub,
            action: 'PERMANENT_DELETE',
            tableName: 'cages',
            recordId: id,
            changes: null,
          });
          results.success.push(id);
        } catch (error) {
          console.error(`Error deleting cage ${id}:`, error);
          results.failed.push(id);
        }
      }

      res.json({ 
        message: `Deleted ${results.success.length} of ${ids.length} cages`, 
        results 
      });
    } catch (error) {
      console.error("Error batch deleting cages:", error);
      res.status(500).json({ message: "Failed to batch delete cages" });
    }
  });

  // Cleanup expired deleted items (Admin/Success Manager only)
  app.post('/api/trash/cleanup', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || (user.role !== 'Admin' && user.role !== 'Success Manager')) {
        return res.status(403).json({ message: "Only Admin and Success Manager can run cleanup" });
      }

      const result = await storage.cleanupExpiredDeleted();
      
      // Create audit log
      await storage.createAuditLog({
        userId: req.user.claims.sub,
        action: 'CLEANUP',
        tableName: 'trash',
        recordId: 'bulk',
        changes: result,
      });

      res.json({
        message: "Cleanup completed successfully",
        ...result,
      });
    } catch (error) {
      console.error("Error cleaning up expired items:", error);
      res.status(500).json({ message: "Failed to cleanup expired items" });
    }
  });

  // QR Code routes
  app.get('/api/qr-codes', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      let companyId: string | undefined;
      try {
        companyId = getCompanyIdForUser(user);
      } catch (error) {
        return res.status(403).json({ message: "User has no company assigned" });
      }
      const qrCodes = await storage.getQrCodes(false, companyId);
      res.json(qrCodes);
    } catch (error) {
      console.error("Error fetching QR codes:", error);
      res.status(500).json({ message: "Failed to fetch QR codes" });
    }
  });

  app.post('/api/qr-codes', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      const validatedData = insertQrCodeSchema.parse({
        ...req.body,
        generatedBy: req.user.claims.sub,
        companyId: user.companyId || (() => { throw new Error('User has no company assigned'); })(),
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
      if (error instanceof Error && error.message === 'User has no company assigned') {
        return res.status(403).json({ message: "User has no company assigned" });
      }
      res.status(500).json({ message: "Failed to create QR code" });
    }
  });

  // Get QR code by scan data
  app.get('/api/qr-codes/scan/:qrData', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      let companyId: string | undefined;
      try {
        companyId = getCompanyIdForUser(user);
      } catch (error) {
        return res.status(403).json({ message: "User has no company assigned" });
      }
      const qrCode = await storage.getQrCodeByData(req.params.qrData, companyId);
      if (!qrCode) {
        return res.status(404).json({ message: "QR code not found" });
      }
      res.json(qrCode);
    } catch (error) {
      console.error("Error fetching QR code:", error);
      res.status(500).json({ message: "Failed to fetch QR code" });
    }
  });

  // Generate multiple blank QR codes for printing
  app.post('/api/qr-codes/generate-blank', isAuthenticated, async (req: any, res) => {
    try {
      const { count } = req.body;
      if (!count || count < 1 || count > 20) {
        return res.status(400).json({ message: "Count must be between 1 and 20" });
      }

      const qrCodes = [];
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const baseUrl = `${req.protocol}://${req.get('host')}`;

      for (let i = 0; i < count; i++) {
        // First create QR with temporary data to get the ID
        const tempQrCode = await storage.createQrCode({
          qrData: 'temp',
          isBlank: true,
          generatedBy: userId,
          companyId: user.companyId || (() => { throw new Error('User has no company assigned'); })(),
        });
        
        // Now update with correct URL using the actual ID
        const qrCode = await storage.updateQrCode(tempQrCode.id, {
          qrData: `${baseUrl}/qr/blank/${tempQrCode.id}`,
        });
        
        qrCodes.push(qrCode);
      }

      // Create audit log
      await storage.createAuditLog({
        userId,
        action: 'GENERATE_BLANK_QR',
        tableName: 'qr_codes',
        recordId: 'multiple',
        changes: { count, qrCodeIds: qrCodes.map(q => q.id) },
      });

      res.status(201).json(qrCodes);
    } catch (error) {
      console.error("Error generating blank QR codes:", error);
      if (error instanceof Error && error.message === 'User has no company assigned') {
        return res.status(403).json({ message: "User has no company assigned" });
      }
      res.status(500).json({ message: "Failed to generate blank QR codes" });
    }
  });

  // Get blank QR codes (unclaimed)
  app.get('/api/qr-codes/blank', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      let companyId: string | undefined;
      try {
        companyId = getCompanyIdForUser(user);
      } catch (error) {
        return res.status(403).json({ message: "User has no company assigned" });
      }
      const allQrCodes = await storage.getQrCodes(false, companyId);
      const blankQrCodes = allQrCodes.filter(qr => qr.isBlank && !qr.cageId);
      res.json(blankQrCodes);
    } catch (error) {
      console.error("Error fetching blank QR codes:", error);
      res.status(500).json({ message: "Failed to fetch blank QR codes" });
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

  // Get specific QR code by ID
  app.get('/api/qr-codes/:id', isAuthenticated, async (req: any, res) => {
    try {
      // Validate user has access to this resource
      const user = await storage.getUser(req.user.claims.sub);
      let companyId: string | undefined;
      try {
        companyId = getCompanyIdForUser(user);
      } catch (error) {
        return res.status(403).json({ message: "User has no company assigned" });
      }

      const qrCode = await storage.getQrCode(req.params.id, companyId);
      if (!qrCode) {
        return res.status(404).json({ message: "QR code not found" });
      }
      res.json(qrCode);
    } catch (error) {
      console.error("Error fetching QR code:", error);
      res.status(500).json({ message: "Failed to fetch QR code" });
    }
  });

  // Delete QR code (soft delete)
  app.delete('/api/qr-codes/:id', isAuthenticated, async (req: any, res) => {
    try {
      // Validate user has access to this resource
      const user = await storage.getUser(req.user.claims.sub);
      let companyId: string | undefined;
      try {
        companyId = getCompanyIdForUser(user);
      } catch (error) {
        return res.status(403).json({ message: "User has no company assigned" });
      }

      const qrCode = await storage.getQrCode(req.params.id, companyId);
      if (!qrCode) {
        return res.status(404).json({ message: "QR code not found" });
      }

      const userId = req.user.claims.sub;
      await storage.deleteQrCode(req.params.id, userId);

      // Create audit log only after successful deletion
      await storage.createAuditLog({
        userId,
        action: 'DELETE',
        tableName: 'qr_codes',
        recordId: req.params.id,
        changes: { deletedBy: userId },
      });

      res.json({ message: "QR code deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting QR code:", error);
      if (error.message.includes("not found")) {
        return res.status(404).json({ message: error.message });
      }
      if (error.message.includes("already deleted")) {
        return res.status(409).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to delete QR code" });
    }
  });

  // Restore deleted QR code
  app.post('/api/qr-codes/:id/restore', isAuthenticated, async (req: any, res) => {
    try {
      // Validate user has access to this resource
      const user = await storage.getUser(req.user.claims.sub);
      let companyId: string | undefined;
      try {
        companyId = getCompanyIdForUser(user);
      } catch (error) {
        return res.status(403).json({ message: "User has no company assigned" });
      }

      // Fetch the deleted QR code to validate access
      const deletedQrCodes = await storage.getDeletedQrCodes(companyId);
      const qrCode = deletedQrCodes.find(q => q.id === req.params.id);
      if (!qrCode) {
        return res.status(404).json({ message: "QR code not found" });
      }

      const restoredQrCode = await storage.restoreQrCode(req.params.id);

      // Create audit log only after successful restoration
      await storage.createAuditLog({
        userId: req.user.claims.sub,
        action: 'RESTORE',
        tableName: 'qr_codes',
        recordId: req.params.id,
        changes: { restored: true },
      });

      res.json(restoredQrCode);
    } catch (error: any) {
      console.error("Error restoring QR code:", error);
      if (error.message.includes("not found")) {
        return res.status(404).json({ message: error.message });
      }
      if (error.message.includes("not deleted")) {
        return res.status(409).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to restore QR code" });
    }
  });

  // Get deleted QR codes (trash)
  app.get('/api/qr-codes-trash', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      let companyId: string | undefined;
      try {
        companyId = getCompanyIdForUser(user);
      } catch (error) {
        return res.status(403).json({ message: "User has no company assigned" });
      }
      const deletedQrCodes = await storage.getDeletedQrCodes(companyId);
      res.json(deletedQrCodes);
    } catch (error) {
      console.error("Error fetching deleted QR codes:", error);
      res.status(500).json({ message: "Failed to fetch deleted QR codes" });
    }
  });

  // Permanently delete QR code (Admin only)
  app.delete('/api/qr-codes/:id/permanent', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'Admin') {
        return res.status(403).json({ message: "Only Admin can permanently delete QR codes" });
      }

      // Validate user has access to this resource
      let companyId: string | undefined;
      try {
        companyId = getCompanyIdForUser(user);
      } catch (error) {
        return res.status(403).json({ message: "User has no company assigned" });
      }

      // Fetch the deleted QR code to validate access
      const deletedQrCodes = await storage.getDeletedQrCodes(companyId);
      const qrCode = deletedQrCodes.find(q => q.id === req.params.id);
      if (!qrCode) {
        return res.status(404).json({ message: "QR code not found" });
      }

      await storage.permanentlyDeleteQrCode(req.params.id);

      // Create audit log
      await storage.createAuditLog({
        userId: req.user.claims.sub,
        action: 'PERMANENT_DELETE',
        tableName: 'qr_codes',
        recordId: req.params.id,
        changes: { permanentlyDeleted: true },
      });

      res.json({ message: "QR code permanently deleted" });
    } catch (error) {
      console.error("Error permanently deleting QR code:", error);
      res.status(500).json({ message: "Failed to permanently delete QR code" });
    }
  });

  // Batch permanently delete QR codes (Admin only)
  app.post('/api/qr-codes/batch-delete', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'Admin') {
        return res.status(403).json({ message: "Only Admin can permanently delete QR codes" });
      }

      // Validate user has access to resources
      let companyId: string | undefined;
      try {
        companyId = getCompanyIdForUser(user);
      } catch (error) {
        return res.status(403).json({ message: "User has no company assigned" });
      }

      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "Invalid request: ids array is required" });
      }

      // Fetch deleted QR codes to validate access
      const deletedQrCodes = await storage.getDeletedQrCodes(companyId);
      const deletedQrCodeIds = new Set(deletedQrCodes.map(q => q.id));

      const results = {
        success: [] as string[],
        failed: [] as string[],
      };

      for (const id of ids) {
        try {
          // Validate this QR code belongs to user's company
          if (!deletedQrCodeIds.has(id)) {
            results.failed.push(id);
            continue;
          }

          await storage.permanentlyDeleteQrCode(id);
          await storage.createAuditLog({
            userId: req.user.claims.sub,
            action: 'PERMANENT_DELETE',
            tableName: 'qr_codes',
            recordId: id,
            changes: { permanentlyDeleted: true },
          });
          results.success.push(id);
        } catch (error) {
          console.error(`Error deleting QR code ${id}:`, error);
          results.failed.push(id);
        }
      }

      res.json({ 
        message: `Deleted ${results.success.length} of ${ids.length} QR codes`, 
        results 
      });
    } catch (error) {
      console.error("Error batch deleting QR codes:", error);
      res.status(500).json({ message: "Failed to batch delete QR codes" });
    }
  });

  // Audit log routes (for Success Manager and Admin only)
  app.get('/api/audit-logs', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'Success Manager' && user?.role !== 'Admin') {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      
      // Admin can see all logs, Success Manager only sees logs from their company
      let companyId: string | undefined;
      try {
        companyId = getCompanyIdForUser(user);
      } catch (error) {
        return res.status(403).json({ message: "User has no company assigned" });
      }
      
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const logs = await storage.getAuditLogs(limit, companyId);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });

  // Get audit logs for a specific cage (anyone can see their cage's history)
  app.get('/api/cages/:id/audit-logs', isAuthenticated, async (req, res) => {
    try {
      const logs = await storage.getAuditLogsByRecord('cages', req.params.id);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching cage audit logs:", error);
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });

  // Get all users endpoint (for Admin and Success Manager only)
  // Strain routes
  app.get('/api/strains', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      let companyId: string | undefined;
      try {
        companyId = getCompanyIdForUser(user);
      } catch (error) {
        return res.status(403).json({ message: "User has no company assigned" });
      }
      const strains = await storage.getStrains(companyId);
      res.json(strains);
    } catch (error) {
      console.error("Error fetching strains:", error);
      res.status(500).json({ message: "Failed to fetch strains" });
    }
  });

  app.post('/api/strains', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      const dataWithCompany = {
        ...req.body,
        companyId: user.companyId || (() => { throw new Error('User has no company assigned'); })()
      };
      
      const validatedData = insertStrainSchema.parse(dataWithCompany);
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
      if (error instanceof Error && error.message === 'User has no company assigned') {
        return res.status(403).json({ message: "User has no company assigned" });
      }
      res.status(500).json({ message: "Failed to create strain" });
    }
  });

  app.get('/api/strains/trash', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      let companyId: string | undefined;
      try {
        companyId = getCompanyIdForUser(user);
      } catch (error) {
        return res.status(403).json({ message: "User has no company assigned" });
      }
      const deletedStrains = await storage.getDeletedStrains(companyId);
      res.json(deletedStrains);
    } catch (error) {
      console.error("Error fetching deleted strains:", error);
      res.status(500).json({ message: "Failed to fetch deleted strains" });
    }
  });

  app.delete('/api/strains/:id', isAuthenticated, async (req: any, res) => {
    try {
      // Validate user has access to this resource
      const user = await storage.getUser(req.user.claims.sub);
      let companyId: string | undefined;
      try {
        companyId = getCompanyIdForUser(user);
      } catch (error) {
        return res.status(403).json({ message: "User has no company assigned" });
      }

      const strain = await storage.getStrain(req.params.id, companyId);
      if (!strain) {
        return res.status(404).json({ message: "Strain not found" });
      }

      await storage.deleteStrain(req.params.id, req.user.claims.sub);
      
      // Create audit log
      await storage.createAuditLog({
        userId: req.user.claims.sub,
        action: 'DELETE',
        tableName: 'strains',
        recordId: req.params.id,
        changes: null,
      });

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting strain:", error);
      res.status(500).json({ message: "Failed to delete strain" });
    }
  });

  app.post('/api/strains/:id/restore', isAuthenticated, async (req: any, res) => {
    try {
      // Validate user has access to this resource
      const user = await storage.getUser(req.user.claims.sub);
      let companyId: string | undefined;
      try {
        companyId = getCompanyIdForUser(user);
      } catch (error) {
        return res.status(403).json({ message: "User has no company assigned" });
      }

      // Fetch the deleted strain to validate access
      const deletedStrains = await storage.getDeletedStrains(companyId);
      const strain = deletedStrains.find(s => s.id === req.params.id);
      if (!strain) {
        return res.status(404).json({ message: "Strain not found" });
      }

      const restoredStrain = await storage.restoreStrain(req.params.id);
      
      // Create audit log
      await storage.createAuditLog({
        userId: req.user.claims.sub,
        action: 'RESTORE',
        tableName: 'strains',
        recordId: req.params.id,
        changes: null,
      });

      res.json(restoredStrain);
    } catch (error) {
      console.error("Error restoring strain:", error);
      res.status(500).json({ message: "Failed to restore strain" });
    }
  });

  app.delete('/api/strains/:id/permanent', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'Admin' && user?.role !== 'Director') {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      // Validate user has access to this resource
      let companyId: string | undefined;
      try {
        companyId = getCompanyIdForUser(user);
      } catch (error) {
        return res.status(403).json({ message: "User has no company assigned" });
      }

      // Fetch the deleted strain to validate access
      const deletedStrains = await storage.getDeletedStrains(companyId);
      const strain = deletedStrains.find(s => s.id === req.params.id);
      if (!strain) {
        return res.status(404).json({ message: "Strain not found" });
      }

      await storage.permanentlyDeleteStrain(req.params.id);
      
      // Create audit log
      await storage.createAuditLog({
        userId: req.user.claims.sub,
        action: 'PERMANENT_DELETE',
        tableName: 'strains',
        recordId: req.params.id,
        changes: null,
      });

      res.status(204).send();
    } catch (error) {
      console.error("Error permanently deleting strain:", error);
      res.status(500).json({ message: "Failed to permanently delete strain" });
    }
  });

  // Batch permanently delete strains (Admin/Director only)
  app.post('/api/strains/batch-delete', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'Admin' && user?.role !== 'Director') {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      // Validate user has access to resources
      let companyId: string | undefined;
      try {
        companyId = getCompanyIdForUser(user);
      } catch (error) {
        return res.status(403).json({ message: "User has no company assigned" });
      }

      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "Invalid request: ids array is required" });
      }

      // Fetch deleted strains to validate access
      const deletedStrains = await storage.getDeletedStrains(companyId);
      const deletedStrainIds = new Set(deletedStrains.map(s => s.id));

      const results = {
        success: [] as string[],
        failed: [] as string[],
      };

      for (const id of ids) {
        try {
          // Validate this strain belongs to user's company
          if (!deletedStrainIds.has(id)) {
            results.failed.push(id);
            continue;
          }

          await storage.permanentlyDeleteStrain(id);
          await storage.createAuditLog({
            userId: req.user.claims.sub,
            action: 'PERMANENT_DELETE',
            tableName: 'strains',
            recordId: id,
            changes: null,
          });
          results.success.push(id);
        } catch (error) {
          console.error(`Error deleting strain ${id}:`, error);
          results.failed.push(id);
        }
      }

      res.json({ 
        message: `Deleted ${results.success.length} of ${ids.length} strains`, 
        results 
      });
    } catch (error) {
      console.error("Error batch deleting strains:", error);
      res.status(500).json({ message: "Failed to batch delete strains" });
    }
  });

  // Genotype routes
  app.get('/api/genotypes', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      let companyId: string | undefined;
      try {
        companyId = getCompanyIdForUser(user);
      } catch (error) {
        return res.status(403).json({ message: "User has no company assigned" });
      }
      const genotypes = await storage.getGenotypes(companyId);
      res.json(genotypes);
    } catch (error) {
      console.error("Error fetching genotypes:", error);
      res.status(500).json({ message: "Failed to fetch genotypes" });
    }
  });

  app.post('/api/genotypes', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      
      const dataWithCompany = {
        ...req.body,
        companyId: user.companyId || (() => { throw new Error('User has no company assigned'); })()
      };
      
      const validatedData = insertGenotypeSchema.parse(dataWithCompany);
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
      if (error instanceof Error && error.message === 'User has no company assigned') {
        return res.status(403).json({ message: "User has no company assigned" });
      }
      res.status(500).json({ message: "Failed to create genotype" });
    }
  });

  app.delete('/api/genotypes/:id', isAuthenticated, async (req: any, res) => {
    try {
      // Validate user has access to this resource
      const user = await storage.getUser(req.user.claims.sub);
      let companyId: string | undefined;
      try {
        companyId = getCompanyIdForUser(user);
      } catch (error) {
        return res.status(403).json({ message: "User has no company assigned" });
      }

      const genotype = await storage.getGenotype(req.params.id, companyId);
      if (!genotype) {
        return res.status(404).json({ message: "Genotype not found" });
      }

      await storage.deleteGenotype(req.params.id);
      
      // Create audit log
      await storage.createAuditLog({
        userId: req.user.claims.sub,
        action: 'DELETE',
        tableName: 'genotypes',
        recordId: req.params.id,
        changes: null,
      });

      res.json({ message: "Genotype deleted successfully" });
    } catch (error) {
      console.error("Error deleting genotype:", error);
      res.status(500).json({ message: "Failed to delete genotype" });
    }
  });

  app.get('/api/users', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'Success Manager' && user?.role !== 'Admin') {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      
      // Admin can see all users, Success Manager only sees users from their company
      let companyId: string | undefined;
      try {
        companyId = getCompanyIdForUser(user);
      } catch (error) {
        return res.status(403).json({ message: "User has no company assigned" });
      }
      
      const users = await storage.getAllUsers(companyId);
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Create user endpoint (for Admin and Director only)
  app.post('/api/users', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (currentUser?.role !== 'Admin' && currentUser?.role !== 'Director') {
        return res.status(403).json({ message: "Only Admin and Director can create users" });
      }

      const validatedData = insertUserSchema.parse(req.body);

      // Only admins can assign admin role
      if ((validatedData.role as unknown as string) === 'Admin' && currentUser?.role !== 'Admin') {
        return res.status(403).json({ message: "Only admins can create admin users" });
      }

      // Security: Build clean payload with enforced company assignment
      let userPayload: any;
      
      if (currentUser?.role === 'Director') {
        // Directors can only create users in their own company
        if (!currentUser.companyId) {
          return res.status(403).json({ message: "Director must have a company assigned to create users" });
        }
        // Build payload with Director's company, ignoring client-supplied companyId
        userPayload = {
          email: validatedData.email,
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          role: validatedData.role,
          companyId: currentUser.companyId, // Always use Director's company
          profileImageUrl: validatedData.profileImageUrl,
        };
      } else if (currentUser?.role === 'Admin') {
        // Admins must explicitly specify a valid company
        if (!validatedData.companyId) {
          return res.status(400).json({ message: "Admin must specify a company for the new user" });
        }
        // Verify the company exists
        const company = await storage.getCompany(validatedData.companyId as unknown as string);
        if (!company) {
          return res.status(400).json({ message: "Invalid company specified" });
        }
        // Use Admin-specified company
        userPayload = {
          email: validatedData.email,
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          role: validatedData.role,
          companyId: validatedData.companyId,
          profileImageUrl: validatedData.profileImageUrl,
        };
      }

      // Check if user already exists
      const existingUsers = await storage.getAllUsers();
      const userExists = existingUsers.some(u => u.email === userPayload.email);
      if (userExists) {
        return res.status(400).json({ message: "User with this email already exists" });
      }

      const newUser = await storage.upsertUser(userPayload);
      
      // Create audit log
      await storage.createAuditLog({
        userId: req.user.claims.sub,
        action: 'CREATE',
        tableName: 'users',
        recordId: newUser.id,
        changes: userPayload,
      });

      res.status(201).json({ message: "User created successfully", user: newUser });
    } catch (error) {
      console.error("Error creating user:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create user" });
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

  // Update user name endpoint
  app.put('/api/users/:id/name', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      const targetUserId = req.params.id;
      
      // Users can update their own name, or admins/success managers can update any user's name
      if (currentUser?.id !== targetUserId && 
          currentUser?.role !== 'Success Manager' && 
          currentUser?.role !== 'Admin') {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const { firstName, lastName } = req.body;

      if (!firstName || !lastName) {
        return res.status(400).json({ message: "First name and last name are required" });
      }

      const updatedUser = await storage.updateUserName(targetUserId, firstName, lastName);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Create audit log
      await storage.createAuditLog({
        userId: req.user.claims.sub,
        action: 'UPDATE',
        tableName: 'users',
        recordId: updatedUser.id,
        changes: { firstName, lastName },
      });

      res.json({ message: "User name updated successfully", user: updatedUser });
    } catch (error) {
      console.error("Error updating user name:", error);
      res.status(500).json({ message: "Failed to update user name" });
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

  // Block user endpoint (Admin only)
  app.post('/api/users/:id/block', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'Admin') {
        return res.status(403).json({ message: "Only Admin can block users" });
      }

      const blockedUser = await storage.blockUser(req.params.id, req.user.claims.sub);
      
      if (!blockedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Create audit log
      await storage.createAuditLog({
        userId: req.user.claims.sub,
        action: 'UPDATE',
        tableName: 'users',
        recordId: blockedUser.id,
        changes: { isBlocked: true },
      });

      res.json({ message: "User blocked successfully", user: blockedUser });
    } catch (error) {
      console.error("Error blocking user:", error);
      res.status(500).json({ message: "Failed to block user" });
    }
  });

  // Unblock user endpoint (Admin only)
  app.post('/api/users/:id/unblock', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'Admin') {
        return res.status(403).json({ message: "Only Admin can unblock users" });
      }

      const unblockedUser = await storage.unblockUser(req.params.id);
      
      if (!unblockedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Create audit log
      await storage.createAuditLog({
        userId: req.user.claims.sub,
        action: 'UPDATE',
        tableName: 'users',
        recordId: unblockedUser.id,
        changes: { isBlocked: false },
      });

      res.json({ message: "User unblocked successfully", user: unblockedUser });
    } catch (error) {
      console.error("Error unblocking user:", error);
      res.status(500).json({ message: "Failed to unblock user" });
    }
  });

  // Delete user endpoint (Admin only)
  app.delete('/api/users/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'Admin') {
        return res.status(403).json({ message: "Only Admin can delete users" });
      }

      // Check if target user exists
      const targetUser = await storage.getUser(req.params.id);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }

      await storage.deleteUser(req.params.id, req.user.claims.sub);
      
      // Create audit log
      await storage.createAuditLog({
        userId: req.user.claims.sub,
        action: 'DELETE',
        tableName: 'users',
        recordId: req.params.id,
        changes: { deletedAt: new Date() },
      });

      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Get deleted users (trash)
  app.get('/api/users-trash', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      
      // Admin can see all deleted users, others only see their company's deleted users
      let companyId: string | undefined;
      try {
        companyId = getCompanyIdForUser(user);
      } catch (error) {
        return res.status(403).json({ message: "User has no company assigned" });
      }
      
      const deletedUsers = await storage.getDeletedUsers(companyId);
      res.json(deletedUsers);
    } catch (error) {
      console.error("Error fetching deleted users:", error);
      res.status(500).json({ message: "Failed to fetch deleted users" });
    }
  });

  // Restore user endpoint (Admin only)
  app.post('/api/users/:id/restore', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'Admin') {
        return res.status(403).json({ message: "Only Admin can restore users" });
      }

      const restoredUser = await storage.restoreUser(req.params.id);
      
      if (!restoredUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Create audit log
      await storage.createAuditLog({
        userId: req.user.claims.sub,
        action: 'UPDATE',
        tableName: 'users',
        recordId: restoredUser.id,
        changes: { deletedAt: null },
      });

      res.json({ message: "User restored successfully", user: restoredUser });
    } catch (error) {
      console.error("Error restoring user:", error);
      res.status(500).json({ message: "Failed to restore user" });
    }
  });

  // Permanently delete user (Admin only)
  app.delete('/api/users/:id/permanent', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== 'Admin') {
        return res.status(403).json({ message: "Only Admin can permanently delete users" });
      }

      await storage.permanentlyDeleteUser(req.params.id);
      
      // Create audit log
      await storage.createAuditLog({
        userId: req.user.claims.sub,
        action: 'DELETE',
        tableName: 'users',
        recordId: req.params.id,
        changes: { permanent: true },
      });

      res.json({ message: "User permanently deleted" });
    } catch (error) {
      console.error("Error permanently deleting user:", error);
      res.status(500).json({ message: "Failed to permanently delete user" });
    }
  });

  // Batch permanently delete users (Admin only)
  app.post('/api/users/batch-delete', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== 'Admin') {
        return res.status(403).json({ message: "Only Admin can permanently delete users" });
      }

      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "Invalid request: ids array is required" });
      }

      const results = {
        success: [] as string[],
        failed: [] as string[],
      };

      for (const id of ids) {
        try {
          await storage.permanentlyDeleteUser(id);
          await storage.createAuditLog({
            userId: req.user.claims.sub,
            action: 'DELETE',
            tableName: 'users',
            recordId: id,
            changes: { permanent: true },
          });
          results.success.push(id);
        } catch (error) {
          console.error(`Error deleting user ${id}:`, error);
          results.failed.push(id);
        }
      }

      res.json({ 
        message: `Deleted ${results.success.length} of ${ids.length} users`, 
        results 
      });
    } catch (error) {
      console.error("Error batch deleting users:", error);
      res.status(500).json({ message: "Failed to batch delete users" });
    }
  });

  // User invitation endpoints (Admin and Director only)
  app.post('/api/invitations', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'Admin' && user?.role !== 'Director') {
        return res.status(403).json({ message: "Only Admin and Director can create invitations" });
      }

      const { email, role } = req.body;
      if (!email || !role) {
        return res.status(400).json({ message: "Email and role are required" });
      }

      // Generate unique token
      const token = crypto.randomUUID();
      
      // Set expiration date (7 days from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const invitation = await storage.createInvitation({
        email,
        role,
        invitedBy: req.user.claims.sub,
        token,
        status: 'pending',
        expiresAt,
        companyId: user.companyId || (() => { throw new Error('User has no company assigned'); })(),
      });

      // Create audit log
      await storage.createAuditLog({
        userId: req.user.claims.sub,
        action: 'CREATE',
        tableName: 'user_invitations',
        recordId: invitation.id,
        changes: { email, role },
      });

      const invitationLink = `${req.protocol}://${req.get('host')}/api/invitations/accept/${token}`;

      // Send invitation email
      let emailSent = false;
      let emailError = null;
      try {
        const { sendInvitationEmail } = await import('./email.js');
        const inviterName = user.firstName && user.lastName 
          ? `${user.firstName} ${user.lastName}`
          : undefined;
        await sendInvitationEmail(email, role, invitationLink, inviterName);
        emailSent = true;
        console.log(`✅ Invitation email sent successfully to ${email}`);
      } catch (error: any) {
        emailError = error;
        console.error("❌ Error sending invitation email:", {
          message: error.message,
          stack: error.stack,
          details: error.response?.body || error
        });
      }

      res.status(201).json({ 
        invitation,
        invitationLink,
        emailSent,
        emailError: emailError ? emailError.message : null
      });
    } catch (error) {
      console.error("Error creating invitation:", error);
      if (error instanceof Error && error.message === 'User has no company assigned') {
        return res.status(403).json({ message: "User has no company assigned" });
      }
      res.status(500).json({ message: "Failed to create invitation" });
    }
  });

  app.get('/api/invitations', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'Admin' && user?.role !== 'Director') {
        return res.status(403).json({ message: "Only Admin and Director can view invitations" });
      }

      // Admin can see all invitations, Director only sees invitations from their company
      let companyId: string | undefined;
      try {
        companyId = getCompanyIdForUser(user);
      } catch (error) {
        return res.status(403).json({ message: "User has no company assigned" });
      }

      const invitations = await storage.getInvitations(companyId);
      res.json(invitations);
    } catch (error) {
      console.error("Error fetching invitations:", error);
      res.status(500).json({ message: "Failed to fetch invitations" });
    }
  });

  app.get('/api/invitations/verify/:token', async (req, res) => {
    try {
      const invitation = await storage.getInvitationByToken(req.params.token);
      
      if (!invitation) {
        return res.status(404).json({ message: "Invitation not found" });
      }

      if (invitation.status !== 'pending') {
        return res.status(400).json({ message: "Invitation already used or expired" });
      }

      if (new Date() > new Date(invitation.expiresAt)) {
        await storage.expireInvitation(invitation.id);
        return res.status(400).json({ message: "Invitation has expired" });
      }

      res.json({ 
        valid: true, 
        email: invitation.email, 
        role: invitation.role 
      });
    } catch (error) {
      console.error("Error verifying invitation:", error);
      res.status(500).json({ message: "Failed to verify invitation" });
    }
  });

  // Company management routes (Admin only)
  app.get('/api/companies', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'Admin') {
        return res.status(403).json({ message: "Only Admin can manage companies" });
      }

      const companies = await storage.getCompanies();
      res.json(companies);
    } catch (error) {
      console.error("Error fetching companies:", error);
      res.status(500).json({ message: "Failed to fetch companies" });
    }
  });

  app.get('/api/companies/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'Admin') {
        return res.status(403).json({ message: "Only Admin can manage companies" });
      }

      const company = await storage.getCompany(req.params.id);
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }

      res.json(company);
    } catch (error) {
      console.error("Error fetching company:", error);
      res.status(500).json({ message: "Failed to fetch company" });
    }
  });

  app.post('/api/companies', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'Admin') {
        return res.status(403).json({ message: "Only Admin can create companies" });
      }

      const result = insertCompanySchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: fromZodError(result.error).message 
        });
      }

      const company = await storage.createCompany(result.data);

      // Create audit log
      await storage.createAuditLog({
        userId: req.user.claims.sub,
        action: 'CREATE',
        tableName: 'companies',
        recordId: company.id,
        changes: result.data,
      });

      res.status(201).json(company);
    } catch (error) {
      console.error("Error creating company:", error);
      res.status(500).json({ message: "Failed to create company" });
    }
  });

  app.patch('/api/companies/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'Admin') {
        return res.status(403).json({ message: "Only Admin can update companies" });
      }

      const result = insertCompanySchema.partial().safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: fromZodError(result.error).message 
        });
      }

      const company = await storage.updateCompany(req.params.id, result.data);

      // Create audit log
      await storage.createAuditLog({
        userId: req.user.claims.sub,
        action: 'UPDATE',
        tableName: 'companies',
        recordId: company.id,
        changes: result.data,
      });

      res.json(company);
    } catch (error) {
      console.error("Error updating company:", error);
      res.status(500).json({ message: "Failed to update company" });
    }
  });

  app.delete('/api/companies/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'Admin') {
        return res.status(403).json({ message: "Only Admin can delete companies" });
      }

      await storage.deleteCompany(req.params.id);

      // Create audit log
      await storage.createAuditLog({
        userId: req.user.claims.sub,
        action: 'DELETE',
        tableName: 'companies',
        recordId: req.params.id,
        changes: {},
      });

      res.json({ message: "Company deleted successfully" });
    } catch (error) {
      console.error("Error deleting company:", error);
      res.status(500).json({ message: "Failed to delete company" });
    }
  });

  // Get company overview with all filtered data
  app.get('/api/companies/:id/overview', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'Admin') {
        return res.status(403).json({ message: "Only Admin can view company overview" });
      }

      const overview = await storage.getCompanyOverview(req.params.id);
      res.json(overview);
    } catch (error) {
      console.error("Error fetching company overview:", error);
      res.status(500).json({ message: "Failed to fetch company overview" });
    }
  });

  // Get users by company
  app.get('/api/companies/:id/users', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'Admin') {
        return res.status(403).json({ message: "Only Admin can view company users" });
      }

      const users = await storage.getUsersByCompany(req.params.id);
      res.json(users);
    } catch (error) {
      console.error("Error fetching company users:", error);
      res.status(500).json({ message: "Failed to fetch company users" });
    }
  });

  // Assign user to company
  app.post('/api/companies/:id/users', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'Admin') {
        return res.status(403).json({ message: "Only Admin can assign users to companies" });
      }

      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ message: "userId is required" });
      }

      const updatedUser = await storage.assignUserToCompany(userId, req.params.id);

      // Create audit log
      await storage.createAuditLog({
        userId: req.user.claims.sub,
        action: 'UPDATE',
        tableName: 'users',
        recordId: userId,
        changes: { companyId: req.params.id },
      });

      res.json(updatedUser);
    } catch (error) {
      console.error("Error assigning user to company:", error);
      res.status(500).json({ message: "Failed to assign user to company" });
    }
  });

  // Remove user from company
  app.delete('/api/companies/:id/users/:userId', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'Admin') {
        return res.status(403).json({ message: "Only Admin can remove users from companies" });
      }

      const updatedUser = await storage.removeUserFromCompany(req.params.userId);

      // Create audit log
      await storage.createAuditLog({
        userId: req.user.claims.sub,
        action: 'UPDATE',
        tableName: 'users',
        recordId: req.params.userId,
        changes: { companyId: null },
      });

      res.json(updatedUser);
    } catch (error) {
      console.error("Error removing user from company:", error);
      res.status(500).json({ message: "Failed to remove user from company" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
