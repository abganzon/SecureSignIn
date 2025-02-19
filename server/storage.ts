import { type User, type InsertUser, type Universe, type InsertUniverse, users, universes } from "@shared/schema";
import { eq } from "drizzle-orm";
import { db } from "./db";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

interface ResetToken {
  userId: number;
  token: string;
  expires: Date;
}

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByOAuth(provider: "google" | "github", id: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserPassword(id: number, password: string): Promise<void>;

  // Password reset operations
  saveResetToken(userId: number, token: string, expires: Date): Promise<void>;
  getUserByResetToken(token: string): Promise<User | undefined>;
  clearResetToken(userId: number): Promise<void>;

  // Universe operations
  getUniverses(userId: number): Promise<Universe[]>;
  getUniverse(id: number): Promise<Universe | undefined>;
  createUniverse(universe: InsertUniverse): Promise<Universe>;

  // Session store
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  private resetTokens: Map<string, ResetToken>;
  sessionStore: session.Store;


  async getUniverseHistory(universeId: number): Promise<UniverseHistory[]> {
    return await db.select().from(universeHistory).where(eq(universeHistory.universeId, universeId));
  }

  async addUniverseHistory(data: { universeId: number, action: string, description: string, changes?: any }): Promise<UniverseHistory> {
    const [history] = await db.insert(universeHistory).values(data).returning();
    return history;
  }

  constructor() {
    this.resetTokens = new Map();
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByOAuth(provider: "google" | "github", id: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(
        provider === "google" 
          ? eq(users.googleId, id)
          : eq(users.githubId, id)
      );
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUserPassword(id: number, password: string): Promise<void> {
    await db.update(users)
      .set({ password })
      .where(eq(users.id, id));
  }

  // For now, we'll keep reset tokens in memory
  // In a production environment, these should be stored in the database
  async saveResetToken(userId: number, token: string, expires: Date): Promise<void> {
    this.resetTokens.set(token, { userId, token, expires });
  }

  async getUserByResetToken(token: string): Promise<User | undefined> {
    const resetToken = this.resetTokens.get(token);
    if (!resetToken || resetToken.expires < new Date()) {
      return undefined;
    }
    return this.getUser(resetToken.userId);
  }

  async clearResetToken(userId: number): Promise<void> {
    for (const [token, data] of this.resetTokens.entries()) {
      if (data.userId === userId) {
        this.resetTokens.delete(token);
      }
    }
  }

  async getUniverses(userId: number): Promise<Universe[]> {
    return db.select().from(universes).where(eq(universes.userId, userId));
  }

  async getUniverse(id: number): Promise<Universe | undefined> {
    const [universe] = await db.select().from(universes).where(eq(universes.id, id));
    return universe;
  }

  async createUniverse(insertUniverse: InsertUniverse): Promise<Universe> {
    const [universe] = await db.insert(universes).values(insertUniverse).returning();
    return universe;
  }
}

export const storage = new DatabaseStorage();