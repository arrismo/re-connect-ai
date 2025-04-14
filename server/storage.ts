import {
  User,
  InsertUser,
  Match,
  InsertMatch,
  Challenge,
  InsertChallenge,
  ChallengeProgress,
  InsertChallengeProgress,
  Message,
  InsertMessage,
  Achievement,
  InsertAchievement,
  Interest,
  InsertInterest
} from "@shared/schema";
import { DatabaseStorage } from "./DatabaseStorage";

export interface IStorage {
  // User related methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User>;
  updateUserLastActive(id: number): Promise<User>;
  addUserPoints(id: number, points: number): Promise<User>;
  getAllUsers(): Promise<User[]>;
  
  // Match related methods
  getMatch(id: number): Promise<Match | undefined>;
  getUserMatches(userId: number): Promise<Match[]>;
  findExistingMatch(userId1: number, userId2: number): Promise<Match | undefined>;
  createMatch(match: InsertMatch): Promise<Match>;
  updateMatchStatus(id: number, status: string): Promise<Match>;
  
  // Challenge related methods
  getChallenge(id: number): Promise<Challenge | undefined>;
  getMatchChallenges(matchId: number): Promise<Challenge[]>;
  getActiveMatchChallenge(matchId: number): Promise<Challenge | undefined>;
  getUserChallenges(matchIds: number[]): Promise<Challenge[]>;
  createChallenge(challenge: InsertChallenge): Promise<Challenge>;
  updateChallengeStatus(id: number, status: string): Promise<Challenge>;
  
  // Challenge Progress related methods
  getChallengeProgress(challengeId: number, userId: number): Promise<ChallengeProgress | undefined>;
  createChallengeProgress(progress: InsertChallengeProgress): Promise<ChallengeProgress>;
  updateChallengeProgress(challengeId: number, userId: number, stepsCompleted: number): Promise<ChallengeProgress>;
  
  // Sobriety tracking methods
  updateDaysSober(challengeId: number, userId: number, daysSober: number): Promise<ChallengeProgress>;
  resetDaysSober(challengeId: number, userId: number): Promise<ChallengeProgress>;
  
  // Check-in streak methods
  recordCheckIn(challengeId: number, userId: number): Promise<ChallengeProgress>;
  getCheckInStreak(challengeId: number, userId: number): Promise<{currentStreak: number, longestStreak: number}>;
  
  // Message related methods
  getMatchMessages(matchId: number): Promise<Message[]>;
  getRecentMatchMessages(matchId: number, limit: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessagesAsRead(matchId: number, userId: number): Promise<void>;
  
  // Achievement related methods
  createAchievement(achievement: InsertAchievement): Promise<Achievement>;
  getUserAchievements(userId: number): Promise<Achievement[]>;
  
  // Interest related methods
  createInterest(interest: InsertInterest): Promise<Interest>;
  getAllInterests(): Promise<Interest[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private matches: Map<number, Match>;
  private challenges: Map<number, Challenge>;
  private challengeProgresses: Map<string, ChallengeProgress>;
  private messages: Map<number, Message>;
  private achievements: Map<number, Achievement>;
  private interests: Map<number, Interest>;
  
  userIdCounter: number;
  matchIdCounter: number;
  challengeIdCounter: number;
  progressIdCounter: number;
  messageIdCounter: number;
  achievementIdCounter: number;
  interestIdCounter: number;

  constructor() {
    this.users = new Map();
    this.matches = new Map();
    this.challenges = new Map();
    this.challengeProgresses = new Map();
    this.messages = new Map();
    this.achievements = new Map();
    this.interests = new Map();
    
    this.userIdCounter = 1;
    this.matchIdCounter = 1;
    this.challengeIdCounter = 1;
    this.progressIdCounter = 1;
    this.messageIdCounter = 1;
    this.achievementIdCounter = 1;
    this.interestIdCounter = 1;
  }

  // ==========================
  // User related methods
  // ==========================
  
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(userData: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    const user: User = { 
      ...userData, 
      id, 
      points: 0,
      createdAt: now,
      lastActive: now
    };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User> {
    const user = await this.getUser(id);
    if (!user) {
      throw new Error(`User with id ${id} not found`);
    }
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async updateUserLastActive(id: number): Promise<User> {
    const user = await this.getUser(id);
    if (!user) {
      throw new Error(`User with id ${id} not found`);
    }
    
    const updatedUser = { ...user, lastActive: new Date() };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async addUserPoints(id: number, points: number): Promise<User> {
    const user = await this.getUser(id);
    if (!user) {
      throw new Error(`User with id ${id} not found`);
    }
    
    const updatedUser = { ...user, points: user.points + points };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  // ==========================
  // Match related methods
  // ==========================
  
  async getMatch(id: number): Promise<Match | undefined> {
    return this.matches.get(id);
  }
  
  async getUserMatches(userId: number): Promise<Match[]> {
    return Array.from(this.matches.values()).filter(
      (match) => (match.userId1 === userId || match.userId2 === userId) &&
                 match.status !== "rejected"
    );
  }
  
  async findExistingMatch(userId1: number, userId2: number): Promise<Match | undefined> {
    return Array.from(this.matches.values()).find(
      (match) => (
        (match.userId1 === userId1 && match.userId2 === userId2) ||
        (match.userId1 === userId2 && match.userId2 === userId1)
      )
    );
  }
  
  async createMatch(matchData: InsertMatch): Promise<Match> {
    const id = this.matchIdCounter++;
    const now = new Date();
    const match: Match = { 
      ...matchData, 
      id,
      createdAt: now,
      updatedAt: now
    };
    this.matches.set(id, match);
    return match;
  }
  
  async updateMatchStatus(id: number, status: string): Promise<Match> {
    const match = await this.getMatch(id);
    if (!match) {
      throw new Error(`Match with id ${id} not found`);
    }
    
    const updatedMatch = { ...match, status, updatedAt: new Date() };
    this.matches.set(id, updatedMatch);
    return updatedMatch;
  }
  
  // ==========================
  // Challenge related methods
  // ==========================
  
  async getChallenge(id: number): Promise<Challenge | undefined> {
    return this.challenges.get(id);
  }
  
  async getMatchChallenges(matchId: number): Promise<Challenge[]> {
    return Array.from(this.challenges.values()).filter(
      (challenge) => challenge.matchId === matchId
    );
  }
  
  async getActiveMatchChallenge(matchId: number): Promise<Challenge | undefined> {
    return Array.from(this.challenges.values()).find(
      (challenge) => challenge.matchId === matchId && challenge.status === "active"
    );
  }
  
  async getUserChallenges(matchIds: number[]): Promise<Challenge[]> {
    return Array.from(this.challenges.values()).filter(
      (challenge) => matchIds.includes(challenge.matchId)
    );
  }
  
  async createChallenge(challengeData: InsertChallenge): Promise<Challenge> {
    const id = this.challengeIdCounter++;
    const now = new Date();
    const challenge: Challenge = { 
      ...challengeData, 
      id,
      createdAt: now
    };
    this.challenges.set(id, challenge);
    return challenge;
  }
  
  async updateChallengeStatus(id: number, status: string): Promise<Challenge> {
    const challenge = await this.getChallenge(id);
    if (!challenge) {
      throw new Error(`Challenge with id ${id} not found`);
    }
    
    const updatedChallenge = { ...challenge, status };
    this.challenges.set(id, updatedChallenge);
    return updatedChallenge;
  }
  
  // ==========================
  // Challenge Progress related methods
  // ==========================
  
  async getChallengeProgress(challengeId: number, userId: number): Promise<ChallengeProgress | undefined> {
    const key = `${challengeId}-${userId}`;
    return this.challengeProgresses.get(key);
  }
  
  async createChallengeProgress(progressData: InsertChallengeProgress): Promise<ChallengeProgress> {
    const id = this.progressIdCounter++;
    const now = new Date();
    const progress: ChallengeProgress = { 
      ...progressData, 
      id,
      lastUpdated: now
    };
    
    const key = `${progressData.challengeId}-${progressData.userId}`;
    this.challengeProgresses.set(key, progress);
    return progress;
  }
  
  async updateChallengeProgress(challengeId: number, userId: number, stepsCompleted: number): Promise<ChallengeProgress> {
    const key = `${challengeId}-${userId}`;
    const progress = await this.getChallengeProgress(challengeId, userId);
    
    if (!progress) {
      return this.createChallengeProgress({
        challengeId,
        userId,
        stepsCompleted
      });
    }
    
    const updatedProgress = { 
      ...progress, 
      stepsCompleted,
      lastUpdated: new Date()
    };
    
    this.challengeProgresses.set(key, updatedProgress);
    return updatedProgress;
  }
  
  // Sobriety tracking methods
  async updateDaysSober(challengeId: number, userId: number, daysSober: number): Promise<ChallengeProgress> {
    const key = `${challengeId}-${userId}`;
    const progress = await this.getChallengeProgress(challengeId, userId);
    
    if (!progress) {
      return this.createChallengeProgress({
        challengeId,
        userId,
        stepsCompleted: 0,
        daysSober,
        lastSoberDate: new Date()
      });
    }
    
    const updatedProgress = { 
      ...progress, 
      daysSober,
      lastSoberDate: new Date(),
      lastUpdated: new Date()
    };
    
    this.challengeProgresses.set(key, updatedProgress);
    return updatedProgress;
  }
  
  async resetDaysSober(challengeId: number, userId: number): Promise<ChallengeProgress> {
    const key = `${challengeId}-${userId}`;
    const progress = await this.getChallengeProgress(challengeId, userId);
    
    if (!progress) {
      return this.createChallengeProgress({
        challengeId,
        userId,
        stepsCompleted: 0,
        daysSober: 0,
      });
    }
    
    const updatedProgress = { 
      ...progress, 
      daysSober: 0,
      lastUpdated: new Date()
    };
    
    this.challengeProgresses.set(key, updatedProgress);
    return updatedProgress;
  }
  
  // Check-in streak methods
  async recordCheckIn(challengeId: number, userId: number): Promise<ChallengeProgress> {
    const key = `${challengeId}-${userId}`;
    const progress = await this.getChallengeProgress(challengeId, userId);
    const now = new Date();
    
    if (!progress) {
      return this.createChallengeProgress({
        challengeId,
        userId,
        stepsCompleted: 1,
        currentStreak: 1,
        longestStreak: 1,
        lastCheckIn: now
      });
    }
    
    // Check if this is a consecutive check-in (within 24-36 hours of last check-in)
    let currentStreak = progress.currentStreak || 0;
    let longestStreak = progress.longestStreak || 0;
    
    const lastCheckIn = progress.lastCheckIn ? new Date(progress.lastCheckIn) : null;
    
    if (lastCheckIn) {
      const hoursSinceLastCheckIn = (now.getTime() - lastCheckIn.getTime()) / (1000 * 60 * 60);
      
      // If check-in is within the valid window (24-36 hours), increment streak
      if (hoursSinceLastCheckIn >= 20 && hoursSinceLastCheckIn <= 36) {
        currentStreak += 1;
        if (currentStreak > longestStreak) {
          longestStreak = currentStreak;
        }
      } else if (hoursSinceLastCheckIn > 36) {
        // Streak broken if more than 36 hours have passed
        currentStreak = 1;
      }
      // If less than 20 hours, it's too soon for another check-in, but we'll allow it
      // without incrementing the streak
    } else {
      // First check-in
      currentStreak = 1;
      longestStreak = 1;
    }
    
    const updatedProgress = { 
      ...progress, 
      stepsCompleted: (progress.stepsCompleted || 0) + 1,
      currentStreak,
      longestStreak,
      lastCheckIn: now,
      lastUpdated: now
    };
    
    this.challengeProgresses.set(key, updatedProgress);
    return updatedProgress;
  }
  
  async getCheckInStreak(challengeId: number, userId: number): Promise<{currentStreak: number, longestStreak: number}> {
    const progress = await this.getChallengeProgress(challengeId, userId);
    
    if (!progress) {
      return {
        currentStreak: 0,
        longestStreak: 0
      };
    }
    
    // Check if streak is still valid (not broken due to inactivity)
    const now = new Date();
    const lastCheckIn = progress.lastCheckIn ? new Date(progress.lastCheckIn) : null;
    let currentStreak = progress.currentStreak || 0;
    
    if (lastCheckIn) {
      const hoursSinceLastCheckIn = (now.getTime() - lastCheckIn.getTime()) / (1000 * 60 * 60);
      
      // If more than 36 hours have passed, streak is broken
      if (hoursSinceLastCheckIn > 36) {
        currentStreak = 0;
        
        // Update the stored value
        const updatedProgress = { 
          ...progress, 
          currentStreak: 0,
          lastUpdated: now
        };
        
        const key = `${challengeId}-${userId}`;
        this.challengeProgresses.set(key, updatedProgress);
      }
    }
    
    return {
      currentStreak,
      longestStreak: progress.longestStreak || 0
    };
  }
  
  // ==========================
  // Message related methods
  // ==========================
  
  async getMatchMessages(matchId: number): Promise<Message[]> {
    const messages = Array.from(this.messages.values())
      .filter(message => message.matchId === matchId)
      .sort((a, b) => a.sentAt.getTime() - b.sentAt.getTime());
    
    return messages;
  }
  
  async getRecentMatchMessages(matchId: number, limit: number): Promise<Message[]> {
    const messages = await this.getMatchMessages(matchId);
    return messages.slice(-limit);
  }
  
  async createMessage(messageData: InsertMessage): Promise<Message> {
    const id = this.messageIdCounter++;
    const now = new Date();
    const message: Message = { 
      ...messageData, 
      id,
      sentAt: now,
      isRead: false
    };
    
    this.messages.set(id, message);
    return message;
  }
  
  async markMessagesAsRead(matchId: number, userId: number): Promise<void> {
    const messages = await this.getMatchMessages(matchId);
    
    for (const message of messages) {
      if (message.senderId !== userId && !message.isRead) {
        const updatedMessage = { ...message, isRead: true };
        this.messages.set(message.id, updatedMessage);
      }
    }
  }
  
  // ==========================
  // Achievement related methods
  // ==========================
  
  async createAchievement(achievementData: InsertAchievement): Promise<Achievement> {
    const id = this.achievementIdCounter++;
    const now = new Date();
    const achievement: Achievement = { 
      ...achievementData, 
      id,
      earnedAt: now
    };
    
    this.achievements.set(id, achievement);
    return achievement;
  }
  
  async getUserAchievements(userId: number): Promise<Achievement[]> {
    return Array.from(this.achievements.values())
      .filter(achievement => achievement.userId === userId)
      .sort((a, b) => b.earnedAt.getTime() - a.earnedAt.getTime());
  }
  
  // ==========================
  // Interest related methods
  // ==========================
  
  async createInterest(interestData: InsertInterest): Promise<Interest> {
    // Check if interest already exists
    const existingInterest = Array.from(this.interests.values()).find(
      (interest) => interest.name === interestData.name
    );
    
    if (existingInterest) {
      return existingInterest;
    }
    
    const id = this.interestIdCounter++;
    const interest: Interest = { 
      ...interestData, 
      id
    };
    
    this.interests.set(id, interest);
    return interest;
  }
  
  async getAllInterests(): Promise<Interest[]> {
    return Array.from(this.interests.values());
  }
}

// Use the database storage implementation
export const storage = new DatabaseStorage();
