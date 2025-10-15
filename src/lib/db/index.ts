/**
 * Drizzle Database Client
 * Provides access to the database instance
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@/db/schema';

// Allow build without DATABASE_URL (will fail at runtime if actually used)
const connectionString = process.env.DATABASE_URL || 'postgresql://localhost:5432/placeholder';

// Create the connection (only if DATABASE_URL is set, otherwise use placeholder)
const client = postgres(connectionString, {
  // Prevent actual connection during build
  max: process.env.DATABASE_URL ? undefined : 0,
});

// Create the Drizzle instance
export const db = drizzle(client, { schema });
