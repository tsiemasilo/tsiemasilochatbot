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
      let botResponse = "I'm having trouble connecting to my AI services right now. Please try again later.";
      let moodAnalysis = { mood: 'neutral' as const, confidence: 0.5, suggestedEmojis: ['😊'] };
      
      try {
        // Check if OpenAI API key is available
        if (process.env.OPENAI_API_KEY || process.env.API_KEY) {
          moodAnalysis = await analyzeMood(content);
          botResponse = await generateResponse(content, conversationHistory, moodAnalysis);
        } else {
          // Fallback response when no API key is available
          botResponse = `Hi ${userName}! I received your message: "${content}". I'm currently experiencing some technical difficulties with my AI services. Please make sure the OPENAI_API_KEY is configured in the Netlify environment variables. You can find this in your Netlify dashboard under Site settings > Environment variables.`;
        }
      } catch (error) {
        console.error('AI Generation Error:', error);
        botResponse = `Hello ${userName}! I received your message, but I'm having trouble with my AI services right now. Error: ${error.message}. Please ensure the OPENAI_API_KEY is properly configured.`;
      }

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