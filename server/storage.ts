/**
 * Storage Interface and Implementations
 * 
 * This file defines the storage abstraction layer for the chat application.
 * It provides both in-memory and database storage implementations to handle
 * user data and chat messages with flexibility between development and production.
 */

import { users, messages, type User, type InsertUser, type Message, type InsertMessage } from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, ne } from "drizzle-orm";

/**
 * Storage interface defining the contract for data operations
 * This abstraction allows switching between different storage implementations
 */
export interface IStorage {
  // User management operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Message operations for chat functionality - now user-specific
  getMessages(userName: string, limit?: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  clearMessages(): Promise<void>;
  
  // Admin operations for dashboard
  getContacts(): Promise<{userName: string, lastMessage: string, lastActivity: Date, messageCount: number}[]>;
  getMessagesByUser(userName: string): Promise<Message[]>;
}

/**
 * In-Memory Storage Implementation
 * 
 * This implementation stores all data in memory using Maps.
 * Useful for development and testing, but data is lost on server restart.
 */
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private messages: Map<number, Message>;
  private currentUserId: number;
  private currentMessageId: number;

  constructor() {
    // Initialize in-memory storage collections
    this.users = new Map();
    this.messages = new Map();
    this.currentUserId = 1;
    this.currentMessageId = 1;
  }

  /**
   * Add a welcome message for a specific user
   * This provides a friendly introduction to new users
   */
  private addWelcomeMessageForUser(userName: string) {
    const welcomeMessage: Message = {
      id: this.currentMessageId++,
      content: `Hey ${userName}! I'm Tsie Masilo Bot 👋 Let's chat!`,
      isUser: false,
      timestamp: new Date(),
      mood: null,
      userName: userName
    };
    this.messages.set(welcomeMessage.id, welcomeMessage);
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getMessages(userName: string, limit: number = 100): Promise<Message[]> {
    const messageArray = Array.from(this.messages.values());
    const userMessages = messageArray.filter(msg => msg.userName === userName);
    
    // If user has no messages, add welcome message
    if (userMessages.length === 0) {
      this.addWelcomeMessageForUser(userName);
      return Array.from(this.messages.values())
        .filter(msg => msg.userName === userName)
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
        .slice(-limit);
    }
    
    return userMessages
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
      .slice(-limit);
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.currentMessageId++;
    const message: Message = {
      id,
      ...insertMessage,
      timestamp: new Date(),
      mood: insertMessage.mood || null,
      userName: insertMessage.userName || "Anonymous",
    };
    this.messages.set(id, message);
    return message;
  }

  async clearMessages(): Promise<void> {
    this.messages.clear();
  }

  async getContacts(): Promise<{userName: string, lastMessage: string, lastActivity: Date, messageCount: number}[]> {
    const userMessages = new Map<string, Message[]>();
    
    // Group messages by user
    Array.from(this.messages.values()).forEach(message => {
      if (!userMessages.has(message.userName)) {
        userMessages.set(message.userName, []);
      }
      userMessages.get(message.userName)!.push(message);
    });
    
    const contacts: {userName: string, lastMessage: string, lastActivity: Date, messageCount: number}[] = [];
    Array.from(userMessages.entries()).forEach(([userName, messages]) => {
      if (userName !== "System") {
        const sortedMessages = messages.sort((a: Message, b: Message) => b.timestamp.getTime() - a.timestamp.getTime());
        contacts.push({
          userName,
          lastMessage: sortedMessages[0]?.content || "",
          lastActivity: sortedMessages[0]?.timestamp || new Date(),
          messageCount: messages.length
        });
      }
    });
    
    return contacts.sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());
  }

  async getMessagesByUser(userName: string): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(message => message.userName === userName)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }
}

/**
 * Database Storage Implementation
 * 
 * This implementation uses PostgreSQL via Drizzle ORM for persistent storage.
 * All data is stored in the database and survives server restarts.
 * Perfect for production environments where data persistence is required.
 */
export class DatabaseStorage implements IStorage {
  constructor() {
    // Ensure the database has a welcome message for new users
    this.ensureWelcomeMessage();
  }

  /**
   * Ensure there's a welcome message in the database
   * This runs on initialization to provide a friendly introduction
   */
  private async ensureWelcomeMessage() {
    try {
      // Check if any messages exist in the database
      const existingMessages = await db.select().from(messages).limit(1);
      
      if (existingMessages.length === 0) {
        // Add initial welcome message if database is empty
        await db.insert(messages).values({
          content: "Hey! I'm Tsie Masilo Bot 👋 Let's chat!",
          isUser: false,
          userName: "System",
          timestamp: new Date(),
          mood: null
        });
      }
    } catch (error) {
      console.error('Error ensuring welcome message:', error);
    }
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getMessages(userName: string, limit: number = 100): Promise<Message[]> {
    const result = await db
      .select()
      .from(messages)
      .where(eq(messages.userName, userName))
      .orderBy(desc(messages.timestamp))
      .limit(limit);
    
    // If user has no messages, add welcome message
    if (result.length === 0) {
      await db.insert(messages).values({
        content: `Hey ${userName}! I'm Tsie Masilo Bot 👋 Let's chat!`,
        isUser: false,
        userName: userName,
        timestamp: new Date(),
        mood: null
      });
      
      // Fetch the welcome message we just created
      const welcomeResult = await db
        .select()
        .from(messages)
        .where(eq(messages.userName, userName))
        .orderBy(desc(messages.timestamp))
        .limit(1);
      
      return welcomeResult;
    }
    
    return result.reverse(); // Return in chronological order
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values(insertMessage)
      .returning();
    return message;
  }

  async clearMessages(): Promise<void> {
    await db.delete(messages);
  }

  async getContacts(): Promise<{userName: string, lastMessage: string, lastActivity: Date, messageCount: number}[]> {
    const result = await db
      .select({
        userName: messages.userName,
        content: messages.content,
        timestamp: messages.timestamp,
        id: messages.id
      })
      .from(messages)
      .where(ne(messages.userName, "System"))
      .orderBy(desc(messages.timestamp));
    
    const userMessages = new Map<string, {content: string, timestamp: Date}[]>();
    
    // Group messages by user
    result.forEach(message => {
      if (!userMessages.has(message.userName)) {
        userMessages.set(message.userName, []);
      }
      userMessages.get(message.userName)!.push({
        content: message.content,
        timestamp: message.timestamp
      });
    });
    
    const contacts: {userName: string, lastMessage: string, lastActivity: Date, messageCount: number}[] = [];
    Array.from(userMessages.entries()).forEach(([userName, messages]) => {
      const sortedMessages = messages.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      contacts.push({
        userName,
        lastMessage: sortedMessages[0]?.content || "",
        lastActivity: sortedMessages[0]?.timestamp || new Date(),
        messageCount: messages.length
      });
    });
    
    return contacts.sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());
  }

  async getMessagesByUser(userName: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.userName, userName))
      .orderBy(asc(messages.timestamp));
  }
}

// Use DatabaseStorage instead of MemStorage
export const storage = new DatabaseStorage();
