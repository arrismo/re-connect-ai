import { pgTable, text, serial, integer, boolean, timestamp, jsonb, foreignKey, unique } from "drizzle-orm/pg-core";
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
  status: text("status").notNull().default("pending"), // pending, active, rejected, completed
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

// ========== ACHIEVEMENT SCHEMA ==========
export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: text("type").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  points: integer("points").notNull(),
  earnedAt: timestamp("earned_at").defaultNow(),
});

export const insertAchievementSchema = createInsertSchema(achievements).omit({
  id: true,
  earnedAt: true,
});

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  sentMatches: many(matches, { relationName: "user1_matches" }),
  receivedMatches: many(matches, { relationName: "user2_matches" }),
  challengeProgresses: many(challengeProgresses),
  messages: many(messages),
  achievements: many(achievements)
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

export const achievementsRelations = relations(achievements, ({ one }) => ({
  user: one(users, {
    fields: [achievements.userId],
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

export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
