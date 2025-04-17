// server/app.ts
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes"; // Assuming this sets up API routes and returns the app or router
import { setupVite, serveStatic, log } from "./vite"; // We might need to adjust Vite/Static handling for serverless
import { seedDatabase } from "./seed"; // Seeding needs to be re-evaluated for serverless
import { suggestionService } from "./suggestion-service";
import { researchService } from "./research-service";
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Custom Logging Middleware (Keep as is for now)
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
    if (path.startsWith("/api")) { // Only log API calls perhaps?
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
          sanitizedResponse.users = sanitizedResponse.users.map((user: any) => {
            if (user && user.password) {
              return { ...user, password: "[REDACTED]" };
            }
            return user;
          });
        }

        // Sanitize matches that may contain user objects
        if (sanitizedResponse.matches && Array.isArray(sanitizedResponse.matches)) {
          sanitizedResponse.matches = sanitizedResponse.matches.map((match: any) => {
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
      log(logLine);
    }
  });

  next();
});


// Function to initialize services - call this within the handler or routes
async function initializeServices() {
  // Basic check to prevent re-initialization if already done.
  // You might need more robust checks depending on your service implementation.
  // @ts-ignore - Check if a custom property exists or rely on service internal state
  if (globalThis.__SERVICES_INITIALIZED__) {
      return;
  }

  if (process.env.GEMINI_API_KEY) {
    try {
      log("Initializing AI services...");
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      // Assuming these services have internal checks or can be re-initialized safely
      await suggestionService.initialize(process.env.GEMINI_API_KEY);
      researchService.initialize(genAI);
      log("AI services initialized.");
      // @ts-ignore - Set a flag indicating initialization is done
      globalThis.__SERVICES_INITIALIZED__ = true;
    } catch (error) {
      console.error("Failed to initialize AI services with Gemini API:", error);
      // Decide if failure is critical. If so, re-throw the error.
      // throw error;
    }
  } else {
    console.warn("GEMINI_API_KEY is not set, AI-powered services will not be available");
  }
}

// Register API routes
// Ensure `registerRoutes` imports and uses this 'app' instance.
// It should NOT call app.listen().
// It might need to await initializeServices() internally if routes depend on them immediately.
registerRoutes(app);


// Error Handling Middleware (Keep as is)
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled Error:", err); // Log the actual error server-side
  const status = err.status || err.statusCode || 500;
  // Avoid sending detailed internal errors to the client in production
  const message = (process.env.NODE_ENV === 'production' && status === 500)
    ? "Internal Server Error"
    : (err.message || "Internal Server Error");
  res.status(status).json({ message });
});

// Export the configured app instance AND the initializer
export { app, initializeServices }; 