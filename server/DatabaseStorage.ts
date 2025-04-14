import { 
  users, challenges, challengeProgresses, matches, messages, achievements, interests,
  type User, type InsertUser, 
  type Match, type InsertMatch, 
  type Challenge, type InsertChallenge, 
  type ChallengeProgress, type InsertChallengeProgress,
  type Message, type InsertMessage,
  type Achievement, type InsertAchievement,
  type Interest, type InsertInterest
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, or } from "drizzle-orm";
import { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
  // User related methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async updateUserLastActive(id: number): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ lastActive: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async addUserPoints(id: number, pointsToAdd: number): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ 
        points: sql`${users.points} + ${pointsToAdd}` 
      })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  // Match related methods
  async getMatch(id: number): Promise<Match | undefined> {
    const [match] = await db.select().from(matches).where(eq(matches.id, id));
    return match;
  }

  async getUserMatches(userId: number): Promise<Match[]> {
    // Make sure userId is a valid number
    if (typeof userId !== 'number' || isNaN(userId)) {
      console.error(`getUserMatches called with invalid userId: ${userId}`);
      return [];
    }
    
    // Use integer casting to ensure we're using the correct type
    return db
      .select()
      .from(matches)
      .where(
        or(
          eq(matches.userId1, userId),
          eq(matches.userId2, userId)
        )
      );
  }

  async findExistingMatch(userId1: number, userId2: number): Promise<Match | undefined> {
    // Make sure userIds are valid numbers
    if (typeof userId1 !== 'number' || isNaN(userId1) || 
        typeof userId2 !== 'number' || isNaN(userId2)) {
      console.error(`findExistingMatch called with invalid userIds: ${userId1}, ${userId2}`);
      return undefined;
    }
    
    const [match] = await db
      .select()
      .from(matches)
      .where(
        or(
          and(
            eq(matches.userId1, userId1),
            eq(matches.userId2, userId2)
          ),
          and(
            eq(matches.userId1, userId2),
            eq(matches.userId2, userId1)
          )
        )
      );
    return match;
  }

  async createMatch(matchData: InsertMatch): Promise<Match> {
    const [match] = await db
      .insert(matches)
      .values(matchData)
      .returning();
    return match;
  }

  async updateMatchStatus(id: number, status: string): Promise<Match> {
    const [updatedMatch] = await db
      .update(matches)
      .set({ 
        status,
        updatedAt: new Date()
      })
      .where(eq(matches.id, id))
      .returning();
    return updatedMatch;
  }

  // Challenge related methods
  async getChallenge(id: number): Promise<Challenge | undefined> {
    const [challenge] = await db
      .select()
      .from(challenges)
      .where(eq(challenges.id, id));
    return challenge;
  }

  async getMatchChallenges(matchId: number): Promise<Challenge[]> {
    return db
      .select()
      .from(challenges)
      .where(eq(challenges.matchId, matchId));
  }

  async getActiveMatchChallenge(matchId: number): Promise<Challenge | undefined> {
    const [challenge] = await db
      .select()
      .from(challenges)
      .where(
        and(
          eq(challenges.matchId, matchId),
          eq(challenges.status, "active")
        )
      );
    return challenge;
  }

  async getUserChallenges(matchIds: number[]): Promise<Challenge[]> {
    if (matchIds.length === 0) return [];
    
    // Filter out any non-numeric or NaN IDs
    const validMatchIds = matchIds.filter(id => 
      typeof id === 'number' && !isNaN(id)
    );
    
    if (validMatchIds.length === 0) return [];
    
    // Use a safe parameterized query with SQL template literals
    const safeList = validMatchIds.join(',');
    console.log(`Getting challenges for match IDs: ${safeList}`);
    
    try {
      return db
        .select()
        .from(challenges)
        .where(sql`${challenges.matchId} IN (${safeList})`);
    } catch (error) {
      console.error(`Error in getUserChallenges: ${error}`);
      return [];
    }
  }

  async createChallenge(challengeData: InsertChallenge): Promise<Challenge> {
    const [challenge] = await db
      .insert(challenges)
      .values(challengeData)
      .returning();
    return challenge;
  }

  async updateChallengeStatus(id: number, status: string): Promise<Challenge> {
    const [updatedChallenge] = await db
      .update(challenges)
      .set({ status })
      .where(eq(challenges.id, id))
      .returning();
    return updatedChallenge;
  }

  // Challenge Progress related methods
  async getChallengeProgress(challengeId: number, userId: number): Promise<ChallengeProgress | undefined> {
    const [progress] = await db
      .select()
      .from(challengeProgresses)
      .where(
        and(
          eq(challengeProgresses.challengeId, challengeId),
          eq(challengeProgresses.userId, userId)
        )
      );
    return progress;
  }

  async createChallengeProgress(progressData: InsertChallengeProgress): Promise<ChallengeProgress> {
    const [progress] = await db
      .insert(challengeProgresses)
      .values(progressData)
      .returning();
    return progress;
  }

  async updateChallengeProgress(challengeId: number, userId: number, stepsCompleted: number): Promise<ChallengeProgress> {
    const [updatedProgress] = await db
      .update(challengeProgresses)
      .set({ 
        stepsCompleted,
        lastUpdated: new Date()
      })
      .where(
        and(
          eq(challengeProgresses.challengeId, challengeId),
          eq(challengeProgresses.userId, userId)
        )
      )
      .returning();
    return updatedProgress;
  }

  // Message related methods
  async getMatchMessages(matchId: number): Promise<Message[]> {
    return db
      .select()
      .from(messages)
      .where(eq(messages.matchId, matchId))
      .orderBy(messages.sentAt);
  }

  async getRecentMatchMessages(matchId: number, limit: number): Promise<Message[]> {
    return db
      .select()
      .from(messages)
      .where(eq(messages.matchId, matchId))
      .orderBy(desc(messages.sentAt))
      .limit(limit);
  }

  async createMessage(messageData: InsertMessage): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values(messageData)
      .returning();
    return message;
  }

  async markMessagesAsRead(matchId: number, userId: number): Promise<void> {
    await db
      .update(messages)
      .set({ isRead: true })
      .where(
        and(
          eq(messages.matchId, matchId),
          sql`${messages.senderId} != ${userId}`,
          eq(messages.isRead, false)
        )
      );
  }

  // Achievement related methods
  async createAchievement(achievementData: InsertAchievement): Promise<Achievement> {
    const [achievement] = await db
      .insert(achievements)
      .values(achievementData)
      .returning();
    return achievement;
  }

  async getUserAchievements(userId: number): Promise<Achievement[]> {
    return db
      .select()
      .from(achievements)
      .where(eq(achievements.userId, userId))
      .orderBy(desc(achievements.earnedAt));
  }

  // Interest related methods
  async createInterest(interestData: InsertInterest): Promise<Interest> {
    const [interest] = await db
      .insert(interests)
      .values(interestData)
      .returning();
    return interest;
  }

  async getAllInterests(): Promise<Interest[]> {
    return db.select().from(interests);
  }
}