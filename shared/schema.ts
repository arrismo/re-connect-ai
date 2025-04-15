import { pgTable, text, serial, integer, boolean, timestamp, jsonb, foreignKey, unique, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// ========== USER SCHEMA ==========
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name").notNull(),
  email: text("email").notNull().unique(),
  bio: text("bio"),
  interests: text("interests").array(),
  goals: text("goals").array(),
  experiences: text("experiences").array(),
  profilePic: text("profile_pic"),
  points: integer("points").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  lastActive: timestamp("last_active").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  points: true,
  createdAt: true,
  lastActive: true,
});

// ========== MATCH SCHEMA ==========
export const matches = pgTable("matches", {
  id: serial("id").primaryKey(),
  userId1: integer("user_id_1").notNull().references(() => users.id),
  userId2: integer("user_id_2").notNull().references(() => users.id),
  matchScore: integer("match_score").notNull(),
  matchDetails: jsonb("match_details"),
  status: text("status").notNull().default("pending"), // pending, active, rejected, ended, completed
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertMatchSchema = createInsertSchema(matches).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// ========== CHALLENGE SCHEMA ==========
export const challenges = pgTable("challenges", {
  id: serial("id").primaryKey(),
  matchId: integer("match_id").notNull().references(() => matches.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(), // daily, weekly, one-time
  challengeType: text("challenge_type").notNull().default("generic"), // generic, days_sober, check_in_streak
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  totalSteps: integer("total_steps").notNull(),
  status: text("status").notNull().default("active"), // active, completed, failed
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertChallengeSchema = createInsertSchema(challenges).omit({
  id: true,
  createdAt: true,
});

// ========== CHALLENGE PROGRESS SCHEMA ==========
export const challengeProgresses = pgTable("challenge_progresses", {
  id: serial("id").primaryKey(),
  challengeId: integer("challenge_id").notNull().references(() => challenges.id),
  userId: integer("user_id").notNull().references(() => users.id),
  stepsCompleted: integer("steps_completed").default(0),
  lastUpdated: timestamp("last_updated").defaultNow(),
  lastCheckIn: timestamp("last_check_in"),
  currentStreak: integer("current_streak").default(0),
  longestStreak: integer("longest_streak").default(0),
  daysSober: integer("days_sober").default(0),
  lastSoberDate: timestamp("last_sober_date"),
  additionalData: jsonb("additional_data"),
}, (table) => {
  return {
    uniqueUserChallenge: unique().on(table.challengeId, table.userId)
  };
});

export const insertChallengeProgressSchema = createInsertSchema(challengeProgresses).omit({
  id: true,
  lastUpdated: true,
});

// ========== MESSAGE SCHEMA ==========
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  matchId: integer("match_id").notNull().references(() => matches.id),
  senderId: integer("sender_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  sentAt: timestamp("sent_at").defaultNow(),
  isRead: boolean("is_read").default(false),
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  sentAt: true,
  isRead: true,
});

// ========== INTEREST SCHEMA ==========
export const interests = pgTable("interests", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  category: text("category").notNull(),
});

export const insertInterestSchema = createInsertSchema(interests).omit({
  id: true,
});

// ========== MEETINGS SCHEMA ==========
export const meetings = pgTable("meetings", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  meetingType: text("meeting_type").notNull(), // aa, na, smart_recovery, other
  address: text("address"),
  city: text("city").notNull(),
  state: text("state"),
  zipCode: text("zip_code"),
  country: text("country").notNull(),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  dayOfWeek: integer("day_of_week"), // 0 (Sunday) to 6 (Saturday)
  startTime: text("start_time"), // format: "HH:MM"
  endTime: text("end_time"),   // format: "HH:MM"
  isRecurring: boolean("is_recurring").default(true),
  frequency: text("frequency").default("weekly"), // daily, weekly, monthly
  contactPhone: text("contact_phone"),
  contactEmail: text("contact_email"),
  website: text("website"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertMeetingSchema = createInsertSchema(meetings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// ========== MEETING ATTENDEES SCHEMA ==========
export const meetingAttendees = pgTable("meeting_attendees", {
  id: serial("id").primaryKey(),
  meetingId: integer("meeting_id").notNull().references(() => meetings.id),
  userId: integer("user_id").notNull().references(() => users.id),
  status: text("status").notNull().default("going"), // going, interested, not_going
  checkedIn: boolean("checked_in").default(false),
  checkInTime: timestamp("check_in_time"),
  reminderSet: boolean("reminder_set").default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => {
  return {
    uniqueUserMeeting: unique().on(table.meetingId, table.userId)
  };
});

export const insertMeetingAttendeeSchema = createInsertSchema(meetingAttendees).omit({
  id: true,
  createdAt: true,
});

// ========== GROUP CHALLENGES SCHEMA ==========
export const groupChallenges = pgTable("group_challenges", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // wellness, sobriety, mindfulness, social, fitness
  challengeType: text("challenge_type").notNull().default("group"), // group, community
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  totalSteps: integer("total_steps").notNull(),
  maxParticipants: integer("max_participants"),
  isPublic: boolean("is_public").default(true),
  createdBy: integer("created_by").references(() => users.id),
  status: text("status").notNull().default("active"), // active, completed, cancelled
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertGroupChallengeSchema = createInsertSchema(groupChallenges).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// ========== GROUP CHALLENGE PARTICIPANTS SCHEMA ==========
export const groupChallengeParticipants = pgTable("group_challenge_participants", {
  id: serial("id").primaryKey(),
  groupChallengeId: integer("group_challenge_id").notNull().references(() => groupChallenges.id),
  userId: integer("user_id").notNull().references(() => users.id),
  joinedAt: timestamp("joined_at").defaultNow(),
  stepsCompleted: integer("steps_completed").default(0),
  pointsEarned: integer("points_earned").default(0),
  lastUpdated: timestamp("last_updated").defaultNow(),
  status: text("status").notNull().default("active"), // active, completed, dropped
}, (table) => {
  return {
    uniqueUserGroupChallenge: unique().on(table.groupChallengeId, table.userId)
  };
});

export const insertGroupChallengeParticipantSchema = createInsertSchema(groupChallengeParticipants).omit({
  id: true,
  joinedAt: true,
  lastUpdated: true,
});

// ========== ACHIEVEMENTS REMOVED ==========

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  sentMatches: many(matches, { relationName: "user1_matches" }),
  receivedMatches: many(matches, { relationName: "user2_matches" }),
  challengeProgresses: many(challengeProgresses),
  messages: many(messages),
  meetingAttendances: many(meetingAttendees),
  groupChallengeParticipations: many(groupChallengeParticipants),
  createdMeetings: many(meetings, { relationName: "meeting_creator" }),
  createdGroupChallenges: many(groupChallenges, { relationName: "group_challenge_creator" })
}));

export const matchesRelations = relations(matches, ({ one, many }) => ({
  user1: one(users, {
    fields: [matches.userId1],
    references: [users.id],
    relationName: "user1_matches"
  }),
  user2: one(users, {
    fields: [matches.userId2],
    references: [users.id],
    relationName: "user2_matches"
  }),
  challenges: many(challenges),
  messages: many(messages)
}));

export const challengesRelations = relations(challenges, ({ one, many }) => ({
  match: one(matches, {
    fields: [challenges.matchId],
    references: [matches.id]
  }),
  progressRecords: many(challengeProgresses)
}));

export const challengeProgressesRelations = relations(challengeProgresses, ({ one }) => ({
  challenge: one(challenges, {
    fields: [challengeProgresses.challengeId],
    references: [challenges.id]
  }),
  user: one(users, {
    fields: [challengeProgresses.userId],
    references: [users.id]
  })
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  match: one(matches, {
    fields: [messages.matchId],
    references: [matches.id]
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id]
  })
}));

// Meetings and Group Challenges Relations
export const meetingsRelations = relations(meetings, ({ one, many }) => ({
  creator: one(users, {
    fields: [meetings.createdBy],
    references: [users.id],
    relationName: "meeting_creator"
  }),
  attendees: many(meetingAttendees)
}));

export const meetingAttendeesRelations = relations(meetingAttendees, ({ one }) => ({
  meeting: one(meetings, {
    fields: [meetingAttendees.meetingId],
    references: [meetings.id]
  }),
  user: one(users, {
    fields: [meetingAttendees.userId],
    references: [users.id]
  })
}));

export const groupChallengesRelations = relations(groupChallenges, ({ one, many }) => ({
  creator: one(users, {
    fields: [groupChallenges.createdBy],
    references: [users.id],
    relationName: "group_challenge_creator"
  }),
  participants: many(groupChallengeParticipants)
}));

export const groupChallengeParticipantsRelations = relations(groupChallengeParticipants, ({ one }) => ({
  groupChallenge: one(groupChallenges, {
    fields: [groupChallengeParticipants.groupChallengeId],
    references: [groupChallenges.id]
  }),
  user: one(users, {
    fields: [groupChallengeParticipants.userId],
    references: [users.id]
  })
}));

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Match = typeof matches.$inferSelect;
export type InsertMatch = z.infer<typeof insertMatchSchema>;

export type Challenge = typeof challenges.$inferSelect;
export type InsertChallenge = z.infer<typeof insertChallengeSchema>;

export type ChallengeProgress = typeof challengeProgresses.$inferSelect;
export type InsertChallengeProgress = z.infer<typeof insertChallengeProgressSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type Interest = typeof interests.$inferSelect;
export type InsertInterest = z.infer<typeof insertInterestSchema>;

export type Meeting = typeof meetings.$inferSelect;
export type InsertMeeting = z.infer<typeof insertMeetingSchema>;

export type MeetingAttendee = typeof meetingAttendees.$inferSelect;
export type InsertMeetingAttendee = z.infer<typeof insertMeetingAttendeeSchema>;

export type GroupChallenge = typeof groupChallenges.$inferSelect;
export type InsertGroupChallenge = z.infer<typeof insertGroupChallengeSchema>;

export type GroupChallengeParticipant = typeof groupChallengeParticipants.$inferSelect;
export type InsertGroupChallengeParticipant = z.infer<typeof insertGroupChallengeParticipantSchema>;

// Achievement types removed
