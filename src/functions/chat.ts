import { Handler } from '@netlify/functions';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { eq, desc } from 'drizzle-orm';
import { messages, users } from '../../shared/schema';
import OpenAI from "openai";
import ws from "ws";

// Configure WebSocket for Neon
neonConfig.webSocketConstructor = ws;

// OpenAI service embedded directly in function
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const DEFAULT_MODEL = "gpt-4o";

interface MoodAnalysis {
  mood: 'happy' | 'sad' | 'excited' | 'anxious' | 'neutral' | 'angry' | 'confused' | 'supportive';
  confidence: number;
  suggestedEmojis: string[];
}

interface EngagementAnalysis {
  level: 'low' | 'medium' | 'high';
  messageLength: 'short' | 'medium' | 'long';
  responseStyle: 'concise' | 'balanced' | 'detailed';
  conversationDepth: number;
}

async function analyzeMood(message: string): Promise<MoodAnalysis> {
  try {
    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        {
          role: "system",
          content: `You are a mood analysis expert. Analyze the emotional tone and sentiment of the user's message. 
          Respond with JSON in this exact format: {
            "mood": "happy|sad|excited|anxious|neutral|angry|confused|supportive",
            "confidence": 0.95,
            "suggestedEmojis": ["😊", "👍", "🎉"]
          }`
        },
        {
          role: "user",
          content: message
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 200
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      mood: result.mood || 'neutral',
      confidence: Math.max(0, Math.min(1, result.confidence || 0.5)),
      suggestedEmojis: result.suggestedEmojis || ['😊']
    };
  } catch (error) {
    console.error('Error analyzing mood:', error);
    return {
      mood: 'neutral',
      confidence: 0.5,
      suggestedEmojis: ['😊']
    };
  }
}

function analyzeEngagement(
  messageHistory: Array<{ content: string; isUser: boolean; timestamp: Date }>,
  currentMessage: string
): EngagementAnalysis {
  const userMessages = messageHistory.filter(msg => msg.isUser);
  const avgMessageLength = userMessages.reduce((sum, msg) => sum + msg.content.length, 0) / (userMessages.length || 1);
  const currentMessageLength = currentMessage.length;
  
  let level: 'low' | 'medium' | 'high' = 'medium';
  if (userMessages.length > 10 && avgMessageLength > 50) {
    level = 'high';
  } else if (userMessages.length < 3 || avgMessageLength < 20) {
    level = 'low';
  }

  let messageLength: 'short' | 'medium' | 'long' = 'medium';
  if (currentMessageLength < 30) {
    messageLength = 'short';
  } else if (currentMessageLength > 100) {
    messageLength = 'long';
  }

  const responseStyle: 'concise' | 'balanced' | 'detailed' = 
    level === 'high' ? 'detailed' : 
    level === 'low' ? 'concise' : 'balanced';

  return {
    level,
    messageLength,
    responseStyle,
    conversationDepth: userMessages.length
  };
}

async function generateResponse(
  message: string,
  userName: string,
  conversationHistory: Array<{ content: string; isUser: boolean; timestamp: Date }>,
  userMood: MoodAnalysis
): Promise<string> {
  try {
    const engagement = analyzeEngagement(conversationHistory, message);
    const moodContext = getMoodContext(userMood.mood);
    const responseGuidelines = getResponseGuidelines(engagement);
    const maxTokens = getMaxTokens(engagement);

    const systemPrompt = `You are Tsie Masilo Bot, representing Tsie Masilo - a 25-year-old QA Analyst/Junior Software Developer from Bedfordview, South Africa (born June 21, 1999).

Current user: ${userName}
User's current mood: ${userMood.mood} (confidence: ${userMood.confidence})
${moodContext}

Conversation guidelines:
${responseGuidelines}

## About Tsie:
**Current Role**: QA Analyst/Junior Software Developer (works in Midrand)
**Trading Background**: Started in 2019, passed 6-7 funded challenges using ICT, Smart Money, and Supply & Demand concepts
**Girlfriend**: Al
**Favorite Car**: BMW M4 (loves watching POV videos)
**Hobbies**: Gaming (Call of Duty Warzone - planning to stream on TikTok), soccer practice, trading & chart analysis
**Content Creation**: YouTube channel "Unheard Archives" (truth-seeking, exposing scams, historical breakdowns)
**Passion Projects**: Testing and building AI bots, automations, and tools; learning new frameworks

## Life Goals:
- Make $10K/month
- Own dream car (BMW M4), dream wife with 3 kids, luxury estate
- Financial freedom and business ownership
- Build IT agency with monthly retainer websites
- Launch AI-powered booking and business automation solutions

## Values & Mindset:
- Problem-first thinking: Define the issue clearly before acting
- Love solving problems that actually help people
- Learn by doing - don't wait to be taught
- Everything must have real-world value
- "I've been trading since 2019" and "I help people, but I also protect my time"

## Personality & Speech:
- Energetic, confident, casual but relatable tone
- Mix professional knowledge with street-smart lingo
- Keep it real - not too serious, but not a clown
- Use phrases like "That's mdubulo" (meaning fake/dodgy)
- "Hit me up if you're keen for a drink, I'm always down" 🍻
- "Don't waste time — execute, learn, and level up"
- Talk like a close friend - casual, relaxed, and real

Respond naturally to their message, keeping the conversation flowing smoothly.`;

    const historyMessages = conversationHistory.slice(-10).map(msg => ({
      role: msg.isUser ? 'user' as const : 'assistant' as const,
      content: msg.content
    }));

    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        ...historyMessages,
        { role: 'user', content: message }
      ],
      max_tokens: maxTokens,
      temperature: 0.7,
      presence_penalty: 0.1,
      frequency_penalty: 0.1
    });

    return response.choices[0].message.content || "I'm here to help! How can I assist you today?";
  } catch (error) {
    console.error('Error generating response:', error);
    return "I apologize, but I'm having trouble processing your message right now. Please try again in a moment.";
  }
}

function getMoodContext(mood: string): string {
  const contexts = {
    happy: "The user seems happy and upbeat. Match their positive energy while being helpful.",
    sad: "The user appears to be feeling down. Be extra supportive and gentle in your response.",
    excited: "The user is excited! Share in their enthusiasm while staying helpful.",
    anxious: "The user seems anxious or worried. Be calm, reassuring, and supportive.",
    angry: "The user appears frustrated or angry. Stay calm, acknowledge their feelings, and be helpful.",
    confused: "The user seems confused or unclear. Be patient and provide clear, step-by-step guidance.",
    supportive: "The user is being supportive. Acknowledge their kindness and reciprocate appropriately.",
    neutral: "The user has a neutral tone. Maintain a friendly, helpful demeanor."
  };
  return contexts[mood] || contexts.neutral;
}

function getResponseGuidelines(engagement: EngagementAnalysis): string {
  const guidelines = {
    concise: "Keep responses brief and to the point. User prefers shorter interactions.",
    balanced: "Provide thoughtful responses with good detail. User engages well with moderate-length replies.",
    detailed: "User is highly engaged. Provide comprehensive, detailed responses with examples when helpful."
  };
  return guidelines[engagement.responseStyle];
}

function getMaxTokens(engagement: EngagementAnalysis): number {
  const tokenLimits = {
    concise: 150,
    balanced: 300,
    detailed: 500
  };
  return tokenLimits[engagement.responseStyle];
}

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
    const { content, userName, type } = JSON.parse(event.body || '{}');
    
    if (!content || !userName) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing content or userName' })
      };
    }

    console.log(`[Netlify Chat] Processing message from ${userName}: "${content}" (type: ${type})`);

    // Get or create user
    let user = await db.select().from(users).where(eq(users.username, userName)).limit(1);
    if (user.length === 0) {
      const newUser = await db.insert(users).values({
        username: userName,
        password: 'netlify-user'
      }).returning();
      user = newUser;
    }

    // Handle voice_note type differently - store but don't generate AI response
    if (type === 'voice_note') {
      console.log('=== VOICE NOTE RECEIVED ===');
      console.log('Voice note content:', content);
      console.log('Voice note userName:', userName);
      
      // Store voice note display message but don't trigger AI response
      await db.insert(messages).values({
        content,
        isUser: true,
        userName,
        timestamp: new Date()
      });
      
      console.log('✓ Voice note stored successfully');
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          message: 'Voice note stored successfully',
          type: 'voice_note'
        })
      };
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