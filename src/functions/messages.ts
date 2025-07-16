import { Handler } from '@netlify/functions';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { eq, desc } from 'drizzle-orm';
import { messages, users } from '../../shared/schema';
import ws from "ws";

// Configure WebSocket for Neon
neonConfig.webSocketConstructor = ws;

// Database connection for Netlify - uses Replit environment variables
const PRODUCTION_DB_URL = "postgresql://neondb_owner:npg_E3Jn8cxsglWG@ep-round-brook-a5e3k093.us-east-2.aws.neon.tech/neondb?sslmode=require";
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL || PRODUCTION_DB_URL
});
const db = drizzle(pool, { schema: { messages, users } });

export const handler: Handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    let userName: string;

    // Handle both GET and POST requests
    if (event.httpMethod === 'GET') {
      // Extract userName from query parameters
      userName = event.queryStringParameters?.userName || 'Anonymous';
    } else if (event.httpMethod === 'POST') {
      // Extract userName from request body
      const body = JSON.parse(event.body || '{}');
      userName = body.userName || 'Anonymous';
    } else {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: 'Method not allowed' })
      };
    }

    console.log(`[Netlify Messages] Loading messages for user: ${userName}`);

    // Get or create user
    let user = await db.select().from(users).where(eq(users.username, userName)).limit(1);
    if (user.length === 0) {
      const newUser = await db.insert(users).values({
        username: userName,
        password: 'netlify-user'
      }).returning();
      user = newUser;
      
      // Add welcome message for new users
      await db.insert(messages).values({
        content: `Hey ${userName}! I'm Tsie Masilo Bot 👋 Let's chat!`,
        isUser: false,
        userName,
        timestamp: new Date(),
        mood: 'happy'
      });
    }

    // Get user's message history
    const userMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.userName, userName))
      .orderBy(desc(messages.timestamp))
      .limit(100);

    // Return messages in chronological order
    const sortedMessages = userMessages.reverse();
    
    console.log(`[Netlify Messages] Retrieved ${sortedMessages.length} messages for ${userName}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(sortedMessages)
    };

  } catch (error) {
    console.error('[Netlify Messages] Error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};