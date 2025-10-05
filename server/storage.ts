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
  companies,
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
  type Company,
  type InsertCompany,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and, ilike, or, isNull, isNotNull, lte, gte, lt } from "drizzle-orm";

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
  getDeletedUsers(): Promise<User[]>;
  permanentlyDeleteUser(id: string): Promise<void>;
  
  // Animal operations
  getAnimals(limit?: number, includeDeleted?: boolean, companyId?: string): Promise<Animal[]>;
  getAnimal(id: string, companyId?: string): Promise<Animal | undefined>;
  createAnimal(animal: InsertAnimal): Promise<Animal>;
  updateAnimal(id: string, animal: Partial<InsertAnimal>): Promise<Animal>;
  deleteAnimal(id: string, userId: string): Promise<void>;
  restoreAnimal(id: string): Promise<Animal>;
  permanentlyDeleteAnimal(id: string): Promise<void>;
  getDeletedAnimals(companyId?: string): Promise<Animal[]>;
  searchAnimals(query: string, companyId?: string): Promise<Animal[]>;
  
  // Cage operations
  getCages(includeDeleted?: boolean, companyId?: string): Promise<Cage[]>;
  getCage(id: string, companyId?: string): Promise<Cage | undefined>;
  createCage(cage: InsertCage): Promise<Cage>;
  updateCage(id: string, cage: Partial<InsertCage>): Promise<Cage>;
  deleteCage(id: string, userId: string): Promise<void>;
  restoreCage(id: string): Promise<Cage>;
  permanentlyDeleteCage(id: string): Promise<void>;
  getDeletedCages(companyId?: string): Promise<Cage[]>;
  cleanupExpiredDeleted(): Promise<{ deletedAnimals: number; deletedCages: number; deletedStrains: number; deletedUsers: number }>;
  
  // QR Code operations
  getQrCodes(includeDeleted?: boolean, companyId?: string): Promise<QrCode[]>;
  getQrCode(id: string, companyId?: string): Promise<QrCode | undefined>;
  getQrCodeByData(qrData: string, companyId?: string): Promise<QrCode | undefined>;
  createQrCode(qrCode: InsertQrCode): Promise<QrCode>;
  updateQrCode(id: string, updates: Partial<InsertQrCode>): Promise<QrCode>;
  claimQrCode(id: string, cageId: string, userId: string): Promise<QrCode>;
  deleteQrCode(id: string, userId: string): Promise<void>;
  restoreQrCode(id: string): Promise<QrCode>;
  permanentlyDeleteQrCode(id: string): Promise<void>;
  getDeletedQrCodes(companyId?: string): Promise<QrCode[]>;
  
  // Audit log operations
  createAuditLog(auditLog: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(limit?: number): Promise<AuditLog[]>;
  getAuditLogsByRecord(tableName: string, recordId: string): Promise<AuditLog[]>;
  getMonthlyActivityReport(year: number, month: number, companyId?: string): Promise<{
    animalActivity: { created: number; updated: number; deleted: number; restored: number };
    cageActivity: { created: number; updated: number; deleted: number; restored: number };
    userActivity: Array<{ userId: string; username: string; actionCount: number }>;
    totalActions: number;
  }>;
  
  // Dashboard statistics
  getDashboardStats(companyId?: string): Promise<{
    totalAnimals: number;
    activeCages: number;
    qrCodes: number;
    healthAlerts: number;
  }>;
  
  // Global search
  globalSearch(query: string, companyId?: string): Promise<{
    animals: Animal[];
    cages: Cage[];
    users: User[];
    strains: Strain[];
    genotypes: Genotype[];
    qrCodes: QrCode[];
    fileAttachments: FileAttachment[];
  }>;
  
  // Strain operations
  getStrains(companyId?: string): Promise<Strain[]>;
  getStrain(id: string, companyId?: string): Promise<Strain | undefined>;
  createStrain(strain: InsertStrain): Promise<Strain>;
  updateStrain(id: string, strain: Partial<InsertStrain>): Promise<Strain>;
  deleteStrain(id: string, userId: string): Promise<void>;
  restoreStrain(id: string): Promise<Strain>;
  permanentlyDeleteStrain(id: string): Promise<void>;
  getDeletedStrains(companyId?: string): Promise<Strain[]>;
  
  // Genotype operations
  getGenotypes(companyId?: string): Promise<Genotype[]>;
  getGenotype(id: string, companyId?: string): Promise<Genotype | undefined>;
  createGenotype(genotype: InsertGenotype): Promise<Genotype>;
  deleteGenotype(id: string): Promise<void>;

  // User invitation operations
  createInvitation(invitation: InsertUserInvitation): Promise<UserInvitation>;
  getInvitations(): Promise<UserInvitation[]>;
  getInvitationByToken(token: string): Promise<UserInvitation | undefined>;
  acceptInvitation(token: string, userId: string): Promise<void>;
  expireInvitation(id: string): Promise<void>;
  
  // Company operations
  getCompanies(): Promise<Company[]>;
  getCompany(id: string): Promise<Company | undefined>;
  createCompany(company: InsertCompany): Promise<Company>;
  updateCompany(id: string, company: Partial<InsertCompany>): Promise<Company>;
  deleteCompany(id: string): Promise<void>;
  getCompanyOverview(companyId: string): Promise<{
    company: Company;
    animals: Animal[];
    cages: Cage[];
    users: User[];
    strains: Strain[];
    genotypes: Genotype[];
    qrCodes: QrCode[];
    stats: {
      totalAnimals: number;
      activeCages: number;
      totalUsers: number;
      qrCodes: number;
    };
  }>;
  getUsersByCompany(companyId: string): Promise<User[]>;
  assignUserToCompany(userId: string, companyId: string): Promise<User>;
  removeUserFromCompany(userId: string): Promise<User>;
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user as User | undefined;
  }

  async getAllUsers(): Promise<User[]> {
    const allUsers = await db.select().from(users)
      .where(isNull(users.deletedAt))
      .orderBy(users.email);
    return allUsers as User[];
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    // Check if user exists by email
    const [existingUser] = await db.select().from(users).where(eq(users.email, userData.email));
    
    if (existingUser) {
      // Update existing user
      const [updatedUser] = await db
        .update(users)
        .set({
          ...userData,
          updatedAt: new Date(),
        })
        .where(eq(users.email, userData.email))
        .returning();
      return updatedUser as User;
    } else {
      // Insert new user
      const [newUser] = await db
        .insert(users)
        .values(userData)
        .returning();
      return newUser as User;
    }
  }

  async updateUserRole(email: string, role: 'Admin' | 'Success Manager' | 'Director' | 'Employee'): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.email, email))
      .returning();
    return user as User | undefined;
  }

  async blockUser(id: string, blockedBy: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ isBlocked: true, blockedAt: new Date(), blockedBy, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user as User | undefined;
  }

  async unblockUser(id: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ isBlocked: false, blockedAt: null, blockedBy: null, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user as User | undefined;
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
    return user as User | undefined;
  }

  async getDeletedUsers(): Promise<User[]> {
    const result = await db
      .select()
      .from(users)
      .where(isNotNull(users.deletedAt))
      .orderBy(desc(users.deletedAt));
    return result as User[];
  }

  async permanentlyDeleteUser(id: string): Promise<void> {
    await db.delete(auditLogs).where(eq(auditLogs.userId, id));
    await db.delete(users).where(eq(users.id, id));
  }

  // Animal operations
  async getAnimals(limit = 50, includeDeleted = false, companyId?: string): Promise<any[]> {
    const conditions = includeDeleted 
      ? (companyId ? eq(animals.companyId, companyId) : undefined)
      : (companyId ? and(isNull(animals.deletedAt), eq(animals.companyId, companyId)) : isNull(animals.deletedAt));
    
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
      .where(conditions)
      .orderBy(desc(animals.createdAt))
      .limit(limit);
    return result;
  }

  async getAnimal(id: string, companyId?: string): Promise<Animal | undefined> {
    const [animal] = await db.select().from(animals).where(
      companyId ? and(eq(animals.id, id), eq(animals.companyId, companyId)) : eq(animals.id, id)
    );
    return animal;
  }

  async createAnimal(animal: InsertAnimal): Promise<Animal> {
    const insertData = {
      ...animal,
      dateOfBirth: animal.dateOfBirth instanceof Date ? animal.dateOfBirth : 
        (animal.dateOfBirth ? new Date(animal.dateOfBirth) : undefined),
      breedingStartDate: animal.breedingStartDate instanceof Date ? animal.breedingStartDate : 
        (animal.breedingStartDate ? new Date(animal.breedingStartDate) : undefined),
      dateOfGenotyping: animal.dateOfGenotyping instanceof Date ? animal.dateOfGenotyping : 
        (animal.dateOfGenotyping ? new Date(animal.dateOfGenotyping) : undefined),
    };
    
    Object.keys(insertData).forEach(key => {
      if (insertData[key as keyof typeof insertData] === undefined) {
        delete insertData[key as keyof typeof insertData];
      }
    });

    const [newAnimal] = await db.insert(animals).values(insertData).returning();
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

  async getDeletedAnimals(companyId?: string): Promise<Animal[]> {
    const result = await db
      .select()
      .from(animals)
      .where(companyId ? and(isNotNull(animals.deletedAt), eq(animals.companyId, companyId)) : isNotNull(animals.deletedAt))
      .orderBy(desc(animals.deletedAt));
    return result;
  }

  async searchAnimals(query: string, companyId?: string): Promise<Animal[]> {
    const conditions = companyId 
      ? and(
          isNull(animals.deletedAt),
          eq(animals.companyId, companyId),
          or(
            ilike(animals.animalNumber, `%${query}%`),
            ilike(animals.breed, `%${query}%`),
            ilike(animals.genotype, `%${query}%`),
            ilike(animals.notes, `%${query}%`)
          )
        )
      : and(
          isNull(animals.deletedAt),
          or(
            ilike(animals.animalNumber, `%${query}%`),
            ilike(animals.breed, `%${query}%`),
            ilike(animals.genotype, `%${query}%`),
            ilike(animals.notes, `%${query}%`)
          )
        );
    
    const result = await db
      .select()
      .from(animals)
      .where(conditions)
      .orderBy(desc(animals.createdAt));
    return result;
  }

  // Cage operations
  async getCages(includeDeleted = false, companyId?: string): Promise<Cage[]> {
    const conditions = includeDeleted 
      ? (companyId ? eq(cages.companyId, companyId) : undefined)
      : (companyId ? and(isNull(cages.deletedAt), eq(cages.companyId, companyId)) : isNull(cages.deletedAt));
    
    const result = await db
      .select()
      .from(cages)
      .where(conditions)
      .orderBy(cages.cageNumber);
    return result;
  }

  async getCage(id: string, companyId?: string): Promise<Cage | undefined> {
    const [cage] = await db.select().from(cages).where(
      companyId ? and(eq(cages.id, id), eq(cages.companyId, companyId)) : eq(cages.id, id)
    );
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

  async getDeletedCages(companyId?: string): Promise<Cage[]> {
    const result = await db
      .select()
      .from(cages)
      .where(companyId ? and(isNotNull(cages.deletedAt), eq(cages.companyId, companyId)) : isNotNull(cages.deletedAt))
      .orderBy(desc(cages.deletedAt));
    return result;
  }

  async cleanupExpiredDeleted(): Promise<{ deletedAnimals: number; deletedCages: number; deletedStrains: number; deletedUsers: number }> {
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

    const expiredUsers = await db
      .select({ id: users.id })
      .from(users)
      .where(and(
        isNotNull(users.deletedAt),
        lte(users.deletedAt, tenDaysAgo)
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

    for (const user of expiredUsers) {
      await this.permanentlyDeleteUser(user.id);
    }

    return {
      deletedAnimals: expiredAnimals.length,
      deletedCages: expiredCages.length,
      deletedStrains: expiredStrains.length,
      deletedUsers: expiredUsers.length,
    };
  }

  // QR Code operations
  async getQrCodes(includeDeleted = false, companyId?: string): Promise<QrCode[]> {
    const conditions = includeDeleted 
      ? (companyId ? eq(qrCodes.companyId, companyId) : undefined)
      : (companyId ? and(isNull(qrCodes.deletedAt), eq(qrCodes.companyId, companyId)) : isNull(qrCodes.deletedAt));
    
    const result = await db
      .select()
      .from(qrCodes)
      .where(conditions)
      .orderBy(desc(qrCodes.createdAt));
    return result;
  }

  async getQrCode(id: string, companyId?: string): Promise<QrCode | undefined> {
    const [qrCode] = await db.select().from(qrCodes).where(
      companyId ? and(eq(qrCodes.id, id), eq(qrCodes.companyId, companyId)) : eq(qrCodes.id, id)
    );
    return qrCode;
  }

  async getQrCodeByData(qrData: string, companyId?: string): Promise<QrCode | undefined> {
    const [qrCode] = await db.select().from(qrCodes).where(
      companyId ? and(eq(qrCodes.qrData, qrData), eq(qrCodes.companyId, companyId)) : eq(qrCodes.qrData, qrData)
    );
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

  async getDeletedQrCodes(companyId?: string): Promise<QrCode[]> {
    const result = await db
      .select()
      .from(qrCodes)
      .where(companyId ? and(isNotNull(qrCodes.deletedAt), eq(qrCodes.companyId, companyId)) : isNotNull(qrCodes.deletedAt))
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

  async getMonthlyActivityReport(year: number, month: number, companyId?: string): Promise<{
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
      .where(
        companyId 
          ? and(
              gte(auditLogs.timestamp, startDate),
              lt(auditLogs.timestamp, endDate),
              eq(auditLogs.companyId, companyId)
            )
          : and(
              gte(auditLogs.timestamp, startDate),
              lt(auditLogs.timestamp, endDate)
            )
      )
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
        const fullName = user 
          ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown'
          : 'Unknown';
        return {
          userId,
          username: fullName,
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
  async getDashboardStats(companyId?: string): Promise<{
    totalAnimals: number;
    activeCages: number;
    qrCodes: number;
    healthAlerts: number;
  }> {
    const [totalAnimals] = await db
      .select({ count: sql<number>`count(*)` })
      .from(animals)
      .where(companyId ? and(isNull(animals.deletedAt), eq(animals.companyId, companyId)) : isNull(animals.deletedAt));

    const [activeCages] = await db
      .select({ count: sql<number>`count(*)` })
      .from(cages)
      .where(companyId 
        ? and(eq(cages.isActive, true), isNull(cages.deletedAt), eq(cages.companyId, companyId)) 
        : and(eq(cages.isActive, true), isNull(cages.deletedAt))
      );

    const [qrCodesCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(qrCodes)
      .where(companyId ? eq(qrCodes.companyId, companyId) : sql`true`);

    const [healthAlerts] = await db
      .select({ count: sql<number>`count(*)` })
      .from(animals)
      .where(
        companyId
          ? and(
              isNull(animals.deletedAt),
              eq(animals.companyId, companyId),
              or(
                eq(animals.healthStatus, 'Sick'),
                eq(animals.healthStatus, 'Quarantine')
              )
            )
          : and(
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
  async globalSearch(query: string, companyId?: string): Promise<{
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
        companyId
          ? and(
              isNull(animals.deletedAt),
              eq(animals.companyId, companyId),
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
          : and(
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
        companyId
          ? and(
              isNull(cages.deletedAt),
              eq(cages.companyId, companyId),
              or(
                ilike(cages.cageNumber, searchTerm),
                ilike(cages.roomNumber, searchTerm),
                ilike(cages.location, searchTerm),
                ilike(cages.status, searchTerm),
                ilike(cages.notes, searchTerm)
              )
            )
          : and(
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

    // Search users - filter by companyId for non-admin
    const usersResult = await db
      .select()
      .from(users)
      .where(
        companyId
          ? and(
              eq(users.companyId, companyId),
              or(
                ilike(users.email, searchTerm),
                ilike(users.firstName, searchTerm),
                ilike(users.lastName, searchTerm),
                ilike(users.role, searchTerm)
              )
            )
          : or(
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
        companyId
          ? and(
              eq(strains.companyId, companyId),
              or(
                ilike(strains.name, searchTerm),
                ilike(strains.description, searchTerm)
              )
            )
          : or(
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
        companyId
          ? and(
              eq(genotypes.companyId, companyId),
              or(
                ilike(genotypes.name, searchTerm),
                ilike(genotypes.description, searchTerm)
              )
            )
          : or(
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
        companyId
          ? and(
              eq(qrCodes.companyId, companyId),
              or(
                ilike(qrCodes.qrData, searchTerm),
                ilike(cages.cageNumber, searchTerm)
              )
            )
          : or(
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
        companyId
          ? and(
              eq(fileAttachments.companyId, companyId),
              or(
                ilike(fileAttachments.fileName, searchTerm),
                ilike(fileAttachments.originalName, searchTerm),
                ilike(fileAttachments.fileType, searchTerm),
                ilike(animals.animalNumber, searchTerm),
                ilike(cages.cageNumber, searchTerm)
              )
            )
          : or(
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
      users: usersResult as User[],
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
  async getStrains(companyId?: string): Promise<Strain[]> {
    const result = await db
      .select()
      .from(strains)
      .where(
        companyId
          ? and(
              eq(strains.isActive, true),
              isNull(strains.deletedAt),
              eq(strains.companyId, companyId)
            )
          : and(
              eq(strains.isActive, true),
              isNull(strains.deletedAt)
            )
      )
      .orderBy(strains.name);
    return result;
  }

  async getStrain(id: string, companyId?: string): Promise<Strain | undefined> {
    const [strain] = await db.select().from(strains).where(
      companyId ? and(eq(strains.id, id), eq(strains.companyId, companyId)) : eq(strains.id, id)
    );
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

  async getDeletedStrains(companyId?: string): Promise<Strain[]> {
    const result = await db
      .select()
      .from(strains)
      .where(companyId ? and(isNotNull(strains.deletedAt), eq(strains.companyId, companyId)) : isNotNull(strains.deletedAt))
      .orderBy(desc(strains.deletedAt));
    return result;
  }

  // Genotype operations
  async getGenotypes(companyId?: string): Promise<Genotype[]> {
    const result = await db
      .select()
      .from(genotypes)
      .where(companyId ? and(eq(genotypes.isActive, true), eq(genotypes.companyId, companyId)) : eq(genotypes.isActive, true))
      .orderBy(genotypes.name);
    return result;
  }

  async getGenotype(id: string, companyId?: string): Promise<Genotype | undefined> {
    const [genotype] = await db.select().from(genotypes).where(
      companyId ? and(eq(genotypes.id, id), eq(genotypes.companyId, companyId)) : eq(genotypes.id, id)
    );
    return genotype;
  }

  async createGenotype(genotypeData: InsertGenotype): Promise<Genotype> {
    const [genotype] = await db
      .insert(genotypes)
      .values(genotypeData)
      .returning();
    return genotype;
  }

  async deleteGenotype(id: string): Promise<void> {
    await db.delete(genotypes).where(eq(genotypes.id, id));
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

  // Company operations
  async getCompanies(): Promise<Company[]> {
    const result = await db
      .select()
      .from(companies)
      .where(eq(companies.isActive, true))
      .orderBy(companies.name);
    return result;
  }

  async getCompany(id: string): Promise<Company | undefined> {
    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.id, id));
    return company;
  }

  async createCompany(companyData: InsertCompany): Promise<Company> {
    const [company] = await db
      .insert(companies)
      .values(companyData)
      .returning();
    return company;
  }

  async updateCompany(id: string, companyData: Partial<InsertCompany>): Promise<Company> {
    const [company] = await db
      .update(companies)
      .set({ ...companyData, updatedAt: new Date() })
      .where(eq(companies.id, id))
      .returning();
    return company;
  }

  async deleteCompany(id: string): Promise<void> {
    await db
      .update(companies)
      .set({ isActive: false })
      .where(eq(companies.id, id));
  }

  async getCompanyOverview(companyId: string): Promise<{
    company: Company;
    animals: Animal[];
    cages: Cage[];
    users: User[];
    strains: Strain[];
    genotypes: Genotype[];
    qrCodes: QrCode[];
    stats: {
      totalAnimals: number;
      activeCages: number;
      totalUsers: number;
      qrCodes: number;
    };
  }> {
    const company = await this.getCompany(companyId);
    if (!company) {
      throw new Error('Company not found');
    }

    const [
      allAnimals,
      allCages,
      allUsers,
      allStrains,
      allGenotypes,
      allQrCodes
    ] = await Promise.all([
      this.getAnimals(undefined, false, companyId),
      this.getCages(false, companyId),
      this.getUsersByCompany(companyId),
      this.getStrains(companyId),
      this.getGenotypes(companyId),
      this.getQrCodes(false, companyId)
    ]);

    const stats = {
      totalAnimals: allAnimals.length,
      activeCages: allCages.filter(c => c.isActive).length,
      totalUsers: allUsers.length,
      qrCodes: allQrCodes.length
    };

    return {
      company,
      animals: allAnimals,
      cages: allCages,
      users: allUsers,
      strains: allStrains,
      genotypes: allGenotypes,
      qrCodes: allQrCodes,
      stats
    };
  }

  async getUsersByCompany(companyId: string): Promise<User[]> {
    const result = await db
      .select()
      .from(users)
      .where(and(
        eq(users.companyId, companyId),
        isNull(users.deletedAt)
      ))
      .orderBy(users.email);
    return result as User[];
  }

  async assignUserToCompany(userId: string, companyId: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ companyId, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user as User;
  }

  async removeUserFromCompany(userId: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ companyId: null, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user as User;
  }
}

export const storage = new DatabaseStorage();
