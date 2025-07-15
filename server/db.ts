/**
 * Database Configuration
 * 
 * This file sets up the connection to the Neon PostgreSQL database using Drizzle ORM.
 * It configures the serverless database connection with proper WebSocket support.
 */

import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure Neon to use WebSocket for serverless environments
neonConfig.webSocketConstructor = ws;

// Database connection string - fallback to environment variable or direct connection
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_I9syPbvXdK8W@ep-restless-recipe-aeshfl0e-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

// Validate database URL is available
if (!DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Create database connection pool for efficient connection management
export const pool = new Pool({ connectionString: DATABASE_URL });

// Initialize Drizzle ORM with the connection pool and schema
export const db = drizzle({ client: pool, schema });