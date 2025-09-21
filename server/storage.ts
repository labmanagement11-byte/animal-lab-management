import {
  users,
  animals,
  cages,
  qrCodes,
  auditLogs,
  type User,
  type UpsertUser,
  type Animal,
  type InsertAnimal,
  type Cage,
  type InsertCage,
  type QrCode,
  type InsertQrCode,
  type AuditLog,
  type InsertAuditLog,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and, ilike, or } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Animal operations
  getAnimals(limit?: number): Promise<Animal[]>;
  getAnimal(id: string): Promise<Animal | undefined>;
  createAnimal(animal: InsertAnimal): Promise<Animal>;
  updateAnimal(id: string, animal: Partial<InsertAnimal>): Promise<Animal>;
  deleteAnimal(id: string): Promise<void>;
  searchAnimals(query: string): Promise<Animal[]>;
  
  // Cage operations
  getCages(): Promise<Cage[]>;
  getCage(id: string): Promise<Cage | undefined>;
  createCage(cage: InsertCage): Promise<Cage>;
  updateCage(id: string, cage: Partial<InsertCage>): Promise<Cage>;
  deleteCage(id: string): Promise<void>;
  
  // QR Code operations
  getQrCodes(): Promise<QrCode[]>;
  getQrCode(id: string): Promise<QrCode | undefined>;
  createQrCode(qrCode: InsertQrCode): Promise<QrCode>;
  deleteQrCode(id: string): Promise<void>;
  
  // Audit log operations
  createAuditLog(auditLog: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(limit?: number): Promise<AuditLog[]>;
  
  // Dashboard statistics
  getDashboardStats(): Promise<{
    totalAnimals: number;
    activeCages: number;
    qrCodes: number;
    healthAlerts: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Animal operations
  async getAnimals(limit = 50): Promise<Animal[]> {
    const result = await db
      .select()
      .from(animals)
      .orderBy(desc(animals.createdAt))
      .limit(limit);
    return result;
  }

  async getAnimal(id: string): Promise<Animal | undefined> {
    const [animal] = await db.select().from(animals).where(eq(animals.id, id));
    return animal;
  }

  async createAnimal(animal: InsertAnimal): Promise<Animal> {
    const [newAnimal] = await db.insert(animals).values(animal).returning();
    return newAnimal;
  }

  async updateAnimal(id: string, animal: Partial<InsertAnimal>): Promise<Animal> {
    const [updatedAnimal] = await db
      .update(animals)
      .set({ ...animal, updatedAt: new Date() })
      .where(eq(animals.id, id))
      .returning();
    return updatedAnimal;
  }

  async deleteAnimal(id: string): Promise<void> {
    await db.delete(animals).where(eq(animals.id, id));
  }

  async searchAnimals(query: string): Promise<Animal[]> {
    const result = await db
      .select()
      .from(animals)
      .where(
        or(
          ilike(animals.animalNumber, `%${query}%`),
          ilike(animals.breed, `%${query}%`),
          ilike(animals.notes, `%${query}%`)
        )
      )
      .orderBy(desc(animals.createdAt));
    return result;
  }

  // Cage operations
  async getCages(): Promise<Cage[]> {
    const result = await db.select().from(cages).orderBy(cages.cageNumber);
    return result;
  }

  async getCage(id: string): Promise<Cage | undefined> {
    const [cage] = await db.select().from(cages).where(eq(cages.id, id));
    return cage;
  }

  async createCage(cage: InsertCage): Promise<Cage> {
    const [newCage] = await db.insert(cages).values(cage).returning();
    return newCage;
  }

  async updateCage(id: string, cage: Partial<InsertCage>): Promise<Cage> {
    const [updatedCage] = await db
      .update(cages)
      .set({ ...cage, updatedAt: new Date() })
      .where(eq(cages.id, id))
      .returning();
    return updatedCage;
  }

  async deleteCage(id: string): Promise<void> {
    await db.delete(cages).where(eq(cages.id, id));
  }

  // QR Code operations
  async getQrCodes(): Promise<QrCode[]> {
    const result = await db
      .select()
      .from(qrCodes)
      .orderBy(desc(qrCodes.createdAt));
    return result;
  }

  async getQrCode(id: string): Promise<QrCode | undefined> {
    const [qrCode] = await db.select().from(qrCodes).where(eq(qrCodes.id, id));
    return qrCode;
  }

  async createQrCode(qrCode: InsertQrCode): Promise<QrCode> {
    const [newQrCode] = await db.insert(qrCodes).values(qrCode).returning();
    return newQrCode;
  }

  async deleteQrCode(id: string): Promise<void> {
    await db.delete(qrCodes).where(eq(qrCodes.id, id));
  }

  // Audit log operations
  async createAuditLog(auditLog: InsertAuditLog): Promise<AuditLog> {
    const [newLog] = await db.insert(auditLogs).values(auditLog).returning();
    return newLog;
  }

  async getAuditLogs(limit = 100): Promise<AuditLog[]> {
    const result = await db
      .select()
      .from(auditLogs)
      .orderBy(desc(auditLogs.timestamp))
      .limit(limit);
    return result;
  }

  // Dashboard statistics
  async getDashboardStats(): Promise<{
    totalAnimals: number;
    activeCages: number;
    qrCodes: number;
    healthAlerts: number;
  }> {
    const [totalAnimals] = await db
      .select({ count: sql<number>`count(*)` })
      .from(animals);

    const [activeCages] = await db
      .select({ count: sql<number>`count(*)` })
      .from(cages)
      .where(eq(cages.isActive, true));

    const [qrCodesCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(qrCodes);

    const [healthAlerts] = await db
      .select({ count: sql<number>`count(*)` })
      .from(animals)
      .where(
        or(
          eq(animals.healthStatus, 'Sick'),
          eq(animals.healthStatus, 'Quarantine')
        )
      );

    return {
      totalAnimals: totalAnimals.count,
      activeCages: activeCages.count,
      qrCodes: qrCodesCount.count,
      healthAlerts: healthAlerts.count,
    };
  }
}

export const storage = new DatabaseStorage();
