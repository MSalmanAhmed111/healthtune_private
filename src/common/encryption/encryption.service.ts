import { Injectable } from '@nestjs/common';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EncryptionService {
  private readonly encryptionKey: Buffer;
  private readonly algorithm = 'aes-256-gcm';

  constructor(private configService: ConfigService) {
    const key = this.configService.get<string>('ENCRYPTION_KEY');
    if (!key) {
      throw new Error('ENCRYPTION_KEY not found in environment variables');
    }
    // Ensure key is 32 bytes for AES-256
    this.encryptionKey = Buffer.from(key.padEnd(32, '0').slice(0, 32));
  }

  encrypt(text: string): string {
    try {
      const iv = randomBytes(16);
      const cipher = createCipheriv(this.algorithm, this.encryptionKey, iv);

      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const authTag = cipher.getAuthTag();

      // Format: iv:authTag:encrypted
      return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  decrypt(encryptedData: string): string {
    try {
      // Split only on first 2 colons (iv:authTag:encrypted)
      // The encrypted part might contain colons, so we use indexOf
      const colonIndex1 = encryptedData.indexOf(':');
      if (colonIndex1 === -1) {
        throw new Error('Invalid encrypted data format');
      }
      
      const colonIndex2 = encryptedData.indexOf(':', colonIndex1 + 1);
      if (colonIndex2 === -1) {
        throw new Error('Invalid encrypted data format');
      }

      const ivHex = encryptedData.substring(0, colonIndex1);
      const authTagHex = encryptedData.substring(colonIndex1 + 1, colonIndex2);
      const encrypted = encryptedData.substring(colonIndex2 + 1);

      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');

      const decipher = createDecipheriv(this.algorithm, this.encryptionKey, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }
}
