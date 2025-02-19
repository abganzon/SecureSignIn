import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import passport from "passport";
import session from "express-session";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import { z } from "zod";
import { insertUniverseSchema, insertUserSchema, records } from "@shared/schema";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import multer from "multer";
import Papa from "papaparse";
import { db } from "./db";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  // Make sure we have both parts of the stored password
  if (!stored.includes('.')) {
    console.log('Invalid stored password format');
    return false;
  }

  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// Generate a random token for password reset
function generateResetToken() {
  return randomBytes(32).toString("hex");
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Session setup with remember me functionality
  app.use(session({
    secret: process.env.SESSION_SECRET || 'keyboard cat',
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours by default
    }
  }));

  app.use(passport.initialize());
  app.use(passport.session());

  // Local Strategy
  passport.use(new LocalStrategy({ 
    usernameField: 'email',
    passReqToCallback: true
  }, async (req, email, password, done) => {
    try {
      const user = await storage.getUserByEmail(email);
      if (!user || !user.password) {
        return done(null, false, { message: 'Invalid credentials' });
      }
      const isValid = await comparePasswords(password, user.password);
      if (!isValid) {
        return done(null, false, { message: 'Invalid credentials' });
      }

      // If remember me is checked, extend session
      if (req.body.rememberMe) {
        req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
      }

      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }));

  // Passport serialization
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Password reset routes
  app.post('/api/auth/forgot-password', async (req, res) => {
    try {
      const { email } = req.body;
      const user = await storage.getUserByEmail(email);

      if (!user) {
        // Don't reveal if user exists
        return res.json({ message: 'If an account exists, you will receive a password reset email.' });
      }

      // Generate and save reset token
      const resetToken = generateResetToken();
      const resetExpires = new Date(Date.now() + 3600000); // 1 hour

      await storage.saveResetToken(user.id, resetToken, resetExpires);

      // In a real application, send email here
      // For now, just return the token in the response
      res.json({ 
        message: 'Password reset instructions sent.',
        token: resetToken // Remove this in production
      });
    } catch (err) {
      res.status(500).json({ message: 'Error processing request' });
    }
  });

  app.post('/api/auth/reset-password', async (req, res) => {
    try {
      const { token, password } = req.body;

      // Verify token and get user
      const user = await storage.getUserByResetToken(token);
      if (!user) {
        return res.status(400).json({ message: 'Invalid or expired reset token' });
      }

      // Hash new password and update user
      const hashedPassword = await hashPassword(password);
      await storage.updateUserPassword(user.id, hashedPassword);
      await storage.clearResetToken(user.id);

      res.json({ message: 'Password successfully reset' });
    } catch (err) {
      res.status(500).json({ message: 'Error resetting password' });
    }
  });

  // Local auth routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const data = insertUserSchema.parse(req.body);

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(data.email);
      if (existingUser) {
        return res.status(400).json({ message: 'Email already registered' });
      }

      // Hash password and create user
      const hashedPassword = await hashPassword(data.password!);
      const user = await storage.createUser({
        ...data,
        password: hashedPassword
      });

      // Log user in after registration
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: 'Error logging in' });
        }
        return res.status(201).json(user);
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid data', errors: err.errors });
      }
      throw err;
    }
  });

  app.post('/api/auth/login', (req, res, next) => {
    console.log('Login attempt:', { email: req.body.email });
    passport.authenticate('local', (err: any, user: any, info: any) => {
      if (err) {
        console.error('Login error:', err);
        return next(err);
      }
      if (!user) {
        console.log('Login failed:', info?.message);
        return res.status(401).json({ message: info?.message || 'Authentication failed' });
      }
      req.login(user, (err) => {
        if (err) return next(err);
        console.log('Login successful for user:', user.id);
        return res.json(user);
      });
    })(req, res, next);
  });

  // OAuth routes
  app.get('/api/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
  );

  app.get('/api/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    (req, res) => {
      res.redirect('/dashboard');
    }
  );

  app.get('/api/auth/github',
    passport.authenticate('github', { scope: ['user:email'] })
  );

  app.get('/api/auth/github/callback',
    passport.authenticate('github', { failureRedirect: '/login' }),
    (req, res) => {
      res.redirect('/dashboard');
    }
  );

  app.get('/api/auth/logout', (req, res) => {
    req.logout(() => {
      res.redirect('/');
    });
  });

  // User routes
  app.get('/api/user', (req, res) => {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }
    res.json(req.user);
  });

  // Configure multer for file upload
  const upload = multer({ storage: multer.memoryStorage() });

  // Universe routes
  app.post('/api/universes', upload.single('file'), async (req, res) => {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    try {
      // Parse the JSON data from the form
      const data = JSON.parse(req.body.data);

      // Validate the universe data
      const universeData = insertUniverseSchema.parse({
        ...data,
        userId: (req.user as any).id
      });

      // Create the universe
      const universe = await storage.createUniverse(universeData);

      // Parse the CSV file
      const csvData = req.file?.buffer.toString();
      if (!csvData) {
        throw new Error('No file data received');
      }

      // Parse CSV and insert records
      Papa.parse(csvData, {
        header: true,
        skipEmptyLines: true,
        complete: async (results: Papa.ParseResult<any>) => {
          // Convert CSV data to database records using the mappings
          const recordsToInsert = results.data.map((row) => {
            const record: Record<string, any> = {
              universeId: universe.id,
            };

            // Apply mappings to transform CSV columns to database fields
            Object.entries(data.mappings).forEach(([csvColumn, dbField]) => {
              if (typeof csvColumn === 'string' && typeof dbField === 'string') {
                record[dbField] = row[csvColumn];
              }
            });

            return record;
          });

          // Insert all records
          await db.insert(records).values(recordsToInsert);
        },
        error: (error: Error) => {
          console.error('CSV parsing error:', error);
          throw error;
        }
      });

      res.json(universe);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: 'Invalid data', errors: err.errors });
        return;
      }
      console.error('Error creating universe:', err);
      res.status(500).json({ message: 'Error creating universe' });
    }
  });

  app.get('/api/universes', async (req, res) => {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }
    const universes = await storage.getUniverses((req.user as any).id);
    res.json(universes);
  });

  const httpServer = createServer(app);
  return httpServer;
}