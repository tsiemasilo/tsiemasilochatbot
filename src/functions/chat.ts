import { Handler } from '@netlify/functions';
import { analyzeMood, generateResponse } from './services/openai';

// Simple in-memory storage for Netlify deployment
const messages: Array<{
  id: number;
  content: string;
  isUser: boolean;
  timestamp: Date;
  userName: string;
  mood?: string;
}> = [];

let messageId = 1;

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

      // Store user message
      const userMessage = {
        id: messageId++,
        content,
        isUser: true,
        timestamp: new Date(),
        userName,
        mood: 'neutral'
      };
      messages.push(userMessage);

      // Get conversation history for this user
      const userMessages = messages
        .filter(msg => msg.userName === userName)
        .slice(-10) // Last 10 messages
        .map(msg => ({
          content: msg.content,
          isUser: msg.isUser
        }));

      // Generate AI response
      const moodAnalysis = await analyzeMood(content);
      const botResponse = await generateResponse(content, userMessages, moodAnalysis);

      // Store bot response
      const botMessage = {
        id: messageId++,
        content: botResponse,
        isUser: false,
        timestamp: new Date(),
        userName: 'Tsie Masilo Bot',
        mood: moodAnalysis.mood
      };
      messages.push(botMessage);

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