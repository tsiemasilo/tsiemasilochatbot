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
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  try {
    if (event.httpMethod === 'GET') {
      // Get contacts/users for admin dashboard
      const result = await pool.query(`
        SELECT 
          user_name,
          COUNT(*) as message_count,
          MAX(content) as last_message,
          MAX(timestamp) as last_activity
        FROM messages 
        WHERE user_name IS NOT NULL 
        GROUP BY user_name 
        ORDER BY last_activity DESC
      `);

      const contacts = result.rows.map(row => ({
        userName: row.user_name,
        messageCount: parseInt(row.message_count),
        lastMessage: row.last_message,
        lastActivity: row.last_activity
      }));

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(contacts),
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  } catch (error) {
    console.error('Admin API error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};