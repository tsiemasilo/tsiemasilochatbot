import { Handler } from '@netlify/functions';
import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { eq, desc, sql } from 'drizzle-orm';
import { messages, users } from '../../shared/schema';

// Database connection for Netlify - uses secure vault
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL
});
const db = drizzle(pool);

export const handler: Handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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
    console.log(`[Netlify Admin] ${event.httpMethod} request to ${event.path}`);

    // Handle admin contacts request
    if (event.httpMethod === 'GET') {
      console.log('[Netlify Admin] Fetching admin contacts');
      
      // Get all unique users and their latest activity
      const allMessages = await db
        .select()
        .from(messages)
        .orderBy(desc(messages.timestamp));

      // Group messages by user
      const userActivity = new Map<string, {
        lastMessage: string;
        lastActivity: Date;
        messageCount: number;
      }>();

      allMessages.forEach(msg => {
        const userName = msg.userName;
        if (!userActivity.has(userName)) {
          userActivity.set(userName, {
            lastMessage: msg.content,
            lastActivity: msg.timestamp,
            messageCount: 1
          });
        } else {
          const activity = userActivity.get(userName)!;
          activity.messageCount++;
          // Keep the latest message and activity
          if (msg.timestamp > activity.lastActivity) {
            activity.lastMessage = msg.content;
            activity.lastActivity = msg.timestamp;
          }
        }
      });

      // Convert to array format
      const contacts = Array.from(userActivity.entries()).map(([userName, activity]) => ({
        userName,
        lastMessage: activity.lastMessage,
        lastActivity: activity.lastActivity,
        messageCount: activity.messageCount
      }));

      // Sort by last activity (most recent first)
      contacts.sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());

      console.log(`[Netlify Admin] Found ${contacts.length} contacts`);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(contacts)
      };
    }

    // Handle admin authentication
    if (event.httpMethod === 'POST') {
      const { adminCode } = JSON.parse(event.body || '{}');
      
      console.log(`[Netlify Admin] Authentication attempt with code: ${adminCode}`);
      
      if (adminCode === 'secretadminspy') {
        console.log('[Netlify Admin] Authentication successful');
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ 
            success: true,
            message: 'Admin access granted'
          })
        };
      } else {
        console.log('[Netlify Admin] Authentication failed');
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ 
            success: false,
            message: 'Invalid admin code'
          })
        };
      }
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };

  } catch (error) {
    console.error('[Netlify Admin] Error:', error);
    
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