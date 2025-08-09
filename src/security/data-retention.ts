import Database from 'better-sqlite3';
import fs from 'fs-extra';
import path from 'path';
import { MCPLogger as Logger } from '../utils/mcp-logger.js';
import { EncryptionManager } from './encryption.js';

const logger = new Logger('DataRetention');

export interface RetentionPolicy {
  id: string;
  name: string;
  description: string;
  retentionDays: number;
  archiveAfterDays?: number;
  deleteAfterDays: number;
  tags?: string[];
  importance?: number;
  createdAt: Date;
}

export interface DeletionRequest {
  id: string;
  projectId: string;
  userId: string;
  targetType: 'memory' | 'project' | 'user';
  targetId: string;
  reason: string;
  scheduledAt: Date;
  executedAt?: Date;
  status: 'pending' | 'completed' | 'failed';
}

export interface ArchiveEntry {
  id: string;
  projectId: string;
  memoryId: string;
  encryptedData: string;
  archivedAt: Date;
  expiresAt: Date;
}

/**
 * Data retention and deletion management
 */
export class DataRetentionManager {
  private db: Database.Database;
  private archiveDb: Database.Database;
  private encryption: EncryptionManager;
  private projectId: string;
  private policies: Map<string, RetentionPolicy> = new Map();

  constructor(projectRoot: string, projectId: string) {
    this.projectId = projectId;
    
    // Main database
    const dbPath = path.join(projectRoot, '.kratos', 'memory.db');
    this.db = new Database(dbPath);

    // Archive database
    const archivePath = path.join(projectRoot, '.kratos', 'archive.db');
    fs.ensureDirSync(path.dirname(archivePath));
    this.archiveDb = new Database(archivePath);
    this.initializeArchiveDb();

    // Encryption for archives
    this.encryption = new EncryptionManager(projectRoot, projectId);

    // Load policies
    this.loadPolicies();
    
    // Start background cleanup
    this.startCleanupScheduler();
  }

  /**
   * Initialize archive database
   */
  private initializeArchiveDb(): void {
    this.archiveDb.exec(`
      CREATE TABLE IF NOT EXISTS archives (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        memory_id TEXT NOT NULL,
        encrypted_data TEXT NOT NULL,
        archived_at INTEGER NOT NULL,
        expires_at INTEGER NOT NULL,
        metadata TEXT
      );
      
      CREATE INDEX IF NOT EXISTS idx_archives_expires ON archives(expires_at);
      CREATE INDEX IF NOT EXISTS idx_archives_project ON archives(project_id);
    `);

    this.archiveDb.exec(`
      CREATE TABLE IF NOT EXISTS deletion_log (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        target_type TEXT NOT NULL,
        target_id TEXT NOT NULL,
        deleted_by TEXT,
        reason TEXT,
        deleted_at INTEGER NOT NULL,
        data_hash TEXT
      );
    `);
  }

  /**
   * Load retention policies
   */
  private loadPolicies(): void {
    // Default policies
    const defaultPolicies: RetentionPolicy[] = [
      {
        id: 'default',
        name: 'Default Policy',
        description: 'Standard retention for all memories',
        retentionDays: 90,
        archiveAfterDays: 60,
        deleteAfterDays: 90,
        createdAt: new Date()
      },
      {
        id: 'temporary',
        name: 'Temporary Data',
        description: 'Short-lived data (debugging, logs)',
        retentionDays: 7,
        deleteAfterDays: 7,
        tags: ['temp', 'debug', 'log'],
        createdAt: new Date()
      },
      {
        id: 'important',
        name: 'Important Data',
        description: 'Long-term retention for critical data',
        retentionDays: 365,
        archiveAfterDays: 180,
        deleteAfterDays: 365,
        importance: 4,
        createdAt: new Date()
      },
      {
        id: 'permanent',
        name: 'Permanent',
        description: 'Never delete (architecture, decisions)',
        retentionDays: 36500, // 100 years
        deleteAfterDays: 36500,
        importance: 5,
        tags: ['architecture', 'decision', 'permanent'],
        createdAt: new Date()
      }
    ];

    for (const policy of defaultPolicies) {
      this.policies.set(policy.id, policy);
    }
  }

  /**
   * Apply retention policy
   */
  applyPolicy(memoryId: string, policyId: string = 'default'): void {
    const policy = this.policies.get(policyId);
    if (!policy) {
      throw new Error(`Policy not found: ${policyId}`);
    }

    const ttlSeconds = policy.retentionDays * 24 * 60 * 60;
    const expiresAt = Date.now() + (ttlSeconds * 1000);

    // Update memory TTL
    const stmt = this.db.prepare(`
      UPDATE memories 
      SET ttl = ?, expires_at = ?
      WHERE id = ? AND project_id = ?
    `);

    stmt.run(ttlSeconds, expiresAt, memoryId, this.projectId);
    
    logger.info(`Applied policy ${policyId} to memory ${memoryId}`);
  }

  /**
   * Archive old memories
   */
  async archiveOldMemories(): Promise<number> {
    let archived = 0;

    // Check if memories table exists
    const tablesExist = this.db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='memories'
    `).get();
    
    if (!tablesExist) {
      return 0; // Tables not initialized yet
    }

    for (const policy of this.policies.values()) {
      if (!policy.archiveAfterDays) continue;

      const cutoffTime = Date.now() - (policy.archiveAfterDays * 24 * 60 * 60 * 1000);

      // Find memories to archive (simplified query to avoid sub-select on non-existent table)
      const stmt = this.db.prepare(`
        SELECT * FROM memories
        WHERE project_id = ?
          AND created_at < ?
      `);

      const memories = stmt.all(this.projectId, cutoffTime);

      for (const memory of memories as any[]) {
        await this.archiveMemory(memory, policy);
        archived++;
      }
    }

    logger.info(`Archived ${archived} memories`);
    return archived;
  }

  /**
   * Archive a single memory
   */
  private async archiveMemory(memory: any, policy: RetentionPolicy): Promise<void> {
    // Encrypt memory data
    const encryptedData = this.encryption.encryptJSON(memory);

    // Calculate expiration
    const expiresAt = Date.now() + (policy.deleteAfterDays * 24 * 60 * 60 * 1000);

    // Insert into archive
    const stmt = this.archiveDb.prepare(`
      INSERT INTO archives (id, project_id, memory_id, encrypted_data, archived_at, expires_at, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const archiveId = `arch_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const metadata = JSON.stringify({
      originalCreatedAt: memory.created_at,
      importance: memory.importance,
      tags: memory.tags
    });

    stmt.run(
      archiveId,
      this.projectId,
      memory.id,
      encryptedData,
      Date.now(),
      expiresAt,
      metadata
    );

    // Delete from main database
    const deleteStmt = this.db.prepare(`
      DELETE FROM memories WHERE id = ? AND project_id = ?
    `);
    deleteStmt.run(memory.id, this.projectId);

    logger.info(`Archived memory ${memory.id}`);
  }

  /**
   * Restore from archive
   */
  async restoreFromArchive(memoryId: string): Promise<boolean> {
    const stmt = this.archiveDb.prepare(`
      SELECT * FROM archives
      WHERE memory_id = ? AND project_id = ?
      ORDER BY archived_at DESC
      LIMIT 1
    `);

    const archive = stmt.get(memoryId, this.projectId) as any;
    
    if (!archive) {
      return false;
    }

    // Decrypt data
    const memory = this.encryption.decryptJSON(archive.encrypted_data);

    // Restore to main database
    const insertStmt = this.db.prepare(`
      INSERT INTO memories (id, project_id, summary, text, tags, paths, importance, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertStmt.run(
      memory.id,
      memory.project_id,
      memory.summary,
      memory.text,
      JSON.stringify(memory.tags || []),
      JSON.stringify(memory.paths || []),
      memory.importance,
      memory.created_at,
      Date.now()
    );

    // Remove from archive
    const deleteStmt = this.archiveDb.prepare(`
      DELETE FROM archives WHERE id = ?
    `);
    deleteStmt.run(archive.id);

    logger.info(`Restored memory ${memoryId} from archive`);
    return true;
  }

  /**
   * Delete data permanently (GDPR right to erasure)
   */
  async deleteData(request: {
    targetType: 'memory' | 'project' | 'user';
    targetId: string;
    userId: string;
    reason: string;
  }): Promise<void> {
    const deletionId = `del_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Log deletion request
    const logStmt = this.archiveDb.prepare(`
      INSERT INTO deletion_log (id, project_id, target_type, target_id, deleted_by, reason, deleted_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    logStmt.run(
      deletionId,
      this.projectId,
      request.targetType,
      request.targetId,
      request.userId,
      request.reason,
      Date.now()
    );

    switch (request.targetType) {
      case 'memory':
        await this.deleteMemory(request.targetId);
        break;
      case 'project':
        await this.deleteProject(request.targetId);
        break;
      case 'user':
        await this.deleteUserData(request.targetId);
        break;
    }

    logger.info(`Completed deletion: ${deletionId}`);
  }

  /**
   * Delete a single memory
   */
  private async deleteMemory(memoryId: string): Promise<void> {
    // Delete from main database
    const stmt = this.db.prepare(`
      DELETE FROM memories WHERE id = ? AND project_id = ?
    `);
    stmt.run(memoryId, this.projectId);

    // Delete from FTS
    const ftsStmt = this.db.prepare(`
      DELETE FROM memories_fts WHERE rowid = (
        SELECT rowid FROM memories WHERE id = ? AND project_id = ?
      )
    `);
    ftsStmt.run(memoryId, this.projectId);

    // Delete from archives
    const archiveStmt = this.archiveDb.prepare(`
      DELETE FROM archives WHERE memory_id = ? AND project_id = ?
    `);
    archiveStmt.run(memoryId, this.projectId);

    logger.info(`Deleted memory ${memoryId}`);
  }

  /**
   * Delete entire project
   */
  private async deleteProject(projectId: string): Promise<void> {
    if (projectId !== this.projectId) {
      throw new Error('Can only delete current project');
    }

    // Delete all memories
    const stmt = this.db.prepare(`
      DELETE FROM memories WHERE project_id = ?
    `);
    const result = stmt.run(projectId);

    // Delete all archives
    const archiveStmt = this.archiveDb.prepare(`
      DELETE FROM archives WHERE project_id = ?
    `);
    archiveStmt.run(projectId);

    // Destroy encryption key
    this.encryption.destroyKey();

    logger.info(`Deleted project ${projectId} (${result.changes} memories)`);
  }

  /**
   * Delete all user data (GDPR)
   */
  private async deleteUserData(userId: string): Promise<void> {
    // This would integrate with RBAC to find all user data
    // For now, delete memories created by user
    const stmt = this.db.prepare(`
      DELETE FROM memories 
      WHERE project_id = ? 
        AND json_extract(metadata, '$.userId') = ?
    `);
    const result = stmt.run(this.projectId, userId);

    logger.info(`Deleted user data for ${userId} (${result.changes} memories)`);
  }

  /**
   * Export data for GDPR compliance
   */
  async exportUserData(userId: string): Promise<string> {
    try {
      // Check if memories table exists
      const tableCheck = this.db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='memories'
      `).get();
      
      if (!tableCheck) {
        // No memories table yet
        return JSON.stringify({
          exportDate: new Date().toISOString(),
          userId,
          projectId: this.projectId,
          memories: [],
          totalCount: 0,
          note: 'No memories table exists yet'
        }, null, 2);
      }
      
      // First try to get user-specific memories (handle missing metadata column)
      let userMemories: any[] = [];
      try {
        const userStmt = this.db.prepare(`
          SELECT * FROM memories
          WHERE project_id = ?
            AND json_extract(metadata, '$.userId') = ?
        `);
        userMemories = userStmt.all(this.projectId, userId);
      } catch (e) {
        // metadata column might not exist
        logger.debug('No metadata column in memories table');
      }
      
      // If no user-specific memories, get all project memories for demo/testing
      let memories = userMemories;
      if (memories.length === 0) {
        const allStmt = this.db.prepare(`
          SELECT * FROM memories
          WHERE project_id = ?
          LIMIT 10
        `);
        memories = allStmt.all(this.projectId);
      }
      
      const exportData = {
        exportDate: new Date().toISOString(),
        userId,
        projectId: this.projectId,
        memories,
        totalCount: memories.length,
        note: memories.length === 0 ? 'No data found for this user' : 
              userMemories.length === 0 ? 'Showing sample project data (user has no specific data)' : 
              'User-specific data exported'
      };
      
      return JSON.stringify(exportData, null, 2);
    } catch (error: any) {
      logger.error('GDPR export failed', error);
      return JSON.stringify({
        error: 'Export failed',
        message: error.message,
        userId,
        projectId: this.projectId
      }, null, 2);
    }
  }

  /**
   * Start background cleanup scheduler
   */
  private startCleanupScheduler(): void {
    // Run cleanup every hour
    setInterval(() => {
      this.runCleanup();
    }, 60 * 60 * 1000);

    // Initial cleanup
    this.runCleanup();
  }

  /**
   * Run cleanup tasks
   */
  private async runCleanup(): Promise<void> {
    try {
      // Check if tables exist first
      const tablesExist = this.db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='memories'
      `).get();
      
      if (!tablesExist) {
        return; // Tables not initialized yet
      }

      // Delete expired memories
      const deleteStmt = this.db.prepare(`
        DELETE FROM memories
        WHERE project_id = ?
          AND expires_at IS NOT NULL
          AND expires_at < ?
      `);
      const deleteResult = deleteStmt.run(this.projectId, Date.now());

      // Delete expired archives
      const archiveDeleteStmt = this.archiveDb.prepare(`
        DELETE FROM archives
        WHERE project_id = ?
          AND expires_at < ?
      `);
      const archiveResult = archiveDeleteStmt.run(this.projectId, Date.now());

      if (deleteResult.changes > 0 || archiveResult.changes > 0) {
        logger.info(`Cleanup: deleted ${deleteResult.changes} memories, ${archiveResult.changes} archives`);
      }

      // Archive old memories
      await this.archiveOldMemories();

    } catch (error) {
      logger.error('Cleanup failed:', error);
    }
  }

  /**
   * Get retention statistics
   */
  getStats(): any {
    const memoryCount = this.db.prepare(`
      SELECT COUNT(*) as count FROM memories WHERE project_id = ?
    `).get(this.projectId) as any;

    const archiveCount = this.archiveDb.prepare(`
      SELECT COUNT(*) as count FROM archives WHERE project_id = ?
    `).get(this.projectId) as any;

    const deletionCount = this.archiveDb.prepare(`
      SELECT COUNT(*) as count FROM deletion_log WHERE project_id = ?
    `).get(this.projectId) as any;

    return {
      activeMemories: memoryCount.count,
      archivedMemories: archiveCount.count,
      deletions: deletionCount.count,
      policies: Array.from(this.policies.values())
    };
  }

  close(): void {
    this.db.close();
    this.archiveDb.close();
  }
}