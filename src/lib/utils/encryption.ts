/**
 * Encryption Utility for Sensitive Data
 * Uses AES-256-GCM for encrypting Twilio credentials and other sensitive information
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // AES block size
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;

/**
 * Get encryption key from environment variable
 * Falls back to a default key for development (NOT FOR PRODUCTION)
 */
function getEncryptionKey(): string {
  const key = process.env.ENCRYPTION_KEY;
  
  if (!key) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('ENCRYPTION_KEY environment variable is required in production');
    }
    // Development fallback (NOT SECURE - for testing only)
    console.warn('⚠️ WARNING: Using default encryption key. Set ENCRYPTION_KEY in production!');
    return 'dev-key-not-secure-change-me-12345';
  }
  
  if (key.length < 32) {
    throw new Error('ENCRYPTION_KEY must be at least 32 characters long');
  }
  
  return key;
}

/**
 * Derive a cryptographic key from the encryption key using PBKDF2
 */
function deriveKey(salt: Buffer): Buffer {
  const key = getEncryptionKey();
  return crypto.pbkdf2Sync(key, salt, ITERATIONS, KEY_LENGTH, 'sha512');
}

/**
 * Encrypt sensitive data (e.g., Twilio credentials)
 * @param text - Plain text to encrypt
 * @returns Encrypted string in format: salt:iv:tag:encryptedData (all base64)
 */
export function encrypt(text: string): string {
  if (!text) {
    return '';
  }

  try {
    // Generate random salt and IV
    const salt = crypto.randomBytes(SALT_LENGTH);
    const iv = crypto.randomBytes(IV_LENGTH);
    
    // Derive key from salt
    const key = deriveKey(salt);
    
    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    // Encrypt the text
    let encrypted = cipher.update(text, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    // Get authentication tag
    const tag = cipher.getAuthTag();
    
    // Combine salt, IV, tag, and encrypted data
    const result = [
      salt.toString('base64'),
      iv.toString('base64'),
      tag.toString('base64'),
      encrypted,
    ].join(':');
    
    return result;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt sensitive data
 * @param encryptedText - Encrypted string in format: salt:iv:tag:encryptedData
 * @returns Decrypted plain text
 */
export function decrypt(encryptedText: string): string {
  if (!encryptedText) {
    return '';
  }

  try {
    // Split the encrypted text into components
    const parts = encryptedText.split(':');
    
    if (parts.length !== 4) {
      throw new Error('Invalid encrypted data format');
    }
    
    const [saltBase64, ivBase64, tagBase64, encrypted] = parts;
    
    // Convert from base64
    const salt = Buffer.from(saltBase64, 'base64');
    const iv = Buffer.from(ivBase64, 'base64');
    const tag = Buffer.from(tagBase64, 'base64');
    
    // Derive the same key using the salt
    const key = deriveKey(salt);
    
    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    // Decrypt the text
    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data - data may be corrupted or key may be wrong');
  }
}

/**
 * Hash data for comparison (one-way, cannot be decrypted)
 * Useful for storing passwords or verifying data integrity
 */
export function hash(text: string): string {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const hashedPassword = crypto.pbkdf2Sync(text, salt, ITERATIONS, KEY_LENGTH, 'sha512');
  return `${salt.toString('base64')}:${hashedPassword.toString('base64')}`;
}

/**
 * Verify hashed data
 */
export function verifyHash(text: string, hashedText: string): boolean {
  const [saltBase64, originalHash] = hashedText.split(':');
  const salt = Buffer.from(saltBase64, 'base64');
  const hashedPassword = crypto.pbkdf2Sync(text, salt, ITERATIONS, KEY_LENGTH, 'sha512');
  return hashedPassword.toString('base64') === originalHash;
}

/**
 * Generate a secure random token
 * Useful for API keys, session tokens, etc.
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('base64url');
}

/**
 * Mask sensitive data for display (e.g., "AC1234***********789")
 */
export function maskSensitiveData(text: string, visibleStart: number = 6, visibleEnd: number = 3): string {
  if (!text || text.length <= visibleStart + visibleEnd) {
    return text;
  }
  
  const start = text.substring(0, visibleStart);
  const end = text.substring(text.length - visibleEnd);
  const masked = '*'.repeat(Math.min(text.length - visibleStart - visibleEnd, 15));
  
  return `${start}${masked}${end}`;
}

