import { Handler } from '@netlify/functions';
import express from 'express';
import serverless from 'serverless-http';
import { createServer } from 'http';
import { registerRoutes } from '../../server/routes';

const app = express();
const server = createServer(app);

// Initialize routes
registerRoutes(app);

// Convert Express app to Netlify function
const handler = serverless(app);

export const handler: Handler = async (event, context) => {
  // Handle CORS for preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      },
      body: '',
    };
  }

  return handler(event, context);
};