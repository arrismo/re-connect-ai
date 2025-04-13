import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { aiService } from "./ai";
import { z } from "zod";
import bcrypt from "bcryptjs";
import {
  insertUserSchema,
  insertMatchSchema,
  insertChallengeSchema,
  insertChallengeProgressSchema,
  insertMessageSchema,
  insertAchievementSchema,
  insertInterestSchema
} from "@shared/schema";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { setupAuth } from "./auth";

// Auth middleware
function ensureAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Authentication required" });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup Google AI client
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
    aiService.initialize(genAI);
    console.log("Gemini AI model initialized successfully");
  } catch (error) {
    console.error("Failed to initialize Google AI:", error);
  }
  
  // Setup authentication
  setupAuth(app);

  // ================== AUTH ROUTES ==================
  
  // Default interests are now created through setupAuth function
  // Auth routes handled by the /api/register, /api/login, /api/logout, /api/user endpoints in auth.ts
  
  // Note: the basic /api/user endpoint already exists from auth.ts, 
  // so this is redundant and can be removed
  
  // ================== USER ROUTES ==================
  
  // Update user profile
  app.put("/api/users/:id", ensureAuthenticated, async (req: any, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Check if user is updating their own profile
      if (req.user.id !== userId) {
        return res.status(403).json({ message: "You can only update your own profile" });
      }
      
      const userData = z.object({
        displayName: z.string().optional(),
        bio: z.string().optional(),
        interests: z.array(z.string()).optional(),
        goals: z.array(z.string()).optional(),
        experiences: z.array(z.string()).optional(),
        profilePic: z.string().optional()
      }).parse(req.body);
      
      const updatedUser = await storage.updateUser(userId, userData);
      
      res.status(200).json({ user: { ...updatedUser, password: undefined } });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });
  
  // ================== MATCH ROUTES ==================
  
  // Get all matches for a user
  app.get("/api/matches", ensureAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const matches = await storage.getUserMatches(userId);
      
      // Get match details with other user info
      const matchesWithUsers = await Promise.all(
        matches.map(async (match) => {
          const otherUserId = match.userId1 === userId ? match.userId2 : match.userId1;
          const otherUser = await storage.getUser(otherUserId);
          
          // Get active challenge for the match
          const activeChallenge = await storage.getActiveMatchChallenge(match.id);
          
          if (!otherUser) {
            return null;
          }
          
          return {
            ...match,
            otherUser: { ...otherUser, password: undefined },
            activeChallenge
          };
        })
      );
      
      res.status(200).json({ matches: matchesWithUsers.filter(Boolean) });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });
  
  // Get a single match
  app.get("/api/matches/:id", ensureAuthenticated, async (req: any, res) => {
    try {
      const matchId = parseInt(req.params.id);
      const match = await storage.getMatch(matchId);
      
      if (!match) {
        return res.status(404).json({ message: "Match not found" });
      }
      
      // Check if user is part of the match
      if (match.userId1 !== req.user.id && match.userId2 !== req.user.id) {
        return res.status(403).json({ message: "You don't have access to this match" });
      }
      
      // Get other user details
      const otherUserId = match.userId1 === req.user.id ? match.userId2 : match.userId1;
      const otherUser = await storage.getUser(otherUserId);
      
      // Get challenges for this match
      const challenges = await storage.getMatchChallenges(matchId);
      
      // Get recent messages
      const messages = await storage.getRecentMatchMessages(matchId, 20);
      
      if (!otherUser) {
        return res.status(404).json({ message: "Match user not found" });
      }
      
      res.status(200).json({ 
        match: {
          ...match,
          otherUser: { ...otherUser, password: undefined },
          challenges,
          messages
        } 
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });
  
  // Find potential matches with AI recommendation
  app.get("/api/matches/find", ensureAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const interests = req.query.interests ? req.query.interests.split(',') : [];
      
      // Get current user
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get all other users
      const allUsers = await storage.getAllUsers();
      
      // Filter out users already matched with
      const existingMatches = await storage.getUserMatches(userId);
      const existingMatchUserIds = existingMatches.flatMap(match => 
        [match.userId1, match.userId2]
      ).filter(id => id !== userId);
      
      const potentialMatches = allUsers.filter(u => 
        u.id !== userId && !existingMatchUserIds.includes(u.id)
      );
      
      if (potentialMatches.length === 0) {
        return res.status(200).json({ recommendations: [] });
      }
      
      // Get AI recommendations
      const recommendations = await aiService.findMatches(
        user,
        potentialMatches,
        interests
      );
      
      res.status(200).json({ recommendations });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });
  
  // Request a match with another user
  app.post("/api/matches", ensureAuthenticated, async (req: any, res) => {
    try {
      const { otherUserId, matchScore, matchDetails } = z.object({
        otherUserId: z.number(),
        matchScore: z.number(),
        matchDetails: z.any().optional()
      }).parse(req.body);
      
      const userId = req.user.id;
      
      // Check if users already have a match
      const existingMatch = await storage.findExistingMatch(userId, otherUserId);
      if (existingMatch) {
        return res.status(400).json({ message: "Match already exists" });
      }
      
      // Create match
      const newMatch = await storage.createMatch({
        userId1: userId,
        userId2: otherUserId,
        matchScore,
        matchDetails,
        status: "pending"
      });
      
      res.status(201).json({ match: newMatch });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });
  
  // Accept/Reject a match request
  app.put("/api/matches/:id/status", ensureAuthenticated, async (req: any, res) => {
    try {
      const matchId = parseInt(req.params.id);
      const { status } = z.object({
        status: z.enum(["active", "rejected"])
      }).parse(req.body);
      
      const match = await storage.getMatch(matchId);
      
      if (!match) {
        return res.status(404).json({ message: "Match not found" });
      }
      
      // Check if user is the recipient of the match request
      if (match.userId2 !== req.user.id) {
        return res.status(403).json({ message: "You don't have permission to update this match" });
      }
      
      // Update match status
      const updatedMatch = await storage.updateMatchStatus(matchId, status);
      
      // If match is accepted, award achievement to both users
      if (status === "active") {
        // Add new connection achievement for both users
        await storage.createAchievement({
          userId: match.userId1,
          type: "connection",
          title: "New Connection",
          description: "Connected with a new support partner",
          points: 50
        });
        
        await storage.createAchievement({
          userId: match.userId2,
          type: "connection",
          title: "New Connection",
          description: "Connected with a new support partner",
          points: 50
        });
        
        // Add points to both users
        await storage.addUserPoints(match.userId1, 50);
        await storage.addUserPoints(match.userId2, 50);
      }
      
      res.status(200).json({ match: updatedMatch });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });
  
  // ================== CHALLENGE ROUTES ==================
  
  // Get all challenges for a user
  app.get("/api/challenges", ensureAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Get matches for the user
      const matches = await storage.getUserMatches(userId);
      const matchIds = matches.map(match => match.id);
      
      // Get challenges for these matches
      const challenges = await storage.getUserChallenges(matchIds);
      
      // Enhance with match and user details
      const enhancedChallenges = await Promise.all(
        challenges.map(async (challenge) => {
          const match = matches.find(m => m.id === challenge.matchId);
          if (!match) return null;
          
          const otherUserId = match.userId1 === userId ? match.userId2 : match.userId1;
          const otherUser = await storage.getUser(otherUserId);
          
          // Get progress for both users
          const userProgress = await storage.getChallengeProgress(challenge.id, userId);
          const partnerProgress = await storage.getChallengeProgress(challenge.id, otherUserId);
          
          if (!otherUser) return null;
          
          return {
            ...challenge,
            match: {
              id: match.id,
              matchScore: match.matchScore
            },
            partner: {
              id: otherUser.id,
              displayName: otherUser.displayName,
              profilePic: otherUser.profilePic
            },
            progress: {
              user: userProgress || { stepsCompleted: 0 },
              partner: partnerProgress || { stepsCompleted: 0 }
            }
          };
        })
      );
      
      res.status(200).json({ challenges: enhancedChallenges.filter(Boolean) });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });
  
  // Create a new challenge
  app.post("/api/challenges", ensureAuthenticated, async (req: any, res) => {
    try {
      const challengeData = insertChallengeSchema.parse(req.body);
      
      // Check if user is part of the match
      const match = await storage.getMatch(challengeData.matchId);
      if (!match) {
        return res.status(404).json({ message: "Match not found" });
      }
      
      if (match.userId1 !== req.user.id && match.userId2 !== req.user.id) {
        return res.status(403).json({ message: "You don't have access to this match" });
      }
      
      // Create challenge
      const newChallenge = await storage.createChallenge(challengeData);
      
      // Initialize progress tracking for both users
      await storage.createChallengeProgress({
        challengeId: newChallenge.id,
        userId: match.userId1,
        stepsCompleted: 0
      });
      
      await storage.createChallengeProgress({
        challengeId: newChallenge.id,
        userId: match.userId2,
        stepsCompleted: 0
      });
      
      res.status(201).json({ challenge: newChallenge });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });
  
  // Update challenge progress
  app.put("/api/challenges/:id/progress", ensureAuthenticated, async (req: any, res) => {
    try {
      const challengeId = parseInt(req.params.id);
      const { stepsCompleted } = z.object({
        stepsCompleted: z.number().min(0)
      }).parse(req.body);
      
      const userId = req.user.id;
      
      // Check if challenge exists
      const challenge = await storage.getChallenge(challengeId);
      if (!challenge) {
        return res.status(404).json({ message: "Challenge not found" });
      }
      
      // Check if user is part of the match
      const match = await storage.getMatch(challenge.matchId);
      if (!match) {
        return res.status(404).json({ message: "Match not found" });
      }
      
      if (match.userId1 !== userId && match.userId2 !== userId) {
        return res.status(403).json({ message: "You don't have access to this challenge" });
      }
      
      // Update progress
      const updatedProgress = await storage.updateChallengeProgress(
        challengeId,
        userId,
        stepsCompleted
      );
      
      // Check if challenge is completed
      const otherUserId = match.userId1 === userId ? match.userId2 : match.userId1;
      const partnerProgress = await storage.getChallengeProgress(challengeId, otherUserId);
      
      if (updatedProgress.stepsCompleted >= challenge.totalSteps && 
          partnerProgress && partnerProgress.stepsCompleted >= challenge.totalSteps) {
        // Mark challenge as completed
        const completedChallenge = await storage.updateChallengeStatus(challengeId, "completed");
        
        // Award achievements and points to both users
        await storage.createAchievement({
          userId,
          type: "challenge",
          title: "Challenge Completed",
          description: `Completed "${challenge.title}" challenge`,
          points: 100
        });
        
        await storage.createAchievement({
          userId: otherUserId,
          type: "challenge",
          title: "Challenge Completed",
          description: `Completed "${challenge.title}" challenge`,
          points: 100
        });
        
        // Add points to both users
        await storage.addUserPoints(userId, 100);
        await storage.addUserPoints(otherUserId, 100);
        
        return res.status(200).json({ 
          progress: updatedProgress,
          challenge: completedChallenge,
          achievement: {
            type: "challenge",
            title: "Challenge Completed",
            points: 100
          }
        });
      }
      
      res.status(200).json({ progress: updatedProgress });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });
  
  // ================== MESSAGE ROUTES ==================
  
  // Get messages for a match
  app.get("/api/matches/:id/messages", ensureAuthenticated, async (req: any, res) => {
    try {
      const matchId = parseInt(req.params.id);
      
      // Check if match exists and user is part of it
      const match = await storage.getMatch(matchId);
      if (!match) {
        return res.status(404).json({ message: "Match not found" });
      }
      
      if (match.userId1 !== req.user.id && match.userId2 !== req.user.id) {
        return res.status(403).json({ message: "You don't have access to this match" });
      }
      
      // Get messages
      const messages = await storage.getMatchMessages(matchId);
      
      // Mark messages as read
      await storage.markMessagesAsRead(matchId, req.user.id);
      
      res.status(200).json({ messages });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });
  
  // Send a message
  app.post("/api/messages", ensureAuthenticated, async (req: any, res) => {
    try {
      const messageData = insertMessageSchema.parse({
        ...req.body,
        senderId: req.user.id
      });
      
      // Check if match exists and user is part of it
      const match = await storage.getMatch(messageData.matchId);
      if (!match) {
        return res.status(404).json({ message: "Match not found" });
      }
      
      if (match.userId1 !== req.user.id && match.userId2 !== req.user.id) {
        return res.status(403).json({ message: "You don't have access to this match" });
      }
      
      // Create message
      const newMessage = await storage.createMessage(messageData);
      
      res.status(201).json({ message: newMessage });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });
  
  // ================== ACHIEVEMENT ROUTES ==================
  
  // Get user achievements
  app.get("/api/achievements", ensureAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      const achievements = await storage.getUserAchievements(userId);
      
      res.status(200).json({ achievements });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });
  
  // ================== INTEREST ROUTES ==================
  
  // Get all interests
  app.get("/api/interests", async (req, res) => {
    try {
      const interests = await storage.getAllInterests();
      
      res.status(200).json({ interests });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);
  
  // Add error handler
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ message: "Internal server error" });
  });
  
  return httpServer;
}
