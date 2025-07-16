import { pgTable, text, serial, timestamp, boolean, integer, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  isUser: boolean("is_user").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  mood: text("mood"),
  userName: text("user_name").notNull().default("Anonymous"),
});

export const userStats = pgTable("user_stats", {
  userName: varchar("user_name", { length: 255 }).primaryKey(),
  totalMessages: integer("total_messages").default(0),
  userMessages: integer("user_messages").default(0),
  aiResponses: integer("ai_responses").default(0),
  firstMessageAt: timestamp("first_message_at"),
  lastMessageAt: timestamp("last_message_at"),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  timestamp: true,
}).extend({
  userName: z.string().optional(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertUserStatsSchema = createInsertSchema(userStats).omit({
  lastUpdated: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type UserStats = typeof userStats.$inferSelect;
export type InsertUserStats = z.infer<typeof insertUserStatsSchema>;
