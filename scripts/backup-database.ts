import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFileSync, mkdirSync } from 'fs';
import path from 'path';

const execAsync = promisify(exec);

async function backupDatabase() {
  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, '-')
    .split('T')[0];
  const backupDir = path.join(process.cwd(), 'backups');

  // Create backups directory if it doesn't exist
  try {
    mkdirSync(backupDir, { recursive: true });
  } catch (err) {
    // Directory already exists
  }

  const backupFile = path.join(backupDir, `backup-${timestamp}.sql`);
  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl) {
    throw new Error('DATABASE_URL not set in environment');
  }

  console.log(`Starting database backup to: ${backupFile}`);
  console.log(`Database: ${dbUrl.split('@')[1]?.split('/')[0] || 'unknown'}`);

  try {
    const { stdout, stderr } = await execAsync(
      `pg_dump "${dbUrl}" --no-owner --no-acl --format=plain`,
      { maxBuffer: 1024 * 1024 * 100 } // 100MB buffer
    );

    if (stderr && !stderr.includes('NOTICE')) {
      console.warn('Backup warnings:', stderr);
    }

    writeFileSync(backupFile, stdout);
    const sizeMB = (stdout.length / 1024 / 1024).toFixed(2);

    console.log(`✅ Backup completed successfully`);
    console.log(`📁 File: ${backupFile}`);
    console.log(`📊 Size: ${sizeMB} MB`);

    return { success: true, file: backupFile, size: sizeMB };
  } catch (error) {
    console.error('❌ Backup failed:', error);
    throw error;
  }
}

backupDatabase()
  .then((result) => {
    console.log('Backup process completed:', result);
    process.exit(0);
  })
  .catch((error) => {
    console.error('Backup process failed:', error);
    process.exit(1);
  });
