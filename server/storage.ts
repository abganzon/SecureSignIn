import { type User, type InsertUser, type Universe, type InsertUniverse } from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByOAuth(provider: "google" | "github", id: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Universe operations
  getUniverses(userId: number): Promise<Universe[]>;
  getUniverse(id: number): Promise<Universe | undefined>;
  createUniverse(universe: InsertUniverse): Promise<Universe>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private universes: Map<number, Universe>;
  private currentUserId: number;
  private currentUniverseId: number;

  constructor() {
    this.users = new Map();
    this.universes = new Map();
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
    const user: User = { ...insertUser, id, createdAt: new Date() };
    this.users.set(id, user);
    return user;
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
