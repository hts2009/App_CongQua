
// This is a placeholder for SQLite service integration.
// In a real application, you would initialize your database connection here
// and define functions to interact with your tables.

import Database from 'better-sqlite3';
import type { Contribution, ContributionFormData, Template, Unit, WorkType, User } from '@/types';
import path from 'path';
import fs from 'fs';

// Define the path to the database file
// It's often placed in a non-public directory, or a persistent volume in production.
// For local development, this might be in the project root or a 'data' folder.
const DB_PATH = process.env.NODE_ENV === 'production' 
    ? '/data/database.db' // Example for a persistent volume in production
    : path.join(process.cwd(), 'local-database.db');


let db: Database.Database;

try {
    // Ensure directory exists for local development
    if (process.env.NODE_ENV !== 'production') {
        const dir = path.dirname(DB_PATH);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }
    db = new Database(DB_PATH, { verbose: console.log }); // Remove verbose in production
    console.log(`SQLite database connected at ${DB_PATH}`);
    
    // Initialize schema if it doesn't exist (very basic example)
    // In a real app, use a migration tool (e.g., Knex.js, Drizzle ORM migrations)
    db.exec(`
        CREATE TABLE IF NOT EXISTS contributions (
            id TEXT PRIMARY KEY,
            templateId TEXT,
            userId TEXT,
            donorName TEXT,
            unitId TEXT,
            workTypeId TEXT,
            amount REAL,
            datetime TEXT,
            receiptNumber TEXT UNIQUE,
            notes TEXT,
            isPrinted INTEGER DEFAULT 0 -- 0 for false, 1 for true
        );

        CREATE TABLE IF NOT EXISTS templates (
            id TEXT PRIMARY KEY,
            name TEXT,
            configJson TEXT, -- Store as JSON string
            isActive INTEGER,
            createdAt TEXT,
            updatedAt TEXT
        );
        
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT UNIQUE,
            role TEXT, -- 'admin', 'receptionist'
            isActive INTEGER,
            createdAt TEXT,
            hashedPassword TEXT -- Store hashed passwords, not plaintext!
        );

        CREATE TABLE IF NOT EXISTS units (
            id TEXT PRIMARY KEY,
            name TEXT UNIQUE,
            priority INTEGER,
            isActive INTEGER
        );

        CREATE TABLE IF NOT EXISTS work_types (
            id TEXT PRIMARY KEY,
            name TEXT UNIQUE,
            priority INTEGER,
            isActive INTEGER
        );
    `);
    console.log("Database schema checked/initialized.");

} catch (error) {
    console.error("Failed to connect to or initialize SQLite database:", error);
    // In a real app, you might want to throw this error or handle it gracefully
    // For now, if db connection fails, the app will rely on mock data if the actions are structured to do so.
}


// --- Placeholder Contribution Functions ---
export async function dbRecordContribution(data: ContributionFormData, userId: string, newId: string, receiptNumber: string): Promise<Contribution> {
  if (!db) throw new Error("Database not initialized.");
  // This is a simplified insert. Real app would handle SQL injection, data validation more robustly.
  const stmt = db.prepare(`
    INSERT INTO contributions (id, templateId, userId, donorName, amount, datetime, receiptNumber, notes, unitId, workTypeId, isPrinted)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    newId,
    data.templateId,
    userId,
    data.donorName,
    data.amount,
    data.contributionDate.toISOString(),
    receiptNumber, // Use the passed receipt number
    data.notes,
    data.unitId,
    data.workTypeId,
    0 // isPrinted defaults to false
  );
  return { ...data, id: newId, userId, datetime: data.contributionDate.toISOString(), receiptNumber, isPrinted: false };
}

export async function dbUpdatePrintStatus(contributionId: string, isPrinted: boolean): Promise<void> {
  if (!db) throw new Error("Database not initialized.");
  const stmt = db.prepare('UPDATE contributions SET isPrinted = ? WHERE id = ?');
  stmt.run(isPrinted ? 1 : 0, contributionId);
}

export async function dbGetUserContributionHistory(userId: string): Promise<Contribution[]> {
  if (!db) throw new Error("Database not initialized.");
  const stmt = db.prepare('SELECT * FROM contributions WHERE userId = ? ORDER BY datetime DESC');
  const rows = stmt.all(userId) as any[]; // Type assertion
  return rows.map(row => ({...row, isPrinted: Boolean(row.isPrinted)}));
}

export async function dbGetAllContributionsForReport(): Promise<Contribution[]> {
  if (!db) throw new Error("Database not initialized.");
  const stmt = db.prepare('SELECT * FROM contributions ORDER BY datetime DESC');
  const rows = stmt.all() as any[]; // Type assertion
  return rows.map(row => ({...row, isPrinted: Boolean(row.isPrinted)}));
}

export async function dbGetContributionsForReceiptNumberGeneration(datePrefix: string): Promise<{ receiptNumber: string }[]> {
  if (!db) throw new Error("Database not initialized.");
  // Select only the receiptNumber column for efficiency
  const stmt = db.prepare("SELECT receiptNumber FROM contributions WHERE receiptNumber LIKE ?");
  // The pattern should be datePrefix + '%' to match any characters after the prefix
  const rows = stmt.all(datePrefix + '%') as { receiptNumber: string }[];
  return rows;
}


// --- Placeholder Template Functions ---
export async function dbGetAllTemplates(): Promise<Template[]> {
    if (!db) throw new Error("Database not initialized.");
    const stmt = db.prepare('SELECT * FROM templates ORDER BY createdAt DESC');
    const rows = stmt.all() as any[];
    return rows.map(row => ({...row, configJson: JSON.parse(row.configJson || '{}'), isActive: Boolean(row.isActive) }));
}

export async function dbGetTemplateById(id: string): Promise<Template | null> {
    if (!db) throw new Error("Database not initialized.");
    const stmt = db.prepare('SELECT * FROM templates WHERE id = ?');
    const row = stmt.get(id) as any;
    return row ? {...row, configJson: JSON.parse(row.configJson || '{}'), isActive: Boolean(row.isActive)} : null;
}

export async function dbSaveTemplate(template: Template): Promise<Template> {
    if (!db) throw new Error("Database not initialized.");
    const existingStmt = db.prepare('SELECT id FROM templates WHERE id = ?');
    const existing = existingStmt.get(template.id);

    if (existing) {
        const stmt = db.prepare(`
            UPDATE templates 
            SET name = ?, configJson = ?, isActive = ?, updatedAt = ?
            WHERE id = ?
        `);
        stmt.run(template.name, JSON.stringify(template.configJson), template.isActive ? 1 : 0, new Date().toISOString(), template.id);
    } else {
        const stmt = db.prepare(`
            INSERT INTO templates (id, name, configJson, isActive, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?)
        `);
        stmt.run(template.id, template.name, JSON.stringify(template.configJson), template.isActive ? 1 : 0, template.createdAt, template.updatedAt || template.createdAt);
    }
    return template;
}

export async function dbDeleteTemplate(templateId: string): Promise<void> {
    if (!db) throw new Error("Database not initialized.");
    const stmt = db.prepare('DELETE FROM templates WHERE id = ?');
    stmt.run(templateId);
}

// Add other placeholder functions for Users, Units, WorkTypes as needed
// e.g., dbGetUsers, dbAddUser, dbGetUnits, dbAddUnit, etc.

// Ensure the database connection is closed gracefully on application shutdown
// This is important for 'better-sqlite3'
if (db) {
    process.on('exit', () => db.close());
    process.on('SIGINT', () => db.close()); // Catches Ctrl+C
    process.on('SIGHUP', () => db.close());
    process.on('SIGTERM', () => db.close());
}
