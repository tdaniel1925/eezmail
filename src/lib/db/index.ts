/**
 * Drizzle Database Client
 * Provides access to the database instance
 * Optimized for Vercel serverless environment
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@/db/schema';

// Skip database connection during build if no DATABASE_URL is set
if (!process.env.DATABASE_URL && process.env.NODE_ENV === 'production') {
  console.warn('⚠️ DATABASE_URL not set during build - using placeholder');
}

// Allow build without DATABASE_URL (will fail at runtime if actually used)
const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://placeholder:placeholder@localhost:5432/placeholder';

// Detect if we're in Vercel/serverless environment
const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;

// Create the connection with Vercel-optimized settings
const client = postgres(connectionString, {
  // Serverless-optimized connection settings
  max: process.env.DATABASE_URL ? (isServerless ? 1 : 10) : 0,
  idle_timeout: isServerless ? 20 : 30,
  connect_timeout: 10,
  
  // Force SSL in production for security and compatibility
  ssl: process.env.NODE_ENV === 'production' ? 'require' : false,
  
  // Connection metadata
  connection: {
    application_name: 'imbox-email-client',
  },
  
  // Suppress notices to reduce noise in logs
  onnotice: () => {},
  
  // For connection pooler compatibility (if using port 6543)
  prepare: false,
});

// Create the Drizzle instance
export const db = drizzle(client, { schema });
