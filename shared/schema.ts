import { sql, relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  decimal,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role", { enum: ['Admin', 'Success Manager', 'Director', 'Employee'] }).default('Employee').notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Cages table
export const cages = pgTable("cages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cageNumber: varchar("cage_number").notNull().unique(),
  roomNumber: varchar("room_number", { 
    enum: ['BB00028', 'ZRC-C61', 'ZRC-SC14'] 
  }).notNull(),
  location: varchar("location").notNull(),
  capacity: integer("capacity").default(5),
  isActive: boolean("is_active").default(true),
  status: varchar("status", {
    enum: ['Active', 'Breeding', 'Holding']
  }).default('Active'),
  strainId: varchar("strain_id").references(() => strains.id),
  notes: text("notes"),
  deletedAt: timestamp("deleted_at"),
  deletedBy: varchar("deleted_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Strains table - for managing laboratory animal strains
export const strains = pgTable("strains", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull().unique(),
  description: text("description"),
  // category: varchar("category"), // Temporarily commented until DB migration
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Genotypes table - for managing genotype options
export const genotypes = pgTable("genotypes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull().unique(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// File attachments table
export const fileAttachments = pgTable("file_attachments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fileName: varchar("file_name").notNull(),
  originalName: varchar("original_name").notNull(),
  fileType: varchar("file_type").notNull(), // image/jpeg, application/pdf, etc.
  fileSize: integer("file_size"), // in bytes
  filePath: varchar("file_path").notNull(), // storage path
  animalId: varchar("animal_id").references(() => animals.id),
  cageId: varchar("cage_id").references(() => cages.id),
  uploadedBy: varchar("uploaded_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Animals table
export const animals = pgTable("animals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  animalNumber: varchar("animal_number").notNull().unique(),
  cageId: varchar("cage_id").references(() => cages.id),
  breed: varchar("breed").notNull(), // Will change to strain later
  genotype: varchar("genotype"), // Will change to reference later
  dateOfBirth: timestamp("date_of_birth"),
  age: integer("age"), // in weeks - will be calculated from dateOfBirth
  weight: decimal("weight", { precision: 5, scale: 2 }), // in grams
  gender: varchar("gender", { enum: ['Male', 'Female'] }),
  color: varchar("color"),
  generation: integer("generation"),
  protocol: varchar("protocol"),
  breedingStartDate: timestamp("breeding_start_date"),
  dateOfGenotyping: timestamp("date_of_genotyping"), // DOG
  genotypingUserId: varchar("genotyping_user_id").references(() => users.id),
  probes: boolean("probes").default(false),
  healthStatus: varchar("health_status", { 
    enum: ['Healthy', 'Monitoring', 'Sick', 'Quarantine'] 
  }).default('Healthy'),
  status: varchar("status", {
    enum: ['Active', 'Reserved', 'Transferred', 'Sacrificed', 'Breeding', 'Replaced']
  }).default('Active'),
  diseases: text("diseases"),
  notes: text("notes"),
  deletedAt: timestamp("deleted_at"),
  deletedBy: varchar("deleted_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// QR Codes table - Only for cages
export const qrCodes = pgTable("qr_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cageId: varchar("cage_id").references(() => cages.id),
  qrData: text("qr_data").notNull(),
  isBlank: boolean("is_blank").default(true), // Blank QR codes can be filled later
  claimedAt: timestamp("claimed_at"), // When the QR was scanned and filled
  claimedBy: varchar("claimed_by").references(() => users.id),
  generatedBy: varchar("generated_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Audit logs for tracking changes
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  action: varchar("action").notNull(), // CREATE, UPDATE, DELETE
  tableName: varchar("table_name").notNull(),
  recordId: varchar("record_id").notNull(),
  changes: jsonb("changes"),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  qrCodes: many(qrCodes),
  auditLogs: many(auditLogs),
  genotypedAnimals: many(animals),
}));

export const cagesRelations = relations(cages, ({ one, many }) => ({
  animals: many(animals),
  qrCodes: many(qrCodes),
  attachments: many(fileAttachments),
  // strain: one(strains, {
  //   fields: [cages.strainId],
  //   references: [strains.id],
  // }), // Temporarily commented until DB migration
}));

export const fileAttachmentsRelations = relations(fileAttachments, ({ one }) => ({
  animal: one(animals, {
    fields: [fileAttachments.animalId],
    references: [animals.id],
  }),
  cage: one(cages, {
    fields: [fileAttachments.cageId],
    references: [cages.id],
  }),
  uploader: one(users, {
    fields: [fileAttachments.uploadedBy],
    references: [users.id],
  }),
}));

export const strainsRelations = relations(strains, ({ many }) => ({
  animals: many(animals),
}));

export const genotypesRelations = relations(genotypes, ({ many }) => ({
  animals: many(animals),
}));

export const animalsRelations = relations(animals, ({ one, many }) => ({
  cage: one(cages, {
    fields: [animals.cageId],
    references: [cages.id],
  }),
  genotypingUser: one(users, {
    fields: [animals.genotypingUserId],
    references: [users.id],
  }),
  qrCodes: many(qrCodes),
  attachments: many(fileAttachments),
}));

export const qrCodesRelations = relations(qrCodes, ({ one }) => ({
  animal: one(animals, {
    fields: [qrCodes.animalId],
    references: [animals.id],
  }),
  cage: one(cages, {
    fields: [qrCodes.cageId],
    references: [cages.id],
  }),
  generatedBy: one(users, {
    fields: [qrCodes.generatedBy],
    references: [users.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCageSchema = createInsertSchema(cages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAnimalSchema = createInsertSchema(animals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  dateOfBirth: z.string().optional().or(z.date().optional()),
  breedingStartDate: z.string().optional().or(z.date().optional()),
  dateOfGenotyping: z.string().optional().or(z.date().optional()),
});

export const insertQrCodeSchema = createInsertSchema(qrCodes).omit({
  id: true,
  createdAt: true,
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  timestamp: true,
});

export const insertFileAttachmentSchema = createInsertSchema(fileAttachments).omit({
  id: true,
  createdAt: true,
});

export const insertStrainSchema = createInsertSchema(strains).omit({
  id: true,
  createdAt: true,
});

export const insertGenotypeSchema = createInsertSchema(genotypes).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type UpsertUser = typeof users.$inferInsert;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Cage = typeof cages.$inferSelect;
export type InsertCage = z.infer<typeof insertCageSchema>;

export type Animal = typeof animals.$inferSelect;
export type InsertAnimal = z.infer<typeof insertAnimalSchema>;

export type QrCode = typeof qrCodes.$inferSelect;
export type InsertQrCode = z.infer<typeof insertQrCodeSchema>;

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;

export type FileAttachment = typeof fileAttachments.$inferSelect;
export type InsertFileAttachment = z.infer<typeof insertFileAttachmentSchema>;

export type Strain = typeof strains.$inferSelect;
export type InsertStrain = z.infer<typeof insertStrainSchema>;

export type Genotype = typeof genotypes.$inferSelect;
export type InsertGenotype = z.infer<typeof insertGenotypeSchema>;
