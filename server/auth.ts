import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import MemoryStore from "memorystore";
import connectPgSimple from "connect-pg-simple";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { pool } from "./db";
import { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  // Set up session store based on environment
  const isProduction = process.env.NODE_ENV === 'production';
  
  let sessionStore;
  
  if (isProduction) {
    // Use PostgreSQL for session storage in production
    const PgSessionStore = connectPgSimple(session);
    sessionStore = new PgSessionStore({
      pool,
      createTableIfMissing: true
    });
  } else {
    // Use memory store for development
    const MemorySessionStore = MemoryStore(session);
    sessionStore = new MemorySessionStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
  }

  // Generate a session secret if one is not provided
  if (!process.env.SESSION_SECRET) {
    process.env.SESSION_SECRET = randomBytes(32).toString('hex');
    console.log("Generated a new SESSION_SECRET");
  }

  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      secure: isProduction,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
      sameSite: 'lax',
      httpOnly: true
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      {
        usernameField: 'email',  // Use email field instead of username
        passwordField: 'password'
      },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          if (!user) {
            return done(null, false, { message: "Incorrect email" });
          }
          
          const validPassword = await comparePasswords(password, user.password);
          if (!validPassword) {
            return done(null, false, { message: "Incorrect password" });
          }
          
          // Update last active timestamp
          await storage.updateUserLastActive(user.id);
          
          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    ),
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      if (typeof id !== 'number' || isNaN(id)) {
        console.error("Deserialize User: Invalid ID received from session:", id);
        return done(new Error("Invalid user ID in session"));
      }
      let user;
      try {
        user = await storage.getUser(id);
      } catch (dbError) {
        console.error(`Deserialize User: Error fetching user with ID ${id}:`, dbError);
        return done(dbError);
      }
      
      console.log(`Deserialize User: Fetched user for ID ${id}:`, user ? user.username : 'Not Found');
      done(null, user);
    } catch (err) {
      console.error("Deserialize User: Unexpected error:", err);
      done(err);
    }
  });

  // Register API routes
  app.post("/api/register", async (req, res, next) => {
    try {
      const { password, email, interests, characteristics, bio } = req.body;
      
      // Validate required fields
      if (!password || !email) {
        return res.status(400).json({ 
          message: "Required fields: password, email" 
        });
      }

      // Generate anonymous username using Gemini AI
      const interestsArray = Array.isArray(interests) ? interests : [];
      const characteristicsArray = Array.isArray(characteristics) ? characteristics : [];
      
      // Import aiService for generating anonymous username
      const { aiService } = await import('./ai');
      const generatedUsername = await aiService.generateAnonymousUsername(interestsArray, characteristicsArray);
      
      // Ensure the generated username is unique by adding a random suffix if needed
      let username = generatedUsername;
      let counter = 0;
      let existingUser = await storage.getUserByUsername(username);
      
      while (existingUser && counter < 5) {
        // Add random suffix to make username unique
        const randomSuffix = Math.floor(Math.random() * 1000).toString();
        username = `${generatedUsername.substring(0, 12)}_${randomSuffix}`;
        existingUser = await storage.getUserByUsername(username);
        counter++;
      }
      
      if (existingUser) {
        // If still not unique after 5 attempts, create a completely random one
        username = `anon_${Math.random().toString(36).substring(2, 10)}`;
      }

      // Generate a display name based on the same information
      const displayName = username; // Use the same AI-generated name for both username and display name

      console.log(`Generated anonymous username and display name: ${username}`);

      // Create new user with the generated username and display name
      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({
        username,
        password: hashedPassword,
        displayName,
        email,
        bio: bio || null,
        interests: interestsArray.length > 0 ? interestsArray : null,
        goals: null,
        experiences: null,
        profilePic: null,
      });

      // Log in the new user
      req.login(user, (err) => {
        if (err) return next(err);
        // Don't send password in response
        const { password, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
      });
    } catch (err) {
      console.error("Registration error:", err);
      next(err);
    }
  });

  app.post("/api/login", (req, res, next) => {
    console.log("Login attempt:", req.body.email);
    
    passport.authenticate("local", (err: any, user: Express.User | false, info: { message: string } | undefined) => {
      if (err) {
        console.error("Login error:", err);
        return next(err);
      }
      
      if (!user) {
        console.log("Authentication failed:", info?.message);
        return res.status(401).json({ message: info?.message || "Authentication failed" });
      }
      
      console.log("User authenticated, establishing session for:", user.username);
      
      req.login(user, (err) => {
        if (err) {
          console.error("Session creation error:", err);
          return next(err);
        }
        
        // Don't send password in response
        const { password, ...userWithoutPassword } = user;
        console.log("Login successful for:", user.username);
        return res.json(userWithoutPassword);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.status(200).json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    // Don't send password in response
    const { password, ...userWithoutPassword } = req.user as SelectUser;
    res.json(userWithoutPassword);
  });
}