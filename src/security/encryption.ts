import crypto from 'crypto';
import fs from 'fs-extra';
import path from 'path';
import { MCPLogger as Logger } from '../utils/mcp-logger.js';

const logger = new Logger('Encryption');

/**
 * At-rest encryption using AES-256-GCM
 * Per-project keys stored securely
 */
export class EncryptionManager {
  private projectId: string;
  private key: Buffer;
  private keyPath: string;
  private algorithm = 'aes-256-gcm';

  constructor(projectRoot: string, projectId: string) {
    this.projectId = projectId;
    this.keyPath = path.join(projectRoot, '.kratos', '.keys', `${projectId}.key`);
    this.key = this.loadOrCreateKey();
  }

  /**
   * Load existing key or create new one
   */
  private loadOrCreateKey(): Buffer {
    try {
      if (fs.existsSync(this.keyPath)) {
        const keyData = fs.readFileSync(this.keyPath);
        logger.info(`Loaded encryption key for project ${this.projectId}`);
        return keyData;
      }
    } catch (error) {
      logger.warn('Failed to load key, creating new one:', error);
    }

    // Generate new key
    const key = crypto.randomBytes(32); // 256 bits
    this.saveKey(key);
    logger.info(`Generated new encryption key for project ${this.projectId}`);
    return key;
  }

  /**
   * Save key securely (restricted permissions)
   */
  private saveKey(key: Buffer): void {
    fs.ensureDirSync(path.dirname(this.keyPath));
    fs.writeFileSync(this.keyPath, key);
    
    // Set restrictive permissions (owner read/write only)
    try {
      fs.chmodSync(this.keyPath, 0o600);
    } catch (error) {
      logger.warn('Could not set key file permissions:', error);
    }
  }

  /**
   * Encrypt data
   */
  encrypt(text: string): { encrypted: string; iv: string; tag: string } {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv) as crypto.CipherGCM;
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex')
    };
  }

  /**
   * Decrypt data
   */
  decrypt(encrypted: string, iv: string, tag: string): string {
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      this.key,
      Buffer.from(iv, 'hex')
    ) as crypto.DecipherGCM;
    
    decipher.setAuthTag(Buffer.from(tag, 'hex'));
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * Encrypt JSON object
   */
  encryptJSON(obj: any): string {
    const json = JSON.stringify(obj);
    const { encrypted, iv, tag } = this.encrypt(json);
    
    // Combine into single string
    return `${iv}:${tag}:${encrypted}`;
  }

  /**
   * Decrypt JSON object
   */
  decryptJSON(encryptedData: string): any {
    const [iv, tag, encrypted] = encryptedData.split(':');
    const json = this.decrypt(encrypted, iv, tag);
    return JSON.parse(json);
  }

  /**
   * Rotate encryption key
   */
  async rotateKey(reencryptCallback: (oldDecrypt: (data: string) => any, newEncrypt: (data: any) => string) => Promise<void>): Promise<void> {
    const oldKey = this.key;
    const oldDecrypt = (data: string) => {
      const [iv, tag, encrypted] = data.split(':');
      const decipher = crypto.createDecipheriv(this.algorithm, oldKey, Buffer.from(iv, 'hex')) as crypto.DecipherGCM;
      decipher.setAuthTag(Buffer.from(tag, 'hex'));
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return JSON.parse(decrypted);
    };

    // Generate new key
    this.key = crypto.randomBytes(32);
    this.saveKey(this.key);

    // Re-encrypt all data
    await reencryptCallback(oldDecrypt, (data) => this.encryptJSON(data));
    
    logger.info('Key rotation completed');
  }

  /**
   * Destroy key (for secure deletion)
   */
  destroyKey(): void {
    // Overwrite key in memory
    this.key.fill(0);
    
    // Overwrite key file
    if (fs.existsSync(this.keyPath)) {
      const randomData = crypto.randomBytes(32);
      fs.writeFileSync(this.keyPath, randomData);
      fs.unlinkSync(this.keyPath);
    }
    
    logger.info('Encryption key destroyed');
  }
}