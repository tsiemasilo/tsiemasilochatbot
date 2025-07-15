import { Handler } from '@netlify/functions';
import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { eq, desc } from 'drizzle-orm';
import { messages } from '../../shared/schema';

// Database connection for Netlify
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL
});
const db = drizzle(pool);

export const handler: Handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
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

  // Only allow GET method
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Extract userName from query parameters or path
    let userName: string;
    
    if (event.queryStringParameters?.userName) {
      userName = event.queryStringParameters.userName;
    } else {
      const pathSegments = event.path.split('/');
      userName = pathSegments[pathSegments.length - 1];
    }

    if (!userName || userName === 'admin-messages') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing userName parameter' })
      };
    }

    console.log(`[Netlify Admin Messages] Loading messages for user: ${userName}`);

    // Get user's message history
    const userMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.userName, userName))
      .orderBy(desc(messages.timestamp))
      .limit(200);

    // Return messages in chronological order
    const sortedMessages = userMessages.reverse();
    
    console.log(`[Netlify Admin Messages] Retrieved ${sortedMessages.length} messages for ${userName}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(sortedMessages)
    };

  } catch (error) {
    console.error('[Netlify Admin Messages] Error:', error);
    
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