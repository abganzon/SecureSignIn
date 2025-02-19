import { pgTable, text, serial, integer, jsonb, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password"),
  email: text("email").notNull().unique(),
  googleId: text("google_id"),
  githubId: text("github_id"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const universes = pgTable("universes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  userId: integer("user_id").notNull(),
  recordCount: integer("record_count").notNull(),
  mappings: jsonb("mappings").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const records = pgTable("records", {
  id: serial("id").primaryKey(),
  universeId: integer("universe_id").notNull(),
  // Identity Information
  identityType: text("identity_type"),
  // Personal Information
  firstName: text("first_name"),
  lastName: text("last_name"),
  birthYear: text("birth_year"),
  dateOfBirth: text("date_of_birth"),
  gender: text("gender"),
  // Contact Information
  addressLine1: text("address_line1"),
  addressLine2: text("address_line2"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  zipPlus4: text("zip_plus4"),
  phoneNumber: text("phone_number"),
  emailAddress: text("email_address"),
  // Business Information
  jobTitle: text("job_title"),
  department: text("department"),
  seniorityLevel: text("seniority_level"),
  businessEmail: text("business_email"),
  directPhone: text("direct_phone"),
  linkedinUrl: text("linkedin_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  googleId: true,
  githubId: true,
  avatarUrl: true,
});

export const insertUniverseSchema = createInsertSchema(universes).pick({
  name: true,
  type: true,
  userId: true,
  recordCount: true,
  mappings: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertUniverse = z.infer<typeof insertUniverseSchema>;
export type Universe = typeof universes.$inferSelect;
export type Record = typeof records.$inferSelect;

export const AVAILABLE_MAPPINGS = {
  Identity: {
    title: "Identity Information",
    fields: [
      { value: "identity_type", label: "Identity Type" }
    ]
  },
  Personal: {
    title: "Personal Information", 
    fields: [
      { value: "first_name", label: "First Name" },
      { value: "last_name", label: "Last Name" },
      { value: "birth_year", label: "Birth Year" },
      { value: "date_of_birth", label: "Full Date of Birth" },
      { value: "gender", label: "Gender" }
    ]
  },
  Contact: {
    title: "Contact Information",
    fields: [
      { value: "address_line1", label: "Address Line 1" },
      { value: "address_line2", label: "Address Line 2" },
      { value: "city", label: "City" },
      { value: "state", label: "State" },
      { value: "zip_code", label: "ZIP Code" },
      { value: "zip_plus4", label: "ZIP+4" },
      { value: "phone_number", label: "Phone Number" },
      { value: "email_address", label: "Email Address" }
    ]
  },
  Business: {
    title: "Business Information",
    fields: [
      { value: "job_title", label: "Job Title" },
      { value: "department", label: "Department" },
      { value: "seniority_level", label: "Seniority Level" },
      { value: "business_email", label: "Business Email" },
      { value: "direct_phone", label: "Direct Phone" },
      { value: "linkedin_url", label: "LinkedIn URL" }
    ]
  }
};