import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { aiService } from "./ai";
import { researchService } from "./research-service";
import { z } from "zod";
import bcrypt from "bcryptjs";
import {
  insertUserSchema,
  insertMatchSchema,
  insertChallengeSchema,
  insertChallengeProgressSchema,
  insertMessageSchema,
  // Achievement import removed
  insertInterestSchema,

  insertGroupChallengeSchema,
  insertGroupChallengeParticipantSchema,
  User,
  Match,
  InsertChallengeProgress,

  GroupChallenge,
  GroupChallengeParticipant
} from "@shared/schema";
import { MatchRecommendation } from "./ai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { setupAuth } from "./auth";
import { WebSocketServer, WebSocket } from 'ws';
import { suggestionService, SuggestionContext, Suggestion } from './suggestion-service';

// Add more detailed error logging
const logError = (msg: string, error: any, req?: any) => {
  console.error(`========== ERROR ==========`);
  console.error(msg);
  
  if (req) {
    console.error(`Session user:`, req.user);
    console.error(`Request query:`, req.query);
    console.error(`Request params:`, req.params);
  }
  
  if (error instanceof Error) {
    console.error(`Error message: ${error.message}`);
    console.error(`Error stack: ${error.stack}`);
  } else {
    console.error(`Unknown error:`, error);
  }
  console.error(`===========================`);
};

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
    // Log API key state (only showing first few chars for security)
    const apiKey = process.env.GEMINI_API_KEY || "";
    if (!apiKey) {
      console.error("GEMINI_API_KEY is not set in environment variables");
    } else {
      console.log(`GEMINI_API_KEY is set and valid`);
    }
    
    const genAI = new GoogleGenerativeAI(apiKey);
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
  
  // Find potential matches with AI recommendation - IMPORTANT: this must be placed BEFORE the :id route to avoid conflict
  app.get("/api/matches/find", ensureAuthenticated, async (req: any, res) => {
    console.log("Entered /api/matches/find handler");
    try {
      // Validate user ID from session - ensure it's a valid number
      const userId = parseInt(req.user.id);
      
      if (isNaN(userId)) {
        console.error(`Invalid userId in session: ${req.user.id}`);
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      console.log(`User ID validated: ${userId}`);
      
      // Get interests from query, defaulting to empty array if none provided
      let interests: string[] = [];
      if (req.query.interests) {
        try {
          interests = decodeURIComponent(req.query.interests as string).split(',');
        } catch (e) {
          console.error("Error parsing interests:", e);
          // Continue with empty interests rather than failing
        }
      }
      
      console.log(`Interests: ${JSON.stringify(interests)}`);
      
      // Get current user with direct database query for reliability
      try {
        const user = await storage.getUser(userId);
        
        if (!user) {
          console.log(`User not found for ID: ${userId}`);
          return res.status(404).json({ message: "User not found" });
        }
        
        console.log(`User found: ${user.username} (ID: ${user.id})`);
        
        // Get users with matching interests - direct approach
        console.log("Finding potential matches...");
        let potentialMatches: User[] = [];
        
        try {
          // Get all users
          const allUsers = await storage.getAllUsers();
          console.log(`Total users: ${allUsers.length}`);
          
          // Get existing matches
          const existingMatches = await storage.getUserMatches(userId);
          console.log(`Existing matches: ${existingMatches.length}`);
          
          // Extract IDs of users already matched with
          const matchedUserIds = new Set<number>();
          
          for (const match of existingMatches) {
            if (match.userId1 === userId && typeof match.userId2 === 'number') {
              matchedUserIds.add(match.userId2);
            } else if (match.userId2 === userId && typeof match.userId1 === 'number') {
              matchedUserIds.add(match.userId1);
            }
          }
          
          console.log(`Already matched with ${matchedUserIds.size} users`);
          
          // Filter the users: exclude self and already matched users
          potentialMatches = allUsers.filter(u => {
            return u.id !== userId && !matchedUserIds.has(u.id);
          });
          
          console.log(`Found ${potentialMatches.length} potential matches`);
          
          if (potentialMatches.length === 0) {
            return res.status(200).json({ recommendations: [] });
          }
          
          // Manually filter by interests if specified
          if (interests.length > 0) {
            console.log("Interests from frontend:", interests);
            potentialMatches.forEach(u => {
              console.log(`User ${u.id} interests:`, u.interests);
            });
            potentialMatches = potentialMatches.filter(u => {
              const userInterests = u.interests || [];
              const matchFound = interests.some(interest =>
                userInterests.some(ui => ui.trim().toLowerCase() === interest.trim().toLowerCase())
              );
              if (matchFound) {
                console.log(`User ${u.id} matched on interests:`, userInterests);
              }
              return matchFound;
            });
            
            console.log(`After interest filtering: ${potentialMatches.length} matches`);
          }
          
          if (potentialMatches.length === 0) {
            return res.status(200).json({ recommendations: [] });
          }
          
          // Instead of using the AI service directly which might cause errors,
          // let's handle any potential errors from it
          let recommendations: MatchRecommendation[] = [];
          
          try {
            recommendations = await aiService.findMatches(user, potentialMatches, interests);
            console.log(`AI returned ${recommendations.length} recommendations`);
          } catch (aiError) {
            console.error("AI matching error:", aiError);
            
            // Fall back to simple matching if AI fails
            recommendations = potentialMatches.map(match => {
              const sharedInterests = (user.interests || []).filter(i => 
                (match.interests || []).includes(i)
              );
              
              return {
                userId: match.id,
                displayName: match.displayName || 'User',
                profilePic: match.profilePic || '',
                matchScore: 70, // Default score when AI fails
                sharedInterests,
                memberSince: match.createdAt ? match.createdAt.toISOString().split('T')[0] : 'recent'
              };
            });
          }
          
          return res.status(200).json({ recommendations });
          
        } catch (matchError) {
          console.error("Error while finding matches:", matchError);
          return res.status(500).json({ message: "Error finding matches" });
        }
        
      } catch (userError) {
        console.error("Error fetching user:", userError);
        return res.status(500).json({ message: "Error fetching user" });
      }
      
    } catch (error: any) {
      console.error("Unexpected error in /api/matches/find:", error);
      res.status(500).json({ message: "An unexpected error occurred" });
    }
  });
  
  // Helper function to check if a user has an active match
  async function hasActiveMatch(userId: number): Promise<{ hasMatch: boolean, match?: Match }> {
    try {
      // Get all matches for the user
      const userMatches = await storage.getUserMatches(userId);
      
      // Find any active match
      const activeMatch = userMatches.find(match => match.status === "active");
      
      return {
        hasMatch: !!activeMatch,
        match: activeMatch
      };
    } catch (error) {
      console.error(`Error checking active matches for user ${userId}:`, error);
      return { hasMatch: false };
    }
  }
  
  // Request a match with another user
  app.post("/api/matches", ensureAuthenticated, async (req: any, res) => {
    try {
      const { otherUserId, matchScore, matchDetails } = z.object({
        otherUserId: z.number(),
        matchScore: z.number(),
        matchDetails: z.any().optional()
      }).parse(req.body);
      
      const userId = req.user.id;
      
      // Check if requesting user already has an active match
      const requesterActiveMatch = await hasActiveMatch(userId);
      if (requesterActiveMatch.hasMatch) {
        return res.status(400).json({ 
          message: "You already have an active match. Please unmatch first to request a new match.",
          activeMatch: requesterActiveMatch.match
        });
      }
      
      // Check if target user already has an active match
      const targetActiveMatch = await hasActiveMatch(otherUserId);
      if (targetActiveMatch.hasMatch) {
        return res.status(400).json({ 
          message: "This user already has an active match and is unavailable."
        });
      }
      
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
      
      // Send WebSocket notification to the match recipient
      try {
        // Get requester info
        const requester = await storage.getUser(userId);
        
        // Send notification
        sendNotification(otherUserId, {
          type: 'new_match_request',
          matchId: newMatch.id,
          userId: requester?.id,
          displayName: requester?.displayName || 'Someone',
          profilePic: requester?.profilePic,
          timestamp: new Date().toISOString()
        });
        
        console.log(`Sent match request notification to user ${otherUserId}`);
      } catch (notificationError) {
        // Just log the error, don't fail the request
        console.error('Failed to send notification:', notificationError);
      }
      
      res.status(201).json({ match: newMatch });
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
      logError("Error getting match details", error, req);
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
      
      // If activating a match, check if either user already has an active match
      if (status === "active") {
        // Check if requester already has an active match
        const requesterActiveMatch = await hasActiveMatch(match.userId1);
        if (requesterActiveMatch.hasMatch && requesterActiveMatch.match?.id !== matchId) {
          return res.status(400).json({ 
            message: "The requesting user already has an active match.",
            activeMatch: requesterActiveMatch.match
          });
        }
        
        // Check if recipient already has an active match
        const recipientActiveMatch = await hasActiveMatch(match.userId2);
        if (recipientActiveMatch.hasMatch && recipientActiveMatch.match?.id !== matchId) {
          return res.status(400).json({ 
            message: "You already have an active match. Please unmatch first before accepting a new one.",
            activeMatch: recipientActiveMatch.match
          });
        }
      }
      
      // Update match status
      const updatedMatch = await storage.updateMatchStatus(matchId, status);
      
      // If match is accepted, award points to both users
      if (status === "active") {
        // Add points to both users for creating a new connection
        await storage.addUserPoints(match.userId1, 50);
        await storage.addUserPoints(match.userId2, 50);
      }
      
      res.status(200).json({ match: updatedMatch });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });
  
  // Unmatch - end an active match
  app.put("/api/matches/:id/unmatch", ensureAuthenticated, async (req: any, res) => {
    try {
      const matchId = parseInt(req.params.id);
      const userId = req.user.id;
      
      const match = await storage.getMatch(matchId);
      
      if (!match) {
        return res.status(404).json({ message: "Match not found" });
      }
      
      // Check if user is part of the match
      if (match.userId1 !== userId && match.userId2 !== userId) {
        return res.status(403).json({ message: "You don't have access to this match" });
      }
      
      // Check if match is active
      if (match.status !== "active") {
        return res.status(400).json({ message: "Only active matches can be unmatched" });
      }
      
      // Set match status to "ended"
      const updatedMatch = await storage.updateMatchStatus(matchId, "ended");
      
      // Notify the other user
      const otherUserId = match.userId1 === userId ? match.userId2 : match.userId1;
      const user = await storage.getUser(userId);
      
      // Send notification
      sendNotification(otherUserId, {
        type: 'match_ended',
        matchId: match.id,
        userId: user?.id,
        displayName: user?.displayName || 'Your partner',
        message: "Your partner has ended the match.",
        timestamp: new Date().toISOString()
      });
      
      res.status(200).json({ 
        success: true, 
        message: "Match has been ended successfully",
        match: updatedMatch
      });
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
  
  // Generate AI challenge suggestions
  app.post("/api/challenges/generate", ensureAuthenticated, async (req: any, res) => {
    try {
      const { prompt, matchId } = z.object({
        prompt: z.string(),
        matchId: z.number()
      }).parse(req.body);
      
      // Check if user is part of the match
      const match = await storage.getMatch(matchId);
      if (!match) {
        return res.status(404).json({ message: "Match not found" });
      }
      
      if (match.userId1 !== req.user.id && match.userId2 !== req.user.id) {
        return res.status(403).json({ message: "You don't have access to this match" });
      }
      
      // Import dynamically to avoid issues during startup
      const { generateChallengeIdeas } = await import('./challenge-generator');
      
      // Generate challenge suggestions
      const challenges = await generateChallengeIdeas(prompt, matchId);
      
      res.status(200).json({ challenges });
    } catch (error: any) {
      console.error('Challenge generation error:', error);
      res.status(500).json({ 
        message: error.message || "Failed to generate challenge suggestions" 
      });
    }
  });

  // Create a new challenge
  app.post("/api/challenges", ensureAuthenticated, async (req: any, res) => {
    try {
      // Parse and format the dates properly
      const body = req.body;
      
      // Ensure dates are properly formatted
      if (body.startDate && typeof body.startDate === 'string') {
        body.startDate = new Date(body.startDate);
      }
      
      if (body.endDate && typeof body.endDate === 'string') {
        body.endDate = new Date(body.endDate);
      }
      
      const challengeData = insertChallengeSchema.parse(body);
      
      // Check if user is part of the match
      const match = await storage.getMatch(challengeData.matchId);
      if (!match) {
        return res.status(404).json({ message: "Match not found" });
      }
      
      if (match.userId1 !== req.user.id && match.userId2 !== req.user.id) {
        return res.status(403).json({ message: "You don't have access to this match" });
      }
      
      // Create challenge with type-specific configurations
      const challengeType = challengeData.challengeType || 'generic';
      
      // Set up different defaults based on challenge type
      let enrichedChallengeData = { ...challengeData };
      
      if (challengeType === 'days_sober') {
        // For sobriety challenges, set appropriate title and description if not provided
        if (!enrichedChallengeData.title) {
          enrichedChallengeData.title = "Sobriety Challenge";
        }
        if (!enrichedChallengeData.description) {
          enrichedChallengeData.description = "Track days of sobriety and support each other in this journey.";
        }
        // Default to 4 steps (7 days, 30 days, 90 days, 365 days milestones)
        if (!enrichedChallengeData.totalSteps) {
          enrichedChallengeData.totalSteps = 4;
        }
      } 
      else if (challengeType === 'check_in_streak') {
        // For check-in streak challenges, set appropriate defaults
        if (!enrichedChallengeData.title) {
          enrichedChallengeData.title = "Check-in Streak Challenge";
        }
        if (!enrichedChallengeData.description) {
          enrichedChallengeData.description = "Daily check-ins with your accountability partner. Build consistency together!";
        }
        // Default to 3 steps (7 days, 30 days, 100 days milestones)
        if (!enrichedChallengeData.totalSteps) {
          enrichedChallengeData.totalSteps = 3;
        }
      }
      
      // Create the challenge
      const newChallenge = await storage.createChallenge(enrichedChallengeData);
      
      // Initialize progress tracking for both users with type-specific initializations
      const progressInit1: Partial<InsertChallengeProgress> = {
        challengeId: newChallenge.id,
        userId: match.userId1,
        stepsCompleted: 0
      };
      
      const progressInit2: Partial<InsertChallengeProgress> = {
        challengeId: newChallenge.id,
        userId: match.userId2,
        stepsCompleted: 0
      };
      
      // Add specific fields based on challenge type
      if (challengeType === 'days_sober') {
        progressInit1.daysSober = 0;
        progressInit2.daysSober = 0;
      } 
      else if (challengeType === 'check_in_streak') {
        progressInit1.currentStreak = 0;
        progressInit1.longestStreak = 0;
        progressInit2.currentStreak = 0;
        progressInit2.longestStreak = 0;
      }
      
      await storage.createChallengeProgress(progressInit1 as InsertChallengeProgress);
      await storage.createChallengeProgress(progressInit2 as InsertChallengeProgress);
      
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
      
      // Safely check progress before comparing
      if (updatedProgress && typeof updatedProgress.stepsCompleted === 'number' && 
          updatedProgress.stepsCompleted >= challenge.totalSteps && 
          partnerProgress && typeof partnerProgress.stepsCompleted === 'number' && 
          partnerProgress.stepsCompleted >= challenge.totalSteps) {
        // Mark challenge as completed
        const completedChallenge = await storage.updateChallengeStatus(challengeId, "completed");
        
        // Award points to both users
        await storage.addUserPoints(userId, 100);
        await storage.addUserPoints(otherUserId, 100);
        
        return res.status(200).json({ 
          progress: updatedProgress,
          challenge: completedChallenge,
          points: 100
        });
      }
      
      res.status(200).json({ progress: updatedProgress });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });
  
  // Track days sober for a challenge
  app.put("/api/challenges/:id/sobriety", ensureAuthenticated, async (req: any, res) => {
    try {
      const challengeId = parseInt(req.params.id);
      const { daysSober } = z.object({
        daysSober: z.number().min(0)
      }).parse(req.body);
      
      const userId = req.user.id;
      
      // Check if challenge exists and is of the right type
      const challenge = await storage.getChallenge(challengeId);
      if (!challenge) {
        return res.status(404).json({ message: "Challenge not found" });
      }
      
      if (challenge.challengeType !== "days_sober") {
        return res.status(400).json({ message: "This is not a sobriety tracking challenge" });
      }
      
      // Check if user is part of the match
      const match = await storage.getMatch(challenge.matchId);
      if (!match) {
        return res.status(404).json({ message: "Match not found" });
      }
      
      if (match.userId1 !== userId && match.userId2 !== userId) {
        return res.status(403).json({ message: "You don't have access to this challenge" });
      }
      
      // Update sobriety days
      const updatedProgress = await storage.updateDaysSober(
        challengeId,
        userId,
        daysSober
      );
      
      // Award points based on progress milestones
      if (daysSober >= 7 && (!updatedProgress.stepsCompleted || updatedProgress.stepsCompleted < 1)) {
        await storage.updateChallengeProgress(challengeId, userId, 1);
        await storage.addUserPoints(userId, 50);
      } 
      else if (daysSober >= 30 && (!updatedProgress.stepsCompleted || updatedProgress.stepsCompleted < 2)) {
        await storage.updateChallengeProgress(challengeId, userId, 2);
        await storage.addUserPoints(userId, 100);
      }
      else if (daysSober >= 90 && (!updatedProgress.stepsCompleted || updatedProgress.stepsCompleted < 3)) {
        await storage.updateChallengeProgress(challengeId, userId, 3);
        await storage.addUserPoints(userId, 200);
      }
      else if (daysSober >= 365 && (!updatedProgress.stepsCompleted || updatedProgress.stepsCompleted < 4)) {
        await storage.updateChallengeProgress(challengeId, userId, 4);
        await storage.addUserPoints(userId, 500);
        
        // Mark challenge as completed if this was the goal
        if (challenge.totalSteps <= 4) {
          await storage.updateChallengeStatus(challengeId, "completed");
        }
      }
      
      res.status(200).json({ 
        progress: updatedProgress
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });
  
  // Reset sobriety counter
  app.post("/api/challenges/:id/sobriety/reset", ensureAuthenticated, async (req: any, res) => {
    try {
      const challengeId = parseInt(req.params.id);
      const userId = req.user.id;
      
      // Check if challenge exists and is of the right type
      const challenge = await storage.getChallenge(challengeId);
      if (!challenge) {
        return res.status(404).json({ message: "Challenge not found" });
      }
      
      if (challenge.challengeType !== "days_sober") {
        return res.status(400).json({ message: "This is not a sobriety tracking challenge" });
      }
      
      // Check if user is part of the match
      const match = await storage.getMatch(challenge.matchId);
      if (!match) {
        return res.status(404).json({ message: "Match not found" });
      }
      
      if (match.userId1 !== userId && match.userId2 !== userId) {
        return res.status(403).json({ message: "You don't have access to this challenge" });
      }
      
      // Reset sobriety counter
      const updatedProgress = await storage.resetDaysSober(challengeId, userId);
      
      res.status(200).json({ progress: updatedProgress });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });
  
  // Record a check-in for a streak challenge
  app.post("/api/challenges/:id/check-in", ensureAuthenticated, async (req: any, res) => {
    try {
      const challengeId = parseInt(req.params.id);
      const userId = req.user.id;
      
      // Check if challenge exists and is of the right type
      const challenge = await storage.getChallenge(challengeId);
      if (!challenge) {
        return res.status(404).json({ message: "Challenge not found" });
      }
      
      if (challenge.challengeType !== "check_in_streak") {
        return res.status(400).json({ message: "This is not a check-in streak challenge" });
      }
      
      // Check if user is part of the match
      const match = await storage.getMatch(challenge.matchId);
      if (!match) {
        return res.status(404).json({ message: "Match not found" });
      }
      
      if (match.userId1 !== userId && match.userId2 !== userId) {
        return res.status(403).json({ message: "You don't have access to this challenge" });
      }
      
      // Record check-in
      const updatedProgress = await storage.recordCheckIn(challengeId, userId);
      
      // Award points for streaks
      
      if (updatedProgress.currentStreak !== null && updatedProgress.currentStreak >= 7 && (!updatedProgress.stepsCompleted || updatedProgress.stepsCompleted < 1)) {
        await storage.updateChallengeProgress(challengeId, userId, 1);
        await storage.addUserPoints(userId, 50);
      }
      else if (updatedProgress.currentStreak !== null && updatedProgress.currentStreak >= 30 && (!updatedProgress.stepsCompleted || updatedProgress.stepsCompleted < 2)) {
        await storage.updateChallengeProgress(challengeId, userId, 2);
        await storage.addUserPoints(userId, 150);
      }
      else if (updatedProgress.currentStreak !== null && updatedProgress.currentStreak >= 100 && (!updatedProgress.stepsCompleted || updatedProgress.stepsCompleted < 3)) {
        await storage.updateChallengeProgress(challengeId, userId, 3);
        await storage.addUserPoints(userId, 300);
        
        // Mark challenge as completed if this was the goal
        if (challenge.totalSteps <= 3) {
          await storage.updateChallengeStatus(challengeId, "completed");
        }
      }
      
      // Notify match partner of check-in via WebSocket
      const otherUserId = match.userId1 === userId ? match.userId2 : match.userId1;
      const user = await storage.getUser(userId);
      
      if (user) {
        sendNotification(otherUserId, {
          type: 'partner_check_in',
          challengeId: challenge.id,
          userId: user.id,
          displayName: user.displayName,
          profilePic: user.profilePic,
          streak: updatedProgress.currentStreak,
          timestamp: new Date().toISOString()
        });
      }
      
      res.status(200).json({ 
        progress: updatedProgress
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });
  
  // Get check-in streak information
  app.get("/api/challenges/:id/streak", ensureAuthenticated, async (req: any, res) => {
    try {
      const challengeId = parseInt(req.params.id);
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
      
      const otherUserId = match.userId1 === userId ? match.userId2 : match.userId1;
      
      // Get streak information for both users
      const userStreak = await storage.getCheckInStreak(challengeId, userId);
      const partnerStreak = await storage.getCheckInStreak(challengeId, otherUserId);
      
      res.status(200).json({ 
        user: userStreak,
        partner: partnerStreak
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // ================== MESSAGE ROUTES ==================
  
  // Get messages for a match
  app.get("/api/matches/:id/messages", ensureAuthenticated, async (req: any, res) => {
    try {
      const matchId = parseInt(req.params.id);
      console.log(`Getting messages for match ID: ${matchId}, user ID: ${req.user.id}`);
      
      // Check if match exists and user is part of it
      const match = await storage.getMatch(matchId);
      if (!match) {
        console.log(`Match ${matchId} not found`);
        return res.status(404).json({ message: "Match not found" });
      }
      
      if (match.userId1 !== req.user.id && match.userId2 !== req.user.id) {
        console.log(`User ${req.user.id} does not have access to match ${matchId}`);
        return res.status(403).json({ message: "You don't have access to this match" });
      }
      
      // Get messages
      const messages = await storage.getMatchMessages(matchId);
      console.log(`Retrieved ${messages.length} messages for match ${matchId}`);
      
      // Mark messages as read
      await storage.markMessagesAsRead(matchId, req.user.id);
      console.log(`Marked messages as read for user ${req.user.id} in match ${matchId}`);
      
      // Get the other user's details
      const otherUserId = match.userId1 === req.user.id ? match.userId2 : match.userId1;
      const otherUser = await storage.getUser(otherUserId);
      console.log(`Retrieved details for other user ${otherUserId} (${otherUser?.displayName})`);
      
      // Add match and other user details to response
      const response = { 
        messages,
        match: {
          ...match,
          otherUser
        }
      };
      console.log(`Sending response with ${messages.length} messages for match ${matchId}`);
      res.status(200).json(response);
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
      
      // Send real-time notification to the recipient
      try {
        // Determine the recipient's user ID
        const recipientId = match.userId1 === req.user.id ? match.userId2 : match.userId1;
        
        // Get sender info
        const sender = await storage.getUser(req.user.id);
        
        // Send notification via WebSocket
        const notificationSent = sendNotification(recipientId, {
          type: 'new_message',
          matchId: match.id,
          message: {
            id: newMessage.id,
            senderId: newMessage.senderId,
            content: newMessage.content,
            sentAt: newMessage.sentAt ? newMessage.sentAt.toISOString() : new Date().toISOString(),
            isRead: newMessage.isRead
          },
          sender: {
            id: sender?.id,
            displayName: sender?.displayName || 'User',
            profilePic: sender?.profilePic
          }
        });
        
        if (notificationSent) {
          console.log(`Real-time notification delivered successfully to user ${recipientId}`);
        } else {
          console.log(`Real-time notification could not be delivered to user ${recipientId} (user not connected)`);
          // Store notification for later delivery when user connects
          // This is a fallback mechanism we could implement in the future
        }
      } catch (notificationError) {
        // Just log the error, don't fail the request
        console.error('Failed to send message notification:', notificationError);
      }
      
      res.status(201).json({ message: newMessage });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });
  
  // ================== ACHIEVEMENT ROUTES ==================
  
  // Achievements feature removed
  
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
  
  // ================== MEETING ROUTES ==================

  // Get all meetings
  app.get("/api/meetings", ensureAuthenticated, async (req: any, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit) : undefined;
      const offset = req.query.offset ? parseInt(req.query.offset) : undefined;
      
      const meetings = await storage.getAllMeetings(limit, offset);
      res.status(200).json({ meetings });
    } catch (error: any) {
      logError("Error getting meetings", error, req);
      res.status(500).json({ message: "Error fetching meetings" });
    }
  });

  // Get meetings by location
  app.get("/api/meetings/nearby", ensureAuthenticated, async (req: any, res) => {
    try {
      const { latitude, longitude, radius } = z.object({
        latitude: z.coerce.number(),
        longitude: z.coerce.number(),
        radius: z.coerce.number().default(10) // Default 10km radius
      }).parse(req.query);
      
      const meetings = await storage.getMeetingsByLocation(latitude, longitude, radius);
      res.status(200).json({ meetings });
    } catch (error: any) {
      logError("Error getting nearby meetings", error, req);
      res.status(400).json({ message: error.message });
    }
  });

  // Get a single meeting
  app.get("/api/meetings/:id", ensureAuthenticated, async (req: any, res) => {
    try {
      const meetingId = parseInt(req.params.id);
      const meeting = await storage.getMeeting(meetingId);
      
      if (!meeting) {
        return res.status(404).json({ message: "Meeting not found" });
      }
      
      // Get the attendees for this meeting
      const attendees = await storage.getMeetingAttendees(meetingId);
      
      // Get user's attendance status if they're attending
      const userAttendance = attendees.find(a => a.userId === req.user.id);
      
      res.status(200).json({ 
        meeting,
        isAttending: !!userAttendance,
        attendanceStatus: userAttendance?.status || null,
        checkedIn: userAttendance?.checkedIn || false,
        attendeeCount: attendees.length
      });
    } catch (error: any) {
      logError("Error getting meeting details", error, req);
      res.status(500).json({ message: "Error fetching meeting details" });
    }
  });

  // Create a new meeting
  app.post("/api/meetings", ensureAuthenticated, async (req: any, res) => {
    try {
      const meetingData = insertMeetingSchema.parse({
        ...req.body,
        createdBy: req.user.id
      });
      
      const meeting = await storage.createMeeting(meetingData);
      res.status(201).json({ meeting });
    } catch (error: any) {
      logError("Error creating meeting", error, req);
      res.status(400).json({ message: error.message });
    }
  });

  // Update a meeting
  app.put("/api/meetings/:id", ensureAuthenticated, async (req: any, res) => {
    try {
      const meetingId = parseInt(req.params.id);
      const meeting = await storage.getMeeting(meetingId);
      
      if (!meeting) {
        return res.status(404).json({ message: "Meeting not found" });
      }
      
      // Check if user created the meeting
      if (meeting.createdBy !== req.user.id) {
        return res.status(403).json({ message: "You don't have permission to update this meeting" });
      }
      
      const updateData = z.object({
        name: z.string().optional(),
        description: z.string().optional(),
        meetingType: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
        country: z.string().optional(),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
        dayOfWeek: z.number().optional(),
        startTime: z.string().optional(),
        endTime: z.string().optional(),
        isRecurring: z.boolean().optional(),
        frequency: z.string().optional(),
        contactPhone: z.string().optional(),
        contactEmail: z.string().optional(),
        website: z.string().optional(),
      }).parse(req.body);
      
      const updatedMeeting = await storage.updateMeeting(meetingId, updateData);
      res.status(200).json({ meeting: updatedMeeting });
    } catch (error: any) {
      logError("Error updating meeting", error, req);
      res.status(400).json({ message: error.message });
    }
  });

  // Delete a meeting
  app.delete("/api/meetings/:id", ensureAuthenticated, async (req: any, res) => {
    try {
      const meetingId = parseInt(req.params.id);
      const meeting = await storage.getMeeting(meetingId);
      
      if (!meeting) {
        return res.status(404).json({ message: "Meeting not found" });
      }
      
      // Check if user created the meeting
      if (meeting.createdBy !== req.user.id) {
        return res.status(403).json({ message: "You don't have permission to delete this meeting" });
      }
      
      const success = await storage.deleteMeeting(meetingId);
      
      if (success) {
        res.status(200).json({ message: "Meeting deleted successfully" });
      } else {
        res.status(500).json({ message: "Failed to delete meeting" });
      }
    } catch (error: any) {
      logError("Error deleting meeting", error, req);
      res.status(500).json({ message: "Error deleting meeting" });
    }
  });

  // ================== MEETING ATTENDANCE ROUTES ==================

  // Get user's meeting attendance
  app.get("/api/my-meetings", ensureAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const attendances = await storage.getUserMeetingAttendance(userId);
      
      // Get the full meeting details for each attendance
      const meetingsWithDetails = await Promise.all(
        attendances.map(async (attendance) => {
          const meeting = await storage.getMeeting(attendance.meetingId);
          return {
            ...attendance,
            meeting
          };
        })
      );
      
      res.status(200).json({ meetings: meetingsWithDetails });
    } catch (error: any) {
      logError("Error getting user meetings", error, req);
      res.status(500).json({ message: "Error fetching your meetings" });
    }
  });

  // Attend or update attendance status for a meeting
  app.post("/api/meetings/:id/attend", ensureAuthenticated, async (req: any, res) => {
    try {
      const meetingId = parseInt(req.params.id);
      const { status, reminderSet, notes } = z.object({
        status: z.enum(["going", "interested", "not_going"]).default("going"),
        reminderSet: z.boolean().optional(),
        notes: z.string().optional()
      }).parse(req.body);
      
      // Check if meeting exists
      const meeting = await storage.getMeeting(meetingId);
      if (!meeting) {
        return res.status(404).json({ message: "Meeting not found" });
      }
      
      const attendance = await storage.attendMeeting({
        meetingId,
        userId: req.user.id,
        status,
        reminderSet,
        notes
      });
      
      res.status(200).json({ attendance });
    } catch (error: any) {
      logError("Error attending meeting", error, req);
      res.status(400).json({ message: error.message });
    }
  });

  // Check in to a meeting
  app.post("/api/meetings/:id/check-in", ensureAuthenticated, async (req: any, res) => {
    try {
      const meetingId = parseInt(req.params.id);
      
      // Check if meeting exists
      const meeting = await storage.getMeeting(meetingId);
      if (!meeting) {
        return res.status(404).json({ message: "Meeting not found" });
      }
      
      const attendance = await storage.checkInToMeeting(meetingId, req.user.id);
      
      // Award points for checking in
      await storage.addUserPoints(req.user.id, 5);
      
      res.status(200).json({ 
        attendance,
        message: "Successfully checked in! You earned 5 points."
      });
    } catch (error: any) {
      logError("Error checking in to meeting", error, req);
      res.status(500).json({ message: "Error checking in to meeting" });
    }
  });

  // ================== GROUP CHALLENGE ROUTES ==================
  
  // Get all active group challenges
  app.get("/api/group-challenges", ensureAuthenticated, async (req: any, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit) : undefined;
      const offset = req.query.offset ? parseInt(req.query.offset) : undefined;
      
      const challenges = await storage.getActiveGroupChallenges(limit, offset);
      res.status(200).json({ challenges });
    } catch (error: any) {
      logError("Error getting group challenges", error, req);
      res.status(500).json({ message: "Error fetching group challenges" });
    }
  });

  // Get user's group challenges
  app.get("/api/my-group-challenges", ensureAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const challenges = await storage.getUserGroupChallenges(userId);
      res.status(200).json({ challenges });
    } catch (error: any) {
      logError("Error getting user group challenges", error, req);
      res.status(500).json({ message: "Error fetching your group challenges" });
    }
  });

  // Get a single group challenge with participants and leaderboard
  app.get("/api/group-challenges/:id", ensureAuthenticated, async (req: any, res) => {
    try {
      const challengeId = parseInt(req.params.id);
      const challenge = await storage.getGroupChallenge(challengeId);
      
      if (!challenge) {
        return res.status(404).json({ message: "Group challenge not found" });
      }
      
      // Get participants and leaderboard
      const participants = await storage.getGroupChallengeParticipants(challengeId);
      const leaderboard = await storage.getGroupChallengeLeaderboard(challengeId, 10);
      
      // Check if user is participating
      const userParticipation = participants.find(p => p.userId === req.user.id);
      
      res.status(200).json({ 
        challenge,
        isParticipating: !!userParticipation,
        userProgress: userParticipation,
        participantCount: participants.length,
        leaderboard
      });
    } catch (error: any) {
      logError("Error getting group challenge details", error, req);
      res.status(500).json({ message: "Error fetching group challenge details" });
    }
  });

  // Create a new group challenge
  app.post("/api/group-challenges", ensureAuthenticated, async (req: any, res) => {
    try {
      // Make sure dates are properly parsed
      const parsedBody = {
        ...req.body,
        startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
        endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
        createdBy: req.user.id
      };
      
      const challengeData = insertGroupChallengeSchema.parse(parsedBody);
      
      const challenge = await storage.createGroupChallenge(challengeData);
      
      // Automatically join the creator to the challenge
      await storage.joinGroupChallenge({
        groupChallengeId: challenge.id,
        userId: req.user.id,
        status: "active"
      });
      
      res.status(201).json({ challenge });
    } catch (error: any) {
      logError("Error creating group challenge", error, req);
      res.status(400).json({ message: error.message });
    }
  });

  // Join a group challenge
  app.post("/api/group-challenges/:id/join", ensureAuthenticated, async (req: any, res) => {
    try {
      const challengeId = parseInt(req.params.id);
      
      // Check if challenge exists and is active
      const challenge = await storage.getGroupChallenge(challengeId);
      if (!challenge) {
        return res.status(404).json({ message: "Group challenge not found" });
      }
      
      if (challenge.status !== "active") {
        return res.status(400).json({ message: "This challenge is no longer active" });
      }
      
      // Check if max participants reached
      if (challenge.maxParticipants) {
        const participants = await storage.getGroupChallengeParticipants(challengeId);
        if (participants.length >= challenge.maxParticipants) {
          return res.status(400).json({ message: "This challenge has reached its maximum number of participants" });
        }
      }
      
      const participation = await storage.joinGroupChallenge({
        groupChallengeId: challengeId,
        userId: req.user.id,
        status: "active"
      });
      
      res.status(200).json({ 
        participation,
        message: "Successfully joined the group challenge!"
      });
    } catch (error: any) {
      logError("Error joining group challenge", error, req);
      res.status(500).json({ message: "Error joining group challenge" });
    }
  });

  // Update progress in a group challenge
  app.post("/api/group-challenges/:id/progress", ensureAuthenticated, async (req: any, res) => {
    try {
      const challengeId = parseInt(req.params.id);
      const { stepsCompleted } = z.object({
        stepsCompleted: z.number().min(0)
      }).parse(req.body);
      
      // Check if challenge exists and is active
      const challenge = await storage.getGroupChallenge(challengeId);
      if (!challenge) {
        return res.status(404).json({ message: "Group challenge not found" });
      }
      
      if (challenge.status !== "active") {
        return res.status(400).json({ message: "This challenge is no longer active" });
      }
      
      // Update progress
      const updatedProgress = await storage.updateGroupChallengeProgress(
        challengeId,
        req.user.id,
        stepsCompleted
      );
      
      // Check if challenge is completed by this user
      let message = "Progress updated successfully!";
      if (stepsCompleted >= challenge.totalSteps) {
        message = "Congratulations! You've completed this challenge!";
        
        // Award points for completion
        await storage.addUserPoints(req.user.id, 50);
        message += " You earned 50 points!";
      }
      
      res.status(200).json({ 
        progress: updatedProgress,
        message
      });
    } catch (error: any) {
      logError("Error updating group challenge progress", error, req);
      res.status(400).json({ message: error.message });
    }
  });

  // ================== RESEARCH ROUTES ==================
  
  // Get research information on specific topics (no authentication required)
  app.get("/api/research", async (req: Request, res: Response) => {
    try {
      const { topic, query } = z.object({
        topic: z.string(),
        query: z.string().optional()
      }).parse(req.query as any);
      
      const researchItems = await researchService.getResearch({
        topic,
        query,
        maxResults: 5
      });
      
      res.status(200).json({ researchItems });
    } catch (error: any) {
      console.error("Error fetching research:", error);
      res.status(400).json({ 
        message: error.message || "Failed to fetch research information",
        researchItems: [] 
      });
    }
  });
  
  // ================== SUGGESTION ROUTES ==================
  
  // Get contextual suggestions based on the current state
  app.post("/api/suggestions", ensureAuthenticated, async (req: any, res) => {
    try {
      const { 
        contextType, 
        matchId, 
        challengeId,
        additionalContext 
      } = z.object({
        contextType: z.enum(['chat', 'challenge', 'match', 'dashboard']),
        matchId: z.number().optional(),
        challengeId: z.number().optional(),
        additionalContext: z.record(z.any()).optional()
      }).parse(req.body);
      
      // Start building the context object
      const suggestionContext: SuggestionContext = {
        contextType,
        user: req.user,
        additionalContext
      };
      
      // Add match-specific context if provided
      if (matchId) {
        const match = await storage.getMatch(matchId);
        if (!match) {
          return res.status(404).json({ message: "Match not found" });
        }
        
        // Check if user is part of this match
        if (match.userId1 !== req.user.id && match.userId2 !== req.user.id) {
          return res.status(403).json({ message: "You don't have access to this match" });
        }
        
        // Add match to context
        suggestionContext.match = match;
        
        // Get other user details
        const otherUserId = match.userId1 === req.user.id ? match.userId2 : match.userId1;
        const otherUser = await storage.getUser(otherUserId);
        if (otherUser) {
          suggestionContext.otherUser = otherUser;
        }
        
        // If it's a chat context, get recent messages
        if (contextType === 'chat') {
          const messages = await storage.getRecentMatchMessages(matchId, 5);
          suggestionContext.recentMessages = messages;
        }
      }
      
      // Add challenge-specific context if provided
      if (challengeId) {
        const challenge = await storage.getChallenge(challengeId);
        if (!challenge) {
          return res.status(404).json({ message: "Challenge not found" });
        }
        
        // Add challenge to context
        suggestionContext.challenge = challenge;
        
        // Get progress for both users
        const userProgress = await storage.getChallengeProgress(challengeId, req.user.id);
        if (userProgress) {
          suggestionContext.userProgress = userProgress;
        }
        
        // If we have a match, get partner progress
        if (suggestionContext.match) {
          const otherUserId = suggestionContext.match.userId1 === req.user.id 
            ? suggestionContext.match.userId2 
            : suggestionContext.match.userId1;
            
          const partnerProgress = await storage.getChallengeProgress(challengeId, otherUserId);
          if (partnerProgress) {
            suggestionContext.partnerProgress = partnerProgress;
          }
        }
      }
      
      // Generate suggestions using the suggestion service
      const suggestions = await suggestionService.generateSuggestions(suggestionContext);
      
      res.status(200).json({ suggestions });
    } catch (error: any) {
      console.error("Error generating suggestions:", error);
      res.status(400).json({ message: error.message || "Failed to generate suggestions" });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);
  
  // Create WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Store connected clients by userId
  const connectedClients = new Map<number, WebSocket>();
  
  // Store pending messages for offline users
  const pendingMessages = new Map<number, any[]>();
  
  // Handle WebSocket connections
  wss.on('connection', (ws) => {
    let userId: number | null = null;
    
    console.log('WebSocket client connected');
    
    // Handle messages from clients
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        // Handle authentication
        if (data.type === 'auth') {
          userId = Number(data.userId);
          if (!isNaN(userId)) {
            connectedClients.set(userId, ws);
            console.log(`WebSocket: User ${userId} authenticated`);
            
            // Send pending matches notification if any
            sendPendingMatchesUpdate(userId);
            
            // Send any pending messages that were stored while user was offline
            if (pendingMessages.has(userId)) {
              const messages = pendingMessages.get(userId) || [];
              console.log(`Found ${messages.length} pending messages for user ${userId}`);
              
              for (const message of messages) {
                sendNotification(userId, message);
              }
              
              // Clear the pending messages after sending
              pendingMessages.delete(userId);
            }
          }
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });
    
    // Handle disconnection
    ws.on('close', () => {
      if (userId) {
        connectedClients.delete(userId);
        console.log(`WebSocket: User ${userId} disconnected`);
      }
    });
  });
  
  // Send notification to a specific user
  function sendNotification(userId: number, notification: any) {
    console.log(`Attempting to send notification to user ${userId}:`, notification);
    
    const client = connectedClients.get(userId);
    if (!client) {
      console.log(`No WebSocket connection found for user ${userId}`);
      
      // Store the notification for later delivery
      if (!pendingMessages.has(userId)) {
        pendingMessages.set(userId, []);
      }
      pendingMessages.get(userId)?.push(notification);
      console.log(`Stored notification for offline user ${userId} to deliver later`);
      
      return false;
    }
    
    if (client.readyState !== WebSocket.OPEN) {
      console.log(`WebSocket for user ${userId} is not in OPEN state (state: ${client.readyState})`);
      
      // Store the notification for later delivery
      if (!pendingMessages.has(userId)) {
        pendingMessages.set(userId, []);
      }
      pendingMessages.get(userId)?.push(notification);
      console.log(`Stored notification for user ${userId} with non-open connection`);
      
      return false;
    }
    
    try {
      const message = JSON.stringify(notification);
      client.send(message);
      console.log(`Successfully sent notification to user ${userId}`);
      return true;
    } catch (error) {
      console.error(`Error sending notification to user ${userId}:`, error);
      
      // Store the notification if there was an error sending it
      if (!pendingMessages.has(userId)) {
        pendingMessages.set(userId, []);
      }
      pendingMessages.get(userId)?.push(notification);
      console.log(`Stored notification after send error for user ${userId}`);
      
      return false;
    }
  }
  
  // Send pending matches update to a user
  async function sendPendingMatchesUpdate(userId: number) {
    try {
      const matches = await storage.getUserMatches(userId);
      const pendingMatches = matches.filter(match => match.status === 'pending' && match.userId2 === userId);
      
      if (pendingMatches.length > 0) {
        // Get details for each pending match
        const pendingMatchesWithDetails = await Promise.all(
          pendingMatches.map(async (match) => {
            const requester = await storage.getUser(match.userId1);
            return {
              matchId: match.id,
              userId: requester?.id,
              displayName: requester?.displayName || 'Unknown user',
              profilePic: requester?.profilePic
            };
          })
        );
        
        sendNotification(userId, {
          type: 'pending_matches',
          matches: pendingMatchesWithDetails
        });
      }
    } catch (error) {
      console.error('Error sending pending matches update:', error);
    }
  }
  
  // We'll modify the original match request endpoint directly in its definition
  
  // Add error handler
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ message: "Internal server error" });
  });
  
  return httpServer;
}
