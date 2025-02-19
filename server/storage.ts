import { type User, type InsertUser, type Universe, type InsertUniverse } from "@shared/schema";

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
}

interface ResetToken {
  userId: number;
  token: string;
  expires: Date;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private universes: Map<number, Universe>;
  private resetTokens: Map<string, ResetToken>;
  private currentUserId: number;
  private currentUniverseId: number;

  constructor() {
    this.users = new Map();
    this.universes = new Map();
    this.resetTokens = new Map();
    this.currentUserId = 1;
    this.currentUniverseId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async getUserByOAuth(provider: "google" | "github", id: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => (provider === "google" && user.googleId === id) || 
                (provider === "github" && user.githubId === id)
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt: new Date(),
      googleId: null,
      githubId: null,
      avatarUrl: null
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserPassword(id: number, password: string): Promise<void> {
    const user = await this.getUser(id);
    if (user) {
      user.password = password;
      this.users.set(id, user);
    }
  }

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
    return Array.from(this.universes.values()).filter(
      (universe) => universe.userId === userId
    );
  }

  async getUniverse(id: number): Promise<Universe | undefined> {
    return this.universes.get(id);
  }

  async createUniverse(insertUniverse: InsertUniverse): Promise<Universe> {
    const id = this.currentUniverseId++;
    const universe: Universe = { ...insertUniverse, id, createdAt: new Date() };
    this.universes.set(id, universe);
    return universe;
  }
}

export const storage = new MemStorage();