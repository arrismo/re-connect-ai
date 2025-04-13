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
