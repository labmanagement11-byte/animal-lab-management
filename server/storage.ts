import {
  users,
  animals,
  cages,
  qrCodes,
  auditLogs,
  fileAttachments,
  strains,
  genotypes,
  userInvitations,
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
  type FileAttachment,
  type InsertFileAttachment,
  type Strain,
  type InsertStrain,
  type Genotype,
  type InsertGenotype,
  type UserInvitation,
  type InsertUserInvitation,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and, ilike, or, isNull, isNotNull, lte } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserRole(email: string, role: 'Admin' | 'Success Manager' | 'Director' | 'Employee'): Promise<User | undefined>;
  blockUser(id: string, blockedBy: string): Promise<User | undefined>;
  unblockUser(id: string): Promise<User | undefined>;
  deleteUser(id: string, deletedBy: string): Promise<void>;
  restoreUser(id: string): Promise<User | undefined>;
  
  // Animal operations
  getAnimals(limit?: number, includeDeleted?: boolean): Promise<Animal[]>;
  getAnimal(id: string): Promise<Animal | undefined>;
  createAnimal(animal: InsertAnimal): Promise<Animal>;
  updateAnimal(id: string, animal: Partial<InsertAnimal>): Promise<Animal>;
  deleteAnimal(id: string, userId: string): Promise<void>;
  restoreAnimal(id: string): Promise<Animal>;
  permanentlyDeleteAnimal(id: string): Promise<void>;
  getDeletedAnimals(): Promise<Animal[]>;
  searchAnimals(query: string): Promise<Animal[]>;
  
  // Cage operations
  getCages(includeDeleted?: boolean): Promise<Cage[]>;
  getCage(id: string): Promise<Cage | undefined>;
  createCage(cage: InsertCage): Promise<Cage>;
  updateCage(id: string, cage: Partial<InsertCage>): Promise<Cage>;
  deleteCage(id: string, userId: string): Promise<void>;
  restoreCage(id: string): Promise<Cage>;
  permanentlyDeleteCage(id: string): Promise<void>;
  getDeletedCages(): Promise<Cage[]>;
  cleanupExpiredDeleted(): Promise<{ deletedAnimals: number; deletedCages: number; deletedStrains: number }>;
  
  // QR Code operations
  getQrCodes(includeDeleted?: boolean): Promise<QrCode[]>;
  getQrCode(id: string): Promise<QrCode | undefined>;
  getQrCodeByData(qrData: string): Promise<QrCode | undefined>;
  createQrCode(qrCode: InsertQrCode): Promise<QrCode>;
  updateQrCode(id: string, updates: Partial<InsertQrCode>): Promise<QrCode>;
  claimQrCode(id: string, cageId: string, userId: string): Promise<QrCode>;
  deleteQrCode(id: string, userId: string): Promise<void>;
  restoreQrCode(id: string): Promise<QrCode>;
  permanentlyDeleteQrCode(id: string): Promise<void>;
  getDeletedQrCodes(): Promise<QrCode[]>;
  
  // Audit log operations
  createAuditLog(auditLog: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(limit?: number): Promise<AuditLog[]>;
  getAuditLogsByRecord(tableName: string, recordId: string): Promise<AuditLog[]>;
  getMonthlyActivityReport(year: number, month: number): Promise<{
    animalActivity: { created: number; updated: number; deleted: number; restored: number };
    cageActivity: { created: number; updated: number; deleted: number; restored: number };
    userActivity: Array<{ userId: string; username: string; actionCount: number }>;
    totalActions: number;
  }>;
  
  // Dashboard statistics
  getDashboardStats(): Promise<{
    totalAnimals: number;
    activeCages: number;
    qrCodes: number;
    healthAlerts: number;
  }>;
  
  // Global search
  globalSearch(query: string): Promise<{
    animals: Animal[];
    cages: Cage[];
    users: User[];
    strains: Strain[];
    genotypes: Genotype[];
    qrCodes: QrCode[];
    fileAttachments: FileAttachment[];
  }>;
  
  // Strain operations
  getStrains(): Promise<Strain[]>;
  getStrain(id: string): Promise<Strain | undefined>;
  createStrain(strain: InsertStrain): Promise<Strain>;
  updateStrain(id: string, strain: Partial<InsertStrain>): Promise<Strain>;
  deleteStrain(id: string, userId: string): Promise<void>;
  restoreStrain(id: string): Promise<Strain>;
  permanentlyDeleteStrain(id: string): Promise<void>;
  getDeletedStrains(): Promise<Strain[]>;
  
  // Genotype operations
  getGenotypes(): Promise<Genotype[]>;
  createGenotype(genotype: InsertGenotype): Promise<Genotype>;

  // User invitation operations
  createInvitation(invitation: InsertUserInvitation): Promise<UserInvitation>;
  getInvitations(): Promise<UserInvitation[]>;
  getInvitationByToken(token: string): Promise<UserInvitation | undefined>;
  acceptInvitation(token: string, userId: string): Promise<void>;
  expireInvitation(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    const allUsers = await db.select().from(users).orderBy(users.email);
    return allUsers;
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

  async updateUserRole(email: string, role: 'Admin' | 'Success Manager' | 'Director' | 'Employee'): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.email, email))
      .returning();
    return user;
  }

  async blockUser(id: string, blockedBy: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ isBlocked: true, blockedAt: new Date(), blockedBy, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async unblockUser(id: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ isBlocked: false, blockedAt: null, blockedBy: null, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deleteUser(id: string, deletedBy: string): Promise<void> {
    await db
      .update(users)
      .set({ deletedAt: new Date(), deletedBy, updatedAt: new Date() })
      .where(eq(users.id, id));
  }

  async restoreUser(id: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ deletedAt: null, deletedBy: null, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getDeletedUsers(): Promise<User[]> {
    const result = await db
      .select()
      .from(users)
      .where(isNotNull(users.deletedAt))
      .orderBy(desc(users.deletedAt));
    return result;
  }

  async permanentlyDeleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  // Animal operations
  async getAnimals(limit = 50, includeDeleted = false): Promise<any[]> {
    const result = await db
      .select({
        id: animals.id,
        animalNumber: animals.animalNumber,
        cageId: animals.cageId,
        cageNumber: cages.cageNumber,
        breed: animals.breed,
        genotype: animals.genotype,
        dateOfBirth: animals.dateOfBirth,
        age: animals.age,
        weight: animals.weight,
        gender: animals.gender,
        color: animals.color,
        generation: animals.generation,
        protocol: animals.protocol,
        breedingStartDate: animals.breedingStartDate,
        dateOfGenotyping: animals.dateOfGenotyping,
        genotypingUserId: animals.genotypingUserId,
        probes: animals.probes,
        healthStatus: animals.healthStatus,
        status: animals.status,
        diseases: animals.diseases,
        notes: animals.notes,
        deletedAt: animals.deletedAt,
        deletedBy: animals.deletedBy,
        createdAt: animals.createdAt,
        updatedAt: animals.updatedAt,
      })
      .from(animals)
      .leftJoin(cages, eq(animals.cageId, cages.id))
      .where(includeDeleted ? undefined : isNull(animals.deletedAt))
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

  async updateAnimal(id: string, animalData: Partial<InsertAnimal>): Promise<Animal> {
    // Ensure dates are properly handled
    const updateData = {
      ...animalData,
      updatedAt: new Date(),
      dateOfBirth: animalData.dateOfBirth instanceof Date ? animalData.dateOfBirth : 
        (animalData.dateOfBirth ? new Date(animalData.dateOfBirth) : undefined),
      breedingStartDate: animalData.breedingStartDate instanceof Date ? animalData.breedingStartDate : 
        (animalData.breedingStartDate ? new Date(animalData.breedingStartDate) : undefined),
      dateOfGenotyping: animalData.dateOfGenotyping instanceof Date ? animalData.dateOfGenotyping : 
        (animalData.dateOfGenotyping ? new Date(animalData.dateOfGenotyping) : undefined),
    };
    
    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key as keyof typeof updateData] === undefined) {
        delete updateData[key as keyof typeof updateData];
      }
    });

    const [updatedAnimal] = await db
      .update(animals)
      .set(updateData)
      .where(eq(animals.id, id))
      .returning();
    return updatedAnimal;
  }

  async deleteAnimal(id: string, userId: string): Promise<void> {
    await db
      .update(animals)
      .set({ deletedAt: new Date(), deletedBy: userId })
      .where(eq(animals.id, id));
  }

  async restoreAnimal(id: string): Promise<Animal> {
    const [restored] = await db
      .update(animals)
      .set({ deletedAt: null, deletedBy: null })
      .where(eq(animals.id, id))
      .returning();
    if (!restored) {
      throw new Error("Animal not found");
    }
    return restored;
  }

  async permanentlyDeleteAnimal(id: string): Promise<void> {
    await db.delete(animals).where(eq(animals.id, id));
  }

  async getDeletedAnimals(): Promise<Animal[]> {
    const result = await db
      .select()
      .from(animals)
      .where(isNotNull(animals.deletedAt))
      .orderBy(desc(animals.deletedAt));
    return result;
  }

  async searchAnimals(query: string): Promise<Animal[]> {
    const result = await db
      .select()
      .from(animals)
      .where(
        and(
          isNull(animals.deletedAt),
          or(
            ilike(animals.animalNumber, `%${query}%`),
            ilike(animals.breed, `%${query}%`),
            ilike(animals.genotype, `%${query}%`),
            ilike(animals.notes, `%${query}%`)
          )
        )
      )
      .orderBy(desc(animals.createdAt));
    return result;
  }

  // Cage operations
  async getCages(includeDeleted = false): Promise<Cage[]> {
    const result = await db
      .select()
      .from(cages)
      .where(includeDeleted ? undefined : isNull(cages.deletedAt))
      .orderBy(cages.cageNumber);
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

  async deleteCage(id: string, userId: string): Promise<void> {
    await db
      .update(cages)
      .set({ deletedAt: new Date(), deletedBy: userId })
      .where(eq(cages.id, id));
  }

  async restoreCage(id: string): Promise<Cage> {
    const [restored] = await db
      .update(cages)
      .set({ deletedAt: null, deletedBy: null })
      .where(eq(cages.id, id))
      .returning();
    if (!restored) {
      throw new Error("Cage not found");
    }
    return restored;
  }

  async permanentlyDeleteCage(id: string): Promise<void> {
    await db.delete(cages).where(eq(cages.id, id));
  }

  async getDeletedCages(): Promise<Cage[]> {
    const result = await db
      .select()
      .from(cages)
      .where(isNotNull(cages.deletedAt))
      .orderBy(desc(cages.deletedAt));
    return result;
  }

  async cleanupExpiredDeleted(): Promise<{ deletedAnimals: number; deletedCages: number; deletedStrains: number }> {
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

    const expiredAnimals = await db
      .select({ id: animals.id })
      .from(animals)
      .where(and(
        isNotNull(animals.deletedAt),
        lte(animals.deletedAt, tenDaysAgo)
      ));

    const expiredCages = await db
      .select({ id: cages.id })
      .from(cages)
      .where(and(
        isNotNull(cages.deletedAt),
        lte(cages.deletedAt, tenDaysAgo)
      ));

    const expiredStrains = await db
      .select({ id: strains.id })
      .from(strains)
      .where(and(
        isNotNull(strains.deletedAt),
        lte(strains.deletedAt, tenDaysAgo)
      ));

    for (const animal of expiredAnimals) {
      await this.permanentlyDeleteAnimal(animal.id);
    }

    for (const cage of expiredCages) {
      await this.permanentlyDeleteCage(cage.id);
    }

    for (const strain of expiredStrains) {
      await this.permanentlyDeleteStrain(strain.id);
    }

    return {
      deletedAnimals: expiredAnimals.length,
      deletedCages: expiredCages.length,
      deletedStrains: expiredStrains.length,
    };
  }

  // QR Code operations
  async getQrCodes(includeDeleted = false): Promise<QrCode[]> {
    const result = await db
      .select()
      .from(qrCodes)
      .where(includeDeleted ? undefined : isNull(qrCodes.deletedAt))
      .orderBy(desc(qrCodes.createdAt));
    return result;
  }

  async getQrCode(id: string): Promise<QrCode | undefined> {
    const [qrCode] = await db.select().from(qrCodes).where(eq(qrCodes.id, id));
    return qrCode;
  }

  async getQrCodeByData(qrData: string): Promise<QrCode | undefined> {
    const [qrCode] = await db.select().from(qrCodes).where(eq(qrCodes.qrData, qrData));
    return qrCode;
  }

  async createQrCode(qrCode: InsertQrCode): Promise<QrCode> {
    const [newQrCode] = await db.insert(qrCodes).values(qrCode).returning();
    return newQrCode;
  }

  async updateQrCode(id: string, updates: Partial<InsertQrCode>): Promise<QrCode> {
    const [updatedQrCode] = await db
      .update(qrCodes)
      .set(updates)
      .where(eq(qrCodes.id, id))
      .returning();
    if (!updatedQrCode) {
      throw new Error("QR code not found");
    }
    return updatedQrCode;
  }

  async claimQrCode(id: string, cageId: string, userId: string): Promise<QrCode> {
    // Verify QR code exists and is blank
    const [existingCode] = await db.select().from(qrCodes).where(eq(qrCodes.id, id));
    if (!existingCode) {
      throw new Error("QR code not found");
    }
    if (!existingCode.isBlank) {
      throw new Error("QR code has already been claimed");
    }

    // Verify cage exists and is not deleted
    const [cage] = await db.select().from(cages).where(eq(cages.id, cageId));
    if (!cage) {
      throw new Error("Cage not found");
    }
    if (cage.deletedAt) {
      throw new Error("Cannot claim QR code for a deleted cage");
    }

    const [claimedCode] = await db
      .update(qrCodes)
      .set({ 
        cageId, 
        isBlank: false, 
        claimedAt: new Date(), 
        claimedBy: userId 
      })
      .where(eq(qrCodes.id, id))
      .returning();
    return claimedCode;
  }

  async deleteQrCode(id: string, userId: string): Promise<void> {
    // First check if the QR code exists and is not already deleted
    const [existing] = await db.select().from(qrCodes).where(eq(qrCodes.id, id));
    if (!existing) {
      throw new Error("QR Code not found");
    }
    if (existing.deletedAt) {
      throw new Error("QR Code is already deleted");
    }

    await db
      .update(qrCodes)
      .set({ deletedAt: new Date(), deletedBy: userId })
      .where(eq(qrCodes.id, id));
  }

  async restoreQrCode(id: string): Promise<QrCode> {
    // First check if the QR code exists and is deleted
    const [existing] = await db.select().from(qrCodes).where(eq(qrCodes.id, id));
    if (!existing) {
      throw new Error("QR Code not found");
    }
    if (!existing.deletedAt) {
      throw new Error("QR Code is not deleted");
    }

    const [restored] = await db
      .update(qrCodes)
      .set({ deletedAt: null, deletedBy: null })
      .where(eq(qrCodes.id, id))
      .returning();
    return restored;
  }

  async permanentlyDeleteQrCode(id: string): Promise<void> {
    await db.delete(qrCodes).where(eq(qrCodes.id, id));
  }

  async getDeletedQrCodes(): Promise<QrCode[]> {
    const result = await db
      .select()
      .from(qrCodes)
      .where(isNotNull(qrCodes.deletedAt))
      .orderBy(desc(qrCodes.deletedAt));
    return result;
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

  async getAuditLogsByRecord(tableName: string, recordId: string): Promise<AuditLog[]> {
    const result = await db
      .select()
      .from(auditLogs)
      .where(and(
        eq(auditLogs.tableName, tableName),
        eq(auditLogs.recordId, recordId)
      ))
      .orderBy(desc(auditLogs.timestamp));
    return result;
  }

  async getMonthlyActivityReport(year: number, month: number): Promise<{
    animalActivity: { created: number; updated: number; deleted: number; restored: number };
    cageActivity: { created: number; updated: number; deleted: number; restored: number };
    userActivity: Array<{ userId: string; username: string; actionCount: number }>;
    totalActions: number;
  }> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    const logs = await db
      .select()
      .from(auditLogs)
      .where(and(
        gte(auditLogs.timestamp, startDate),
        lt(auditLogs.timestamp, endDate)
      ))
      .orderBy(desc(auditLogs.timestamp));

    const animalActivity = {
      created: logs.filter(l => l.tableName === 'animals' && l.action === 'CREATE').length,
      updated: logs.filter(l => l.tableName === 'animals' && l.action === 'UPDATE').length,
      deleted: logs.filter(l => l.tableName === 'animals' && (l.action === 'DELETE' || l.action === 'SOFT_DELETE' || l.action === 'PERMANENT_DELETE')).length,
      restored: logs.filter(l => l.tableName === 'animals' && l.action === 'RESTORE').length,
    };

    const cageActivity = {
      created: logs.filter(l => l.tableName === 'cages' && l.action === 'CREATE').length,
      updated: logs.filter(l => l.tableName === 'cages' && l.action === 'UPDATE').length,
      deleted: logs.filter(l => l.tableName === 'cages' && (l.action === 'DELETE' || l.action === 'SOFT_DELETE' || l.action === 'PERMANENT_DELETE')).length,
      restored: logs.filter(l => l.tableName === 'cages' && l.action === 'RESTORE').length,
    };

    const userActivityMap = new Map<string, number>();
    for (const log of logs) {
      if (log.userId) {
        userActivityMap.set(log.userId, (userActivityMap.get(log.userId) || 0) + 1);
      }
    }

    const userActivity = await Promise.all(
      Array.from(userActivityMap.entries()).map(async ([userId, count]) => {
        const user = await this.getUser(userId);
        return {
          userId,
          username: user?.username || 'Unknown',
          actionCount: count,
        };
      })
    );

    userActivity.sort((a, b) => b.actionCount - a.actionCount);

    return {
      animalActivity,
      cageActivity,
      userActivity,
      totalActions: logs.length,
    };
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
      .from(animals)
      .where(isNull(animals.deletedAt));

    const [activeCages] = await db
      .select({ count: sql<number>`count(*)` })
      .from(cages)
      .where(and(eq(cages.isActive, true), isNull(cages.deletedAt)));

    const [qrCodesCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(qrCodes);

    const [healthAlerts] = await db
      .select({ count: sql<number>`count(*)` })
      .from(animals)
      .where(
        and(
          isNull(animals.deletedAt),
          or(
            eq(animals.healthStatus, 'Sick'),
            eq(animals.healthStatus, 'Quarantine')
          )
        )
      );

    return {
      totalAnimals: totalAnimals.count,
      activeCages: activeCages.count,
      qrCodes: qrCodesCount.count,
      healthAlerts: healthAlerts.count,
    };
  }

  // Global search
  async globalSearch(query: string): Promise<{
    animals: Animal[];
    cages: Cage[];
    users: User[];
    strains: Strain[];
    genotypes: Genotype[];
    qrCodes: QrCode[];
    fileAttachments: FileAttachment[];
  }> {
    const searchTerm = `%${query}%`;

    // Search animals - expanded fields, excluding deleted
    const animalsResult = await db
      .select()
      .from(animals)
      .leftJoin(cages, eq(animals.cageId, cages.id))
      .where(
        and(
          isNull(animals.deletedAt),
          or(
            ilike(animals.animalNumber, searchTerm),
            ilike(animals.breed, searchTerm),
            ilike(animals.genotype, searchTerm),
            ilike(animals.color, searchTerm),
            ilike(animals.protocol, searchTerm),
            ilike(animals.diseases, searchTerm),
            ilike(animals.notes, searchTerm),
            ilike(animals.healthStatus, searchTerm),
            ilike(animals.status, searchTerm),
            ilike(cages.cageNumber, searchTerm),
            ilike(cages.location, searchTerm)
          )
        )
      )
      .limit(10);

    // Search cages - expanded fields, excluding deleted
    const cagesResult = await db
      .select()
      .from(cages)
      .where(
        and(
          isNull(cages.deletedAt),
          or(
            ilike(cages.cageNumber, searchTerm),
            ilike(cages.roomNumber, searchTerm),
            ilike(cages.location, searchTerm),
            ilike(cages.status, searchTerm),
            ilike(cages.notes, searchTerm)
          )
        )
      )
      .limit(10);

    // Search users
    const usersResult = await db
      .select()
      .from(users)
      .where(
        or(
          ilike(users.email, searchTerm),
          ilike(users.firstName, searchTerm),
          ilike(users.lastName, searchTerm),
          ilike(users.role, searchTerm)
        )
      )
      .limit(10);

    // Search strains
    const strainsResult = await db
      .select()
      .from(strains)
      .where(
        or(
          ilike(strains.name, searchTerm),
          ilike(strains.description, searchTerm)
        )
      )
      .limit(10);

    // Search genotypes
    const genotypesResult = await db
      .select()
      .from(genotypes)
      .where(
        or(
          ilike(genotypes.name, searchTerm),
          ilike(genotypes.description, searchTerm)
        )
      )
      .limit(10);

    // Search QR codes - only for cages now
    const qrCodesResult = await db
      .select()
      .from(qrCodes)
      .leftJoin(cages, eq(qrCodes.cageId, cages.id))
      .where(
        or(
          ilike(qrCodes.qrData, searchTerm),
          ilike(cages.cageNumber, searchTerm)
        )
      )
      .limit(10);

    // Search file attachments
    const fileAttachmentsResult = await db
      .select()
      .from(fileAttachments)
      .leftJoin(animals, eq(fileAttachments.animalId, animals.id))
      .leftJoin(cages, eq(fileAttachments.cageId, cages.id))
      .where(
        or(
          ilike(fileAttachments.fileName, searchTerm),
          ilike(fileAttachments.originalName, searchTerm),
          ilike(fileAttachments.fileType, searchTerm),
          ilike(animals.animalNumber, searchTerm),
          ilike(cages.cageNumber, searchTerm)
        )
      )
      .limit(10);

    return {
      animals: animalsResult.map(row => ({
        ...row.animals,
        cage: row.cages
      })),
      cages: cagesResult,
      users: usersResult,
      strains: strainsResult,
      genotypes: genotypesResult,
      qrCodes: qrCodesResult.map(row => ({
        ...row.qr_codes,
        cage: row.cages
      })),
      fileAttachments: fileAttachmentsResult.map(row => ({
        ...row.file_attachments,
        animal: row.animals,
        cage: row.cages
      })),
    };
  }

  // Strain operations
  async getStrains(): Promise<Strain[]> {
    const result = await db
      .select()
      .from(strains)
      .where(
        and(
          eq(strains.isActive, true),
          isNull(strains.deletedAt)
        )
      )
      .orderBy(strains.name);
    return result;
  }

  async getStrain(id: string): Promise<Strain | undefined> {
    const [strain] = await db.select().from(strains).where(eq(strains.id, id));
    return strain;
  }

  async createStrain(strainData: InsertStrain): Promise<Strain> {
    const [strain] = await db
      .insert(strains)
      .values(strainData)
      .returning();
    return strain;
  }

  async updateStrain(id: string, strainData: Partial<InsertStrain>): Promise<Strain> {
    const [strain] = await db
      .update(strains)
      .set(strainData)
      .where(eq(strains.id, id))
      .returning();
    return strain;
  }

  async deleteStrain(id: string, userId: string): Promise<void> {
    await db
      .update(strains)
      .set({ deletedAt: new Date(), deletedBy: userId })
      .where(eq(strains.id, id));
  }

  async restoreStrain(id: string): Promise<Strain> {
    const [restored] = await db
      .update(strains)
      .set({ deletedAt: null, deletedBy: null })
      .where(eq(strains.id, id))
      .returning();
    if (!restored) {
      throw new Error("Strain not found");
    }
    return restored;
  }

  async permanentlyDeleteStrain(id: string): Promise<void> {
    await db.delete(strains).where(eq(strains.id, id));
  }

  async getDeletedStrains(): Promise<Strain[]> {
    const result = await db
      .select()
      .from(strains)
      .where(isNotNull(strains.deletedAt))
      .orderBy(desc(strains.deletedAt));
    return result;
  }

  // Genotype operations
  async getGenotypes(): Promise<Genotype[]> {
    const result = await db
      .select()
      .from(genotypes)
      .where(eq(genotypes.isActive, true))
      .orderBy(genotypes.name);
    return result;
  }

  async createGenotype(genotypeData: InsertGenotype): Promise<Genotype> {
    const [genotype] = await db
      .insert(genotypes)
      .values(genotypeData)
      .returning();
    return genotype;
  }

  // User invitation operations
  async createInvitation(invitationData: InsertUserInvitation): Promise<UserInvitation> {
    const [invitation] = await db
      .insert(userInvitations)
      .values(invitationData)
      .returning();
    return invitation;
  }

  async getInvitations(): Promise<UserInvitation[]> {
    const result = await db
      .select()
      .from(userInvitations)
      .orderBy(desc(userInvitations.createdAt));
    return result;
  }

  async getInvitationByToken(token: string): Promise<UserInvitation | undefined> {
    const [invitation] = await db
      .select()
      .from(userInvitations)
      .where(eq(userInvitations.token, token));
    return invitation;
  }

  async acceptInvitation(token: string, userId: string): Promise<void> {
    await db
      .update(userInvitations)
      .set({ status: 'accepted' })
      .where(eq(userInvitations.token, token));
  }

  async expireInvitation(id: string): Promise<void> {
    await db
      .update(userInvitations)
      .set({ status: 'expired' })
      .where(eq(userInvitations.id, id));
  }
}

export const storage = new DatabaseStorage();
