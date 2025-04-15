import { 
  users, challenges, challengeProgresses, matches, messages, interests,
  meetings, meetingAttendees, groupChallenges, groupChallengeParticipants,
  type User, type InsertUser, 
  type Match, type InsertMatch, 
  type Challenge, type InsertChallenge, 
  type ChallengeProgress, type InsertChallengeProgress,
  type Message, type InsertMessage,
  type Interest, type InsertInterest,
  type Meeting, type InsertMeeting,
  type MeetingAttendee, type InsertMeetingAttendee,
  type GroupChallenge, type InsertGroupChallenge,
  type GroupChallengeParticipant, type InsertGroupChallengeParticipant
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, or, inArray } from "drizzle-orm";
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

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
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
    
    console.log(`Getting challenges for match IDs: ${validMatchIds.join(', ')}`);
    
    try {
      // Use OR conditions for each valid match ID
      const results = await db
        .select()
        .from(challenges)
        .where(
          or(
            ...validMatchIds.map(id => eq(challenges.matchId, id))
          )
        );
      return results;
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
  
  // Sobriety tracking methods
  async updateDaysSober(challengeId: number, userId: number, daysSober: number): Promise<ChallengeProgress> {
    const [updatedProgress] = await db
      .update(challengeProgresses)
      .set({ 
        daysSober,
        lastSoberDate: new Date(),
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
  
  async resetDaysSober(challengeId: number, userId: number): Promise<ChallengeProgress> {
    const [updatedProgress] = await db
      .update(challengeProgresses)
      .set({ 
        daysSober: 0,
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
  
  // Check-in streak methods
  async recordCheckIn(challengeId: number, userId: number): Promise<ChallengeProgress> {
    // First get the current progress
    const [progress] = await db
      .select()
      .from(challengeProgresses)
      .where(
        and(
          eq(challengeProgresses.challengeId, challengeId),
          eq(challengeProgresses.userId, userId)
        )
      );
    
    const now = new Date();
    
    // Calculate the new streak values
    let currentStreak = progress?.currentStreak || 0;
    let longestStreak = progress?.longestStreak || 0;
    
    const lastCheckIn = progress?.lastCheckIn ? new Date(progress.lastCheckIn) : null;
    
    if (lastCheckIn) {
      const hoursSinceLastCheckIn = (now.getTime() - lastCheckIn.getTime()) / (1000 * 60 * 60);
      
      // If check-in is within the valid window (20-36 hours), increment streak
      if (hoursSinceLastCheckIn >= 20 && hoursSinceLastCheckIn <= 36) {
        currentStreak += 1;
        if (currentStreak > longestStreak) {
          longestStreak = currentStreak;
        }
      } else if (hoursSinceLastCheckIn > 36) {
        // Streak broken if more than 36 hours have passed
        currentStreak = 1;
      }
      // If less than 20 hours, it's too soon but we'll allow it without incrementing
    } else {
      // First check-in
      currentStreak = 1;
      longestStreak = 1;
    }
    
    // Update the progress record
    const stepsCompleted = (progress?.stepsCompleted || 0) + 1;
    
    const [updatedProgress] = await db
      .update(challengeProgresses)
      .set({ 
        stepsCompleted,
        currentStreak,
        longestStreak,
        lastCheckIn: now,
        lastUpdated: now
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
  
  async getCheckInStreak(challengeId: number, userId: number): Promise<{currentStreak: number, longestStreak: number}> {
    const [progress] = await db
      .select()
      .from(challengeProgresses)
      .where(
        and(
          eq(challengeProgresses.challengeId, challengeId),
          eq(challengeProgresses.userId, userId)
        )
      );
    
    if (!progress) {
      return {
        currentStreak: 0,
        longestStreak: 0
      };
    }
    
    // Check if the streak is still valid
    const now = new Date();
    const lastCheckIn = progress.lastCheckIn ? new Date(progress.lastCheckIn) : null;
    let currentStreak = progress.currentStreak || 0;
    
    if (lastCheckIn) {
      const hoursSinceLastCheckIn = (now.getTime() - lastCheckIn.getTime()) / (1000 * 60 * 60);
      
      // If more than 36 hours have passed, streak is broken
      if (hoursSinceLastCheckIn > 36) {
        currentStreak = 0;
        
        // Update the stored value
        await db
          .update(challengeProgresses)
          .set({ 
            currentStreak: 0,
            lastUpdated: now
          })
          .where(
            and(
              eq(challengeProgresses.challengeId, challengeId),
              eq(challengeProgresses.userId, userId)
            )
          );
      }
    }
    
    return {
      currentStreak,
      longestStreak: progress.longestStreak || 0
    };
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

  // Achievement methods removed

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

  // ===========================
  // Meeting related methods
  // ===========================
  async getMeeting(id: number): Promise<Meeting | undefined> {
    const [meeting] = await db.select().from(meetings).where(eq(meetings.id, id));
    return meeting;
  }

  async getAllMeetings(limit?: number, offset?: number): Promise<Meeting[]> {
    let query = db.select().from(meetings);
    
    if (limit !== undefined) {
      query = query.limit(limit);
    }
    
    if (offset !== undefined) {
      query = query.offset(offset);
    }
    
    return query;
  }

  async getMeetingsByLocation(latitude: number, longitude: number, radiusInKm: number): Promise<Meeting[]> {
    // Calculate bounding box for initial filtering
    const kmPerLat = 111.32; // km per degree latitude
    const kmPerLng = 111.32 * Math.cos(latitude * (Math.PI / 180)); // km per degree longitude
    
    const latDelta = radiusInKm / kmPerLat;
    const lngDelta = radiusInKm / kmPerLng;
    
    const minLat = latitude - latDelta;
    const maxLat = latitude + latDelta;
    const minLng = longitude - lngDelta;
    const maxLng = longitude + lngDelta;
    
    // First get meetings within the bounding box (coarse filter)
    const potentialMeetings = await db.select().from(meetings).where(
      and(
        sql`${meetings.latitude} >= ${minLat}`,
        sql`${meetings.latitude} <= ${maxLat}`,
        sql`${meetings.longitude} >= ${minLng}`,
        sql`${meetings.longitude} <= ${maxLng}`
      )
    );
    
    // Function to calculate actual distance in km using Haversine formula
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
      const R = 6371; // Radius of the Earth in km
      const dLat = (lat2 - lat1) * (Math.PI / 180);
      const dLon = (lon2 - lon1) * (Math.PI / 180);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };
    
    // Fine filter: check actual distance for each meeting
    return potentialMeetings.filter(meeting => {
      if (meeting.latitude === null || meeting.longitude === null) return false;
      const distance = calculateDistance(latitude, longitude, meeting.latitude, meeting.longitude);
      return distance <= radiusInKm;
    });
  }

  async createMeeting(meetingData: InsertMeeting): Promise<Meeting> {
    const [meeting] = await db
      .insert(meetings)
      .values(meetingData)
      .returning();
    return meeting;
  }

  async updateMeeting(id: number, meetingData: Partial<Meeting>): Promise<Meeting> {
    const [updatedMeeting] = await db
      .update(meetings)
      .set({
        ...meetingData,
        updatedAt: new Date()
      })
      .where(eq(meetings.id, id))
      .returning();
    return updatedMeeting;
  }

  async deleteMeeting(id: number): Promise<boolean> {
    try {
      // First delete any attendees for this meeting
      await db
        .delete(meetingAttendees)
        .where(eq(meetingAttendees.meetingId, id));
      
      // Then delete the meeting
      const result = await db
        .delete(meetings)
        .where(eq(meetings.id, id))
        .returning({ id: meetings.id });
      
      return result.length > 0;
    } catch (error) {
      console.error(`Error deleting meeting: ${error}`);
      return false;
    }
  }

  // ===========================
  // Meeting Attendee related methods
  // ===========================
  async getMeetingAttendees(meetingId: number): Promise<MeetingAttendee[]> {
    return db
      .select()
      .from(meetingAttendees)
      .where(eq(meetingAttendees.meetingId, meetingId));
  }

  async getUserMeetingAttendance(userId: number): Promise<MeetingAttendee[]> {
    return db
      .select()
      .from(meetingAttendees)
      .where(eq(meetingAttendees.userId, userId));
  }

  async attendMeeting(attendeeData: InsertMeetingAttendee): Promise<MeetingAttendee> {
    // Check if already attending
    const [existing] = await db
      .select()
      .from(meetingAttendees)
      .where(
        and(
          eq(meetingAttendees.meetingId, attendeeData.meetingId),
          eq(meetingAttendees.userId, attendeeData.userId)
        )
      );
    
    if (existing) {
      // Update status if already exists
      return this.updateAttendanceStatus(
        attendeeData.meetingId,
        attendeeData.userId,
        attendeeData.status || 'going'
      );
    }
    
    // Create new attendance record
    const [attendee] = await db
      .insert(meetingAttendees)
      .values(attendeeData)
      .returning();
    return attendee;
  }

  async updateAttendanceStatus(meetingId: number, userId: number, status: string): Promise<MeetingAttendee> {
    const [updatedAttendee] = await db
      .update(meetingAttendees)
      .set({ status })
      .where(
        and(
          eq(meetingAttendees.meetingId, meetingId),
          eq(meetingAttendees.userId, userId)
        )
      )
      .returning();
    return updatedAttendee;
  }

  async checkInToMeeting(meetingId: number, userId: number): Promise<MeetingAttendee> {
    const [attendee] = await db
      .update(meetingAttendees)
      .set({
        checkedIn: true,
        checkInTime: new Date()
      })
      .where(
        and(
          eq(meetingAttendees.meetingId, meetingId),
          eq(meetingAttendees.userId, userId)
        )
      )
      .returning();
    
    // If user is not registered as attending, create an attendance record
    if (!attendee) {
      return this.attendMeeting({
        meetingId,
        userId,
        status: 'going',
        checkedIn: true,
        checkInTime: new Date()
      });
    }
    
    return attendee;
  }

  // ===========================
  // Group Challenge related methods
  // ===========================
  async getGroupChallenge(id: number): Promise<GroupChallenge | undefined> {
    const [challenge] = await db
      .select()
      .from(groupChallenges)
      .where(eq(groupChallenges.id, id));
    return challenge;
  }

  async getActiveGroupChallenges(limit?: number, offset?: number): Promise<GroupChallenge[]> {
    let query = db
      .select()
      .from(groupChallenges)
      .where(eq(groupChallenges.status, 'active'));
    
    if (limit !== undefined) {
      query = query.limit(limit);
    }
    
    if (offset !== undefined) {
      query = query.offset(offset);
    }
    
    return query;
  }

  async getUserGroupChallenges(userId: number): Promise<GroupChallenge[]> {
    // Get IDs of group challenges the user is participating in
    const participations = await db
      .select({ challengeId: groupChallengeParticipants.groupChallengeId })
      .from(groupChallengeParticipants)
      .where(eq(groupChallengeParticipants.userId, userId));
    
    if (participations.length === 0) {
      return [];
    }
    
    // Get the actual challenges
    return db
      .select()
      .from(groupChallenges)
      .where(
        inArray(
          groupChallenges.id,
          participations.map(p => p.challengeId)
        )
      );
  }

  async createGroupChallenge(challengeData: InsertGroupChallenge): Promise<GroupChallenge> {
    const [challenge] = await db
      .insert(groupChallenges)
      .values(challengeData)
      .returning();
    return challenge;
  }

  async updateGroupChallenge(id: number, challengeData: Partial<GroupChallenge>): Promise<GroupChallenge> {
    const [updatedChallenge] = await db
      .update(groupChallenges)
      .set({
        ...challengeData,
        updatedAt: new Date()
      })
      .where(eq(groupChallenges.id, id))
      .returning();
    return updatedChallenge;
  }

  // ===========================
  // Group Challenge Participant related methods
  // ===========================
  async getGroupChallengeParticipants(groupChallengeId: number): Promise<GroupChallengeParticipant[]> {
    return db
      .select()
      .from(groupChallengeParticipants)
      .where(eq(groupChallengeParticipants.groupChallengeId, groupChallengeId));
  }

  async joinGroupChallenge(participantData: InsertGroupChallengeParticipant): Promise<GroupChallengeParticipant> {
    // Check if already participating
    const [existing] = await db
      .select()
      .from(groupChallengeParticipants)
      .where(
        and(
          eq(groupChallengeParticipants.groupChallengeId, participantData.groupChallengeId),
          eq(groupChallengeParticipants.userId, participantData.userId)
        )
      );
    
    if (existing) {
      // Already participating, update status if needed
      if (participantData.status && participantData.status !== existing.status) {
        const [updated] = await db
          .update(groupChallengeParticipants)
          .set({ status: participantData.status })
          .where(eq(groupChallengeParticipants.id, existing.id))
          .returning();
        return updated;
      }
      return existing;
    }
    
    // Create new participant record
    const [participant] = await db
      .insert(groupChallengeParticipants)
      .values(participantData)
      .returning();
    return participant;
  }

  async updateGroupChallengeProgress(groupChallengeId: number, userId: number, stepsCompleted: number): Promise<GroupChallengeParticipant> {
    const [updatedParticipant] = await db
      .update(groupChallengeParticipants)
      .set({
        stepsCompleted,
        lastUpdated: new Date()
      })
      .where(
        and(
          eq(groupChallengeParticipants.groupChallengeId, groupChallengeId),
          eq(groupChallengeParticipants.userId, userId)
        )
      )
      .returning();
    
    // Calculate and update points based on progress
    const [challenge] = await db
      .select()
      .from(groupChallenges)
      .where(eq(groupChallenges.id, groupChallengeId));
    
    if (challenge) {
      const progressPercentage = stepsCompleted / challenge.totalSteps;
      const pointsEarned = Math.round(progressPercentage * 100); // Simple points calculation
      
      // Update points
      await db
        .update(groupChallengeParticipants)
        .set({ pointsEarned })
        .where(eq(groupChallengeParticipants.id, updatedParticipant.id));
      
      // Update the participant record with points
      updatedParticipant.pointsEarned = pointsEarned;
    }
    
    return updatedParticipant;
  }

  async getGroupChallengeLeaderboard(groupChallengeId: number, limit?: number): Promise<GroupChallengeParticipant[]> {
    let query = db
      .select()
      .from(groupChallengeParticipants)
      .where(eq(groupChallengeParticipants.groupChallengeId, groupChallengeId))
      .orderBy(desc(groupChallengeParticipants.pointsEarned));
    
    if (limit !== undefined) {
      query = query.limit(limit);
    }
    
    return query;
  }
}