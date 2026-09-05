import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

function getMasterKey(): Buffer {
  const envKey = process.env.ENCRYPTION_KEY;
  if (envKey) {
    // If provided as 32-byte base64 or 64-character hex string
    if (envKey.length === 64) {
      return Buffer.from(envKey, 'hex');
    }
    const buf = Buffer.from(envKey, 'base64');
    if (buf.length === 32) return buf;
    return crypto.createHash('sha256').update(envKey).digest();
  }
  // Deterministic local secret fallback for development
  const localSecret = process.env.NEXTAUTH_SECRET || 'trendly-brain-swarm-secure-master-key-2050';
  return crypto.createHash('sha256').update(localSecret).digest();
}

/**
 * Encrypts a plaintext secret into an AES-256-GCM ciphertext string (IV:AuthTag:Ciphertext)
 */
export function encryptSecret(plaintext: string): string {
  if (!plaintext) return '';
  const key = getMasterKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypts an AES-256-GCM string back into plaintext
 */
export function decryptSecret(encryptedPayload: string): string {
  if (!encryptedPayload) return '';
  const parts = encryptedPayload.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted payload format');
  }

  const [ivHex, authTagHex, encryptedHex] = parts;
  const key = getMasterKey();
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/**
 * Masks sensitive values for safe logging/display
 */
export function maskSecret(secret: string): string {
  if (!secret) return '';
  if (secret.length <= 8) return '****';
  return `${secret.slice(0, 4)}...${secret.slice(-4)}`;
}
