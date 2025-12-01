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
      const parts = encryptedData.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted data format');
      }

      const iv = Buffer.from(parts[0], 'hex');
      const authTag = Buffer.from(parts[1], 'hex');
      const encrypted = parts[2];

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
