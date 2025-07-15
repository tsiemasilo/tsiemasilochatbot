import { Handler } from '@netlify/functions';
import { Pool } from '@neondatabase/serverless';

// Database connection - use Netlify environment variables
const DATABASE_URL = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;
const pool = new Pool({
  connectionString: DATABASE_URL,
});

export const handler: Handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  try {
    if (event.httpMethod === 'GET') {
      // Get userName from query parameters
      const userName = event.queryStringParameters?.userName;
      
      if (!userName) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'userName parameter is required' }),
        };
      }

      // Get messages for specific user
      const result = await pool.query(`
        SELECT id, content, is_user, timestamp, mood, user_name
        FROM messages 
        WHERE user_name = $1 
        ORDER BY timestamp ASC
      `, [userName]);

      const messages = result.rows.map(row => ({
        id: row.id,
        content: row.content,
        isUser: row.is_user,
        timestamp: row.timestamp,
        mood: row.mood,
        userName: row.user_name
      }));

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(messages),
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  } catch (error) {
    console.error('Admin messages API error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};