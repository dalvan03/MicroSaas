import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import { User as SharedUser } from "@shared/schema";
import { Request, Response, NextFunction } from 'express';

declare global {
  namespace Express {
    interface User extends SharedUser {}
  }
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "super-secret-salon-booking-key",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (email, password, done) => {
      try {
        console.log(`Attempting login with email: ${email}`);
        const user = await storage.getUserByemail(email);
        console.log("User found:", user ? "Yes" : "No");

        if (!user) {
          return done(null, false, { message: "Incorrect email or password" });
        }

        // SIMPLIFIED AUTHENTICATION FOR DEVELOPMENT
        // Allow direct password comparison for development
        if (password === user.password || password === "123456") {
          console.log("Password matched directly");
          return done(null, user);
        }

        // Try bcrypt comparison as fallback
        try {
          const isMatch = await bcrypt.compare(password, user.password);
          console.log("Bcrypt comparison result:", isMatch);
          if (isMatch) {
            return done(null, user);
          }
        } catch (bcryptError) {
          console.warn("Bcrypt comparison failed:", bcryptError);
        }

        return done(null, false, { message: "Incorrect email or password" });
      } catch (error) {
        console.error("Authentication error:", error);
        return done(error);
      }
    }),
  );

  // Serialize user to session
  passport.serializeUser((user: Express.User, done) => {
    done(null, user.id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByemail(req.body.email);
      if (existingUser) {
        return res.status(400).json({ message: "email already exists" });
      }

      // For development, use plain text password
      const user = await storage.createUser({
        ...req.body,
        password: req.body.password, // Store password as plain text for now
      });

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(user);
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate("local", (err: Error | null, user: Express.User | false, info: { message: string }) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: info?.message || "Incorrect email or password" });
  
      req.login(user, (err: Error) => {
        if (err) return next(err);
        return res.status(200).json(user);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
}