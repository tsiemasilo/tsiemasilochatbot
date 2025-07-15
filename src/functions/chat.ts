import { Handler } from '@netlify/functions';
import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { eq, desc } from 'drizzle-orm';
import { messages, users } from '../../shared/schema';
import { analyzeMood, generateResponse } from './services/openai';

// Database connection for Netlify
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL
});
const db = drizzle(pool);

export const handler: Handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

  // Only allow POST method
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Parse request body
    const { content, userName } = JSON.parse(event.body || '{}');
    
    if (!content || !userName) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing content or userName' })
      };
    }

    console.log(`[Netlify Chat] Processing message from ${userName}: "${content}"`);

    // Get or create user
    let user = await db.select().from(users).where(eq(users.username, userName)).limit(1);
    if (user.length === 0) {
      const newUser = await db.insert(users).values({
        username: userName,
        password: 'netlify-user'
      }).returning();
      user = newUser;
    }

    // Save user message to database
    await db.insert(messages).values({
      content,
      isUser: true,
      userName,
      timestamp: new Date()
    });

    // Get recent conversation history for context
    const messageHistory = await db
      .select()
      .from(messages)
      .where(eq(messages.userName, userName))
      .orderBy(desc(messages.timestamp))
      .limit(20);

    // Reverse to get chronological order
    const conversationHistory = messageHistory.reverse();

    // Analyze user mood
    const mood = await analyzeMood(content);
    console.log(`[Netlify Chat] Mood analysis: ${mood.mood} (${mood.confidence})`);

    // Generate AI response
    const aiResponse = await generateResponse(
      content,
      userName,
      conversationHistory,
      mood
    );

    // Save bot response to database
    await db.insert(messages).values({
      content: aiResponse,
      isUser: false,
      userName,
      timestamp: new Date(),
      mood: mood.mood
    });

    console.log(`[Netlify Chat] Generated response: "${aiResponse}"`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        response: aiResponse,
        mood: mood.mood,
        confidence: mood.confidence,
        suggestedEmojis: mood.suggestedEmojis
      })
    };

  } catch (error) {
    console.error('[Netlify Chat] Error:', error);
    
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