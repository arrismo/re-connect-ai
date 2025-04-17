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
  Interest,
  InsertInterest,
  Meeting,
  InsertMeeting,
  MeetingAttendee,
  InsertMeetingAttendee,
  GroupChallenge,
  InsertGroupChallenge,
  GroupChallengeParticipant,
  InsertGroupChallengeParticipant
} from "@shared/schema";
import { DatabaseStorage } from "./DatabaseStorage";

export interface IStorage {
  // User related methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
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
  
  // Achievement methods removed
  
  // Interest related methods
  createInterest(interest: InsertInterest): Promise<Interest>;
  getAllInterests(): Promise<Interest[]>;
  
  // Meeting related methods
  getMeeting(id: number): Promise<Meeting | undefined>;
  getAllMeetings(limit?: number, offset?: number): Promise<Meeting[]>;
  getMeetingsByLocation(latitude: number, longitude: number, radiusInKm: number): Promise<Meeting[]>;
  createMeeting(meeting: InsertMeeting): Promise<Meeting>;
  updateMeeting(id: number, meeting: Partial<Meeting>): Promise<Meeting>;
  deleteMeeting(id: number): Promise<boolean>;
  
  // Meeting Attendee related methods
  getMeetingAttendees(meetingId: number): Promise<MeetingAttendee[]>;
  getUserMeetingAttendance(userId: number): Promise<MeetingAttendee[]>;
  attendMeeting(attendee: InsertMeetingAttendee): Promise<MeetingAttendee>;
  updateAttendanceStatus(meetingId: number, userId: number, status: string): Promise<MeetingAttendee>;
  checkInToMeeting(meetingId: number, userId: number): Promise<MeetingAttendee>;
  
  // Group Challenge related methods
  getGroupChallenge(id: number): Promise<GroupChallenge | undefined>;
  getActiveGroupChallenges(limit?: number, offset?: number): Promise<GroupChallenge[]>;
  getUserGroupChallenges(userId: number): Promise<GroupChallenge[]>;
  createGroupChallenge(challenge: InsertGroupChallenge): Promise<GroupChallenge>;
  updateGroupChallenge(id: number, challenge: Partial<GroupChallenge>): Promise<GroupChallenge>;
  
  // Group Challenge Participant related methods
  getGroupChallengeParticipants(groupChallengeId: number): Promise<GroupChallengeParticipant[]>;
  joinGroupChallenge(participant: InsertGroupChallengeParticipant): Promise<GroupChallengeParticipant>;
  updateGroupChallengeProgress(groupChallengeId: number, userId: number, stepsCompleted: number): Promise<GroupChallengeParticipant>;
  getGroupChallengeLeaderboard(groupChallengeId: number, limit?: number): Promise<GroupChallengeParticipant[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private matches: Map<number, Match>;
  private challenges: Map<number, Challenge>;
  private challengeProgresses: Map<string, ChallengeProgress>;
  private messages: Map<number, Message>;
  // achievements removed
  private interests: Map<number, Interest>;
  private meetings: Map<number, Meeting>;
  private meetingAttendees: Map<string, MeetingAttendee>;
  private groupChallenges: Map<number, GroupChallenge>;
  private groupChallengeParticipants: Map<string, GroupChallengeParticipant>;
  
  userIdCounter: number;
  matchIdCounter: number;
  challengeIdCounter: number;
  progressIdCounter: number;
  messageIdCounter: number;
  // achievementIdCounter removed
  interestIdCounter: number;
  meetingIdCounter: number;
  meetingAttendeeIdCounter: number;
  groupChallengeIdCounter: number;
  groupChallengeParticipantIdCounter: number;

  constructor() {
    this.users = new Map();
    this.matches = new Map();
    this.challenges = new Map();
    this.challengeProgresses = new Map();
    this.messages = new Map();
    // achievements removed
    this.interests = new Map();
    this.meetings = new Map();
    this.meetingAttendees = new Map();
    this.groupChallenges = new Map();
    this.groupChallengeParticipants = new Map();
    
    this.userIdCounter = 1;
    this.matchIdCounter = 1;
    this.challengeIdCounter = 1;
    this.progressIdCounter = 1;
    this.messageIdCounter = 1;
    // achievementIdCounter removed
    this.interestIdCounter = 1;
    this.meetingIdCounter = 1;
    this.meetingAttendeeIdCounter = 1;
    this.groupChallengeIdCounter = 1;
    this.groupChallengeParticipantIdCounter = 1;
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

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(userData: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    const user: User = { 
      username: userData.username,
      password: userData.password,
      displayName: userData.displayName,
      email: userData.email,
      bio: userData.bio ?? null,
      interests: userData.interests ?? null,
      goals: userData.goals ?? null,
      experiences: userData.experiences ?? null,
      profilePic: userData.profilePic ?? null,
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
    
    const updatedUser = { ...user, points: (user.points ?? 0) + points };
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
      userId1: matchData.userId1,
      userId2: matchData.userId2,
      matchScore: matchData.matchScore,
      status: matchData.status ?? 'pending',
      matchDetails: matchData.matchDetails ?? null,
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
      type: challengeData.type,
      matchId: challengeData.matchId,
      title: challengeData.title,
      description: challengeData.description,
      startDate: challengeData.startDate,
      endDate: challengeData.endDate,
      totalSteps: challengeData.totalSteps,
      status: challengeData.status ?? 'inactive',
      challengeType: challengeData.challengeType ?? 'unknown',
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
      challengeId: progressData.challengeId,
      userId: progressData.userId,
      stepsCompleted: progressData.stepsCompleted ?? null,
      lastCheckIn: progressData.lastCheckIn ?? null,
      currentStreak: progressData.currentStreak ?? null,
      longestStreak: progressData.longestStreak ?? null,
      daysSober: progressData.daysSober ?? null,
      lastSoberDate: progressData.lastSoberDate ?? null,
      additionalData: progressData.additionalData ?? null,
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
      .sort((a, b) => (a.sentAt?.getTime() ?? 0) - (b.sentAt?.getTime() ?? 0));
    
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
  
  // Achievement methods removed
  
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
  
  // ==========================
  // Meeting related methods
  // ==========================
  
  async getMeeting(id: number): Promise<Meeting | undefined> {
    return this.meetings.get(id);
  }
  
  async getAllMeetings(limit?: number, offset?: number): Promise<Meeting[]> {
    let meetings = Array.from(this.meetings.values());
    
    if (offset !== undefined) {
      meetings = meetings.slice(offset);
    }
    
    if (limit !== undefined) {
      meetings = meetings.slice(0, limit);
    }
    
    return meetings;
  }
  
  async getMeetingsByLocation(latitude: number, longitude: number, radiusInKm: number): Promise<Meeting[]> {
    // Calculate distance between two lat/lng points using the Haversine formula
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
      const R = 6371; // Radius of the Earth in km
      const dLat = (lat2 - lat1) * (Math.PI / 180);
      const dLon = (lon2 - lon1) * (Math.PI / 180);
      const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };
    
    return Array.from(this.meetings.values()).filter(meeting => {
      if (!meeting.latitude || !meeting.longitude) return false;
      
      const distance = calculateDistance(
        latitude,
        longitude,
        meeting.latitude,
        meeting.longitude
      );
      
      return distance <= radiusInKm;
    });
  }
  
  async createMeeting(meetingData: InsertMeeting): Promise<Meeting> {
    const id = this.meetingIdCounter++;
    const now = new Date();
    // Ensure all properties match the Meeting schema, providing defaults
    const meeting: Meeting = {
      name: meetingData.name, // Required
      meetingType: meetingData.meetingType, // Required
      city: meetingData.city, // Required
      country: meetingData.country, // Required
      description: meetingData.description ?? null, // Default undefined to null
      address: meetingData.address ?? null, // Default undefined to null
      latitude: meetingData.latitude ?? null, // Default undefined to null
      longitude: meetingData.longitude ?? null, // Default undefined to null
      startTime: meetingData.startTime, // Required
      endTime: meetingData.endTime, // Required
      frequency: meetingData.frequency ?? null, 
      createdBy: meetingData.createdBy ?? null, 
      state: meetingData.state ?? null, 
      id,
      createdAt: now, // Assume schema allows Date
      updatedAt: now // Assume schema allows Date
    };
    
    this.meetings.set(id, meeting);
    return meeting;
  }
  
  async updateMeeting(id: number, meetingData: Partial<Meeting>): Promise<Meeting> {
    const meeting = await this.getMeeting(id);
    if (!meeting) {
      throw new Error(`Meeting with id ${id} not found`);
    }
    
    const updatedMeeting = {
      ...meeting,
      ...meetingData,
      updatedAt: new Date()
    };
    
    this.meetings.set(id, updatedMeeting);
    return updatedMeeting;
  }
  
  async deleteMeeting(id: number): Promise<boolean> {
    const meeting = await this.getMeeting(id);
    if (!meeting) {
      return false;
    }
    
    // Delete attendees first
    Array.from(this.meetingAttendees.keys())
      .filter(key => key.startsWith(`${id}-`))
      .forEach(key => this.meetingAttendees.delete(key));
    
    // Then delete the meeting
    return this.meetings.delete(id);
  }
  
  // ==========================
  // Meeting Attendee related methods
  // ==========================
  
  async getMeetingAttendees(meetingId: number): Promise<MeetingAttendee[]> {
    return Array.from(this.meetingAttendees.values())
      .filter(attendee => attendee.meetingId === meetingId);
  }
  
  async getUserMeetingAttendance(userId: number): Promise<MeetingAttendee[]> {
    return Array.from(this.meetingAttendees.values())
      .filter(attendee => attendee.userId === userId);
  }
  
  async attendMeeting(attendeeData: InsertMeetingAttendee): Promise<MeetingAttendee> {
    const key = `${attendeeData.meetingId}-${attendeeData.userId}`;
    const existingAttendee = this.meetingAttendees.get(key);
    
    if (existingAttendee) {
      // Update existing attendance
      return this.updateAttendanceStatus(
        attendeeData.meetingId,
        attendeeData.userId,
        attendeeData.status || 'going'
      );
    }
    
    // Create new attendance
    const id = this.meetingAttendeeIdCounter++;
    const now = new Date();
    const attendee: MeetingAttendee = {
      userId: attendeeData.userId,
      meetingId: attendeeData.meetingId,
      status: attendeeData.status ?? 'going',
      checkedIn: attendeeData.checkedIn ?? null,
      checkInTime: attendeeData.checkInTime ?? null,
      reminderSet: attendeeData.reminderSet ?? null,
      notes: attendeeData.notes ?? null,
      id,
      createdAt: now
    };
    
    this.meetingAttendees.set(key, attendee);
    return attendee;
  }
  
  async updateAttendanceStatus(meetingId: number, userId: number, status: string): Promise<MeetingAttendee> {
    const key = `${meetingId}-${userId}`;
    const attendee = this.meetingAttendees.get(key);
    
    if (!attendee) {
      return this.attendMeeting({
        meetingId,
        userId,
        status
      });
    }
    
    const updatedAttendee = {
      ...attendee,
      status
    };
    
    this.meetingAttendees.set(key, updatedAttendee);
    return updatedAttendee;
  }
  
  async checkInToMeeting(meetingId: number, userId: number): Promise<MeetingAttendee> {
    const key = `${meetingId}-${userId}`;
    const attendee = this.meetingAttendees.get(key);
    
    if (!attendee) {
      return this.attendMeeting({
        meetingId,
        userId,
        status: 'going',
        checkedIn: true,
        checkInTime: new Date()
      });
    }
    
    const updatedAttendee = {
      ...attendee,
      checkedIn: true,
      checkInTime: new Date()
    };
    
    this.meetingAttendees.set(key, updatedAttendee);
    return updatedAttendee;
  }
  
  // ==========================
  // Group Challenge related methods
  // ==========================
  
  async getGroupChallenge(id: number): Promise<GroupChallenge | undefined> {
    return this.groupChallenges.get(id);
  }
  
  async getActiveGroupChallenges(limit?: number, offset?: number): Promise<GroupChallenge[]> {
    let challenges = Array.from(this.groupChallenges.values())
      .filter(challenge => challenge.status === 'active');
    
    if (offset !== undefined) {
      challenges = challenges.slice(offset);
    }
    
    if (limit !== undefined) {
      challenges = challenges.slice(0, limit);
    }
    
    return challenges;
  }
  
  async getUserGroupChallenges(userId: number): Promise<GroupChallenge[]> {
    // Get all participations for the user
    const participations = Array.from(this.groupChallengeParticipants.values())
      .filter(participant => participant.userId === userId);
    
    // If the user is not participating in any challenges, return empty array
    if (participations.length === 0) {
      return [];
    }
    
    // Extract the challenge IDs from the participations
    const challengeIds = participations.map(p => p.groupChallengeId);
    
    // Filter the actual group challenges based on those IDs
    return Array.from(this.groupChallenges.values())
      .filter(challenge => challengeIds.includes(challenge.id));
  }
  
  async createGroupChallenge(challengeData: InsertGroupChallenge): Promise<GroupChallenge> {
    const id = this.groupChallengeIdCounter++;
    const now = new Date();
    // Ensure all properties match the GroupChallenge schema, providing defaults
    const challenge: GroupChallenge = {
      title: challengeData.title, // Required
      description: challengeData.description, // Required
      startDate: challengeData.startDate, // Required
      endDate: challengeData.endDate, // Required
      totalSteps: challengeData.totalSteps, // Required
      category: challengeData.category, // Required
      // Provide default status if not in input and schema requires string
      status: challengeData.status ?? 'active', 
      // Provide default challengeType if not in input and schema requires string
      challengeType: challengeData.challengeType ?? 'unknown', 
      createdBy: challengeData.createdBy ?? null, // Default undefined to null
      maxParticipants: challengeData.maxParticipants ?? null, // Default undefined to null
      isPublic: challengeData.isPublic ?? true, // Default undefined to true (or false?)
      id,
      createdAt: now, // Assume schema allows Date
      updatedAt: now // Assume schema allows Date
    };
    
    this.groupChallenges.set(id, challenge);
    return challenge;
  }
  
  async updateGroupChallenge(id: number, challengeData: Partial<GroupChallenge>): Promise<GroupChallenge> {
    const challenge = await this.getGroupChallenge(id);
    if (!challenge) {
      throw new Error(`Group challenge with id ${id} not found`);
    }
    
    const updatedChallenge = {
      ...challenge,
      ...challengeData,
      updatedAt: new Date()
    };
    
    this.groupChallenges.set(id, updatedChallenge);
    return updatedChallenge;
  }
  
  // ==========================
  // Group Challenge Participant related methods
  // ==========================
  
  async getGroupChallengeParticipants(groupChallengeId: number): Promise<GroupChallengeParticipant[]> {
    return Array.from(this.groupChallengeParticipants.values())
      .filter(participant => participant.groupChallengeId === groupChallengeId);
  }
  
  async joinGroupChallenge(participantData: InsertGroupChallengeParticipant): Promise<GroupChallengeParticipant> {
    const key = `${participantData.groupChallengeId}-${participantData.userId}`;
    const existingParticipant = this.groupChallengeParticipants.get(key);
    
    if (existingParticipant) {
      // Update status if provided and different
      if (participantData.status && participantData.status !== existingParticipant.status) {
        const updatedParticipant = {
          ...existingParticipant,
          status: participantData.status
        };
        
        this.groupChallengeParticipants.set(key, updatedParticipant);
        return updatedParticipant;
      }
      
      return existingParticipant;
    }
    
    // Create new participation
    const id = this.groupChallengeParticipantIdCounter++;
    const now = new Date();
    const participant: GroupChallengeParticipant = {
      userId: participantData.userId,
      groupChallengeId: participantData.groupChallengeId,
      status: participantData.status ?? 'active',
      stepsCompleted: participantData.stepsCompleted ?? 0,
      pointsEarned: participantData.pointsEarned ?? 0,
      id,
      joinedAt: now,
      lastUpdated: now
    };
    
    this.groupChallengeParticipants.set(key, participant);
    return participant;
  }
  
  async updateGroupChallengeProgress(groupChallengeId: number, userId: number, stepsCompleted: number): Promise<GroupChallengeParticipant> {
    const key = `${groupChallengeId}-${userId}`;
    const participant = this.groupChallengeParticipants.get(key);
    
    if (!participant) {
      return this.joinGroupChallenge({
        groupChallengeId,
        userId,
        stepsCompleted,
        status: 'active'
      });
    }
    
    // Get challenge to calculate points
    const challenge = await this.getGroupChallenge(groupChallengeId);
    let pointsEarned = participant.pointsEarned || 0;
    
    if (challenge) {
      // Simple calculation: points based on percentage completion
      const progressPercentage = stepsCompleted / challenge.totalSteps;
      pointsEarned = Math.round(progressPercentage * 100);
    }
    
    const updatedParticipant = {
      ...participant,
      stepsCompleted,
      pointsEarned,
      lastUpdated: new Date()
    };
    
    this.groupChallengeParticipants.set(key, updatedParticipant);
    return updatedParticipant;
  }
  
  async getGroupChallengeLeaderboard(groupChallengeId: number, limit?: number): Promise<GroupChallengeParticipant[]> {
    let participants = Array.from(this.groupChallengeParticipants.values())
      .filter(participant => participant.groupChallengeId === groupChallengeId)
      .sort((a, b) => (b.pointsEarned || 0) - (a.pointsEarned || 0));
    
    if (limit !== undefined) {
      participants = participants.slice(0, limit);
    }
    
    return participants;
  }
  
  private toRad(value: number): number {
    return value * Math.PI / 180;
  }
}

// Use the database storage implementation
export const storage = new DatabaseStorage();
