/**
 * Database Schema Definitions
 * 
 * This module defines the database schema using Drizzle ORM for type-safe database operations.
 * It includes all table definitions, validation schemas, and TypeScript types for the application.
 */

import { pgTable, text, serial, timestamp, boolean, integer, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

/**
 * Users table definition
 * Stores user authentication information for the chat application
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

/**
 * Messages table definition
 * Stores all chat messages with AI responses, user identification, and mood analysis
 */
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  isUser: boolean("is_user").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  mood: text("mood"), // AI-analyzed mood of the message
  userName: text("user_name").notNull().default("Anonymous"), // User-specific conversation tracking
});

/**
 * User statistics table definition
 * Tracks user engagement metrics and conversation analytics
 */
export const userStats = pgTable("user_stats", {
  userName: varchar("user_name", { length: 255 }).primaryKey(),
  totalMessages: integer("total_messages").default(0), // Total messages in conversation
  userMessages: integer("user_messages").default(0), // Messages sent by user
  aiResponses: integer("ai_responses").default(0), // AI responses generated
  firstMessageAt: timestamp("first_message_at"), // First interaction timestamp
  lastMessageAt: timestamp("last_message_at"), // Most recent activity
  lastUpdated: timestamp("last_updated").defaultNow(), // Statistics update timestamp
});

// Validation schemas for data insertion operations
// These schemas ensure data integrity and provide type safety

/**
 * Message insertion schema with validation
 * Excludes auto-generated fields (id, timestamp) and validates user input
 */
export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  timestamp: true,
}).extend({
  userName: z.string().optional(),
});

/**
 * User registration schema with validation
 * Ensures proper username and password format
 */
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

/**
 * User statistics insertion schema
 * Excludes auto-updated timestamp field
 */
export const insertUserStatsSchema = createInsertSchema(userStats).omit({
  lastUpdated: true,
});

// TypeScript type definitions for compile-time type checking
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type UserStats = typeof userStats.$inferSelect;
export type InsertUserStats = z.infer<typeof insertUserStatsSchema>;
