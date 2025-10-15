/**
 * Drizzle Database Client
 * Provides access to the database instance
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@/db/schema';

// Skip database connection during build if no DATABASE_URL is set
if (!process.env.DATABASE_URL && process.env.NODE_ENV === 'production') {
  console.warn('⚠️ DATABASE_URL not set during build - using placeholder');
}

// Allow build without DATABASE_URL (will fail at runtime if actually used)
const connectionString = process.env.DATABASE_URL || 'postgresql://placeholder:placeholder@localhost:5432/placeholder';

// Create the connection (only if DATABASE_URL is set, otherwise use placeholder)
const client = postgres(connectionString, {
  // Prevent actual connection during build
  max: process.env.DATABASE_URL ? undefined : 0,
  // Add connect_timeout to prevent hanging
  connect_timeout: 10,
});

// Create the Drizzle instance
export const db = drizzle(client, { schema });
