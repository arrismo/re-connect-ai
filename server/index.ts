import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { seedDatabase } from "./seed";
import { suggestionService } from "./suggestion-service";
import { researchService } from "./research-service";
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        // Create a sanitized copy to remove sensitive information
        const sanitizedResponse = JSON.parse(JSON.stringify(capturedJsonResponse));
        
        // Sanitize user passwords
        if (sanitizedResponse.user && sanitizedResponse.user.password) {
          sanitizedResponse.user.password = "[REDACTED]";
        }
        
        // Sanitize users in arrays
        if (sanitizedResponse.users && Array.isArray(sanitizedResponse.users)) {
          sanitizedResponse.users = sanitizedResponse.users.map(user => {
            if (user && user.password) {
              return { ...user, password: "[REDACTED]" };
            }
            return user;
          });
        }
        
        // Sanitize matches that may contain user objects
        if (sanitizedResponse.matches && Array.isArray(sanitizedResponse.matches)) {
          sanitizedResponse.matches = sanitizedResponse.matches.map(match => {
            if (match && match.otherUser && match.otherUser.password) {
              return { 
                ...match, 
                otherUser: { ...match.otherUser, password: "[REDACTED]" } 
              };
            }
            return match;
          });
        }
        
        // Sanitize match object
        if (sanitizedResponse.match && sanitizedResponse.match.otherUser && sanitizedResponse.match.otherUser.password) {
          sanitizedResponse.match = {
            ...sanitizedResponse.match,
            otherUser: { ...sanitizedResponse.match.otherUser, password: "[REDACTED]" }
          };
        }
        
        logLine += ` :: ${JSON.stringify(sanitizedResponse)}`;
      }

      // Remove length limit to show full logs

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Initialize suggestion service with Gemini API key
  if (process.env.GEMINI_API_KEY) {
    try {
      console.log("GEMINI_API_KEY is set and valid");
      await suggestionService.initialize(process.env.GEMINI_API_KEY);
    } catch (error) {
      console.error("Failed to initialize suggestion service with Gemini API:", error);
    }
  } else {
    console.warn("GEMINI_API_KEY is not set, suggestion service will not be available");
  }

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
  }, () => {
    log(`serving on port ${port}`);
    
    // Seed database with initial data
    seedDatabase();
  });
})();
