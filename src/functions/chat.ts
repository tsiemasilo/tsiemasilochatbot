import { Handler } from '@netlify/functions';
import { analyzeMood, generateResponse } from './services/openai';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { messages } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import ws from 'ws';

// Configure Neon for serverless
neonConfig.webSocketConstructor = ws;

// Use Netlify environment variables for database
const DATABASE_URL = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is not configured');
}

const pool = new Pool({ connectionString: DATABASE_URL });
const db = drizzle({ client: pool });

export const handler: Handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod === 'POST') {
    try {
      const body = JSON.parse(event.body || '{}');
      const { content, userName = 'Anonymous' } = body;

      if (!content) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Content is required' })
        };
      }

      // Store user message in database
      await db.insert(messages).values({
        content,
        isUser: true,
        userName,
        mood: 'neutral'
      });

      // Get conversation history for this user from database
      const userMessages = await db
        .select()
        .from(messages)
        .where(eq(messages.userName, userName))
        .orderBy(messages.timestamp)
        .limit(10);

      const conversationHistory = userMessages.map(msg => ({
        content: msg.content,
        isUser: msg.isUser
      }));

      // Generate AI response
      const moodAnalysis = await analyzeMood(content);
      const botResponse = await generateResponse(content, conversationHistory, moodAnalysis);

      // Store bot response in database
      await db.insert(messages).values({
        content: botResponse,
        isUser: false,
        userName: userName,
        mood: moodAnalysis.mood
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          response: botResponse,
          mood: moodAnalysis.mood
        })
      };
    } catch (error) {
      console.error('Chat error:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Internal server error' })
      };
    }
  }

  return {
    statusCode: 405,
    headers,
    body: JSON.stringify({ error: 'Method not allowed' })
  };
};