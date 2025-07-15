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

// Database connection string - use single DATABASE_URL variable
const DATABASE_URL = process.env.DATABASE_URL;

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