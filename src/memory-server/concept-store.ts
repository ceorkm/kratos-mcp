import Database from 'better-sqlite3';
import path from 'path';
import os from 'os';
import fs from 'fs-extra';
import crypto from 'crypto';
import { MCPLogger as Logger } from '../utils/mcp-logger.js';

const logger = new Logger('ConceptStore');

export interface Concept {
  id: string;
  title: string;
  body: string;
  tags: string[];
  importance: number;
  created_at: number;
  updated_at: number;
}

export interface ConceptSearchResult {
  concept: Concept;
  score: number;
  snippet?: string;
}

export class ConceptStore {
  private db: Database.Database;
  private static instances: Map<string, ConceptStore> = new Map();
  private projectId: string;

  private constructor(projectId: string) {
    this.projectId = projectId;
    
    // ISOLATED concept store per project - no pollution!
    const kratosHome = path.join(os.homedir(), '.kratos');
    const dbPath = path.join(kratosHome, 'projects', projectId, 'databases', 'concepts.db');
    fs.ensureDirSync(path.dirname(dbPath));
    
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    
    this.initializeSchema();
    logger.info(`Concept store ISOLATED for project: ${projectId}`);
  }

  static getInstance(projectId?: string): ConceptStore {
    const id = projectId || 'global';
    
    if (!ConceptStore.instances.has(id)) {
      ConceptStore.instances.set(id, new ConceptStore(id));
    }
    return ConceptStore.instances.get(id)!;
  }

  private initializeSchema() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS concepts (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        tags TEXT DEFAULT '[]',
        importance INTEGER DEFAULT 3 CHECK(importance >= 1 AND importance <= 5),
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_concept_importance ON concepts(importance DESC);
      CREATE INDEX IF NOT EXISTS idx_concept_created ON concepts(created_at DESC);

      CREATE VIRTUAL TABLE IF NOT EXISTS concept_fts USING fts5(
        title,
        body,
        content='concepts',
        content_rowid='rowid',
        tokenize='porter unicode61'
      );

      -- FTS sync triggers
      CREATE TRIGGER IF NOT EXISTS concept_fts_insert AFTER INSERT ON concepts BEGIN
        INSERT INTO concept_fts(rowid, title, body) VALUES (new.rowid, new.title, new.body);
      END;

      CREATE TRIGGER IF NOT EXISTS concept_fts_delete AFTER DELETE ON concepts BEGIN
        DELETE FROM concept_fts WHERE rowid = old.rowid;
      END;

      CREATE TRIGGER IF NOT EXISTS concept_fts_update AFTER UPDATE ON concepts BEGIN
        DELETE FROM concept_fts WHERE rowid = old.rowid;
        INSERT INTO concept_fts(rowid, title, body) VALUES (new.rowid, new.title, new.body);
      END;

      -- Allowlist table for project-level concept permissions
      CREATE TABLE IF NOT EXISTS project_allowlists (
        project_id TEXT NOT NULL,
        concept_id TEXT NOT NULL,
        added_at INTEGER NOT NULL,
        PRIMARY KEY (project_id, concept_id),
        FOREIGN KEY (concept_id) REFERENCES concepts(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_allowlist_project ON project_allowlists(project_id);
    `);

    // Seed initial concepts if empty
    this.seedInitialConcepts();
  }

  private seedInitialConcepts() {
    const count = this.db.prepare('SELECT COUNT(*) as count FROM concepts').get() as any;
    
    if (count.count === 0) {
      const initialConcepts = [
        {
          id: 'jwt-auth-v2',
          title: 'JWT Authentication Pattern',
          body: 'Standard JWT auth flow: 1) Client sends credentials 2) Server validates, generates JWT with claims 3) Client includes JWT in Authorization header 4) Server validates JWT signature & expiry 5) Extract user from claims. Key: Use RS256 for production, short expiry + refresh tokens.',
          tags: ['jwt', 'auth', 'security', 'pattern'],
          importance: 5
        },
        {
          id: 's3-upload-checklist',
          title: 'S3 Upload Security Checklist',
          body: 'Before S3 uploads: ✓ Generate presigned URLs server-side ✓ Set expiry < 5min ✓ Validate file type/size ✓ Use random S3 keys (not user filenames) ✓ Set bucket CORS policy ✓ Enable versioning ✓ Configure lifecycle rules ✓ Monitor with CloudWatch',
          tags: ['s3', 'aws', 'upload', 'security', 'checklist'],
          importance: 5
        },
        {
          id: 'rate-limiter-pattern',
          title: 'API Rate Limiting Pattern',
          body: 'Token bucket algorithm: Each user gets N tokens/minute. Request costs 1 token. If tokens=0, reject with 429. Refill tokens at fixed rate. Implementation: Redis INCR with TTL, or in-memory with sliding window. Add headers: X-RateLimit-Limit/Remaining/Reset.',
          tags: ['api', 'rate-limit', 'security', 'pattern'],
          importance: 4
        },
        {
          id: 'error-boundary-react',
          title: 'React Error Boundary Pattern',
          body: 'Catch React component errors: class ErrorBoundary extends React.Component { componentDidCatch(error, info) { logError(error, info); } render() { if (hasError) return <Fallback />; return children; }}. Wrap at route level. Cannot catch: async errors, event handlers, SSR.',
          tags: ['react', 'error-handling', 'pattern', 'frontend'],
          importance: 4
        },
        {
          id: 'db-migration-safety',
          title: 'Safe Database Migration Checklist',
          body: 'Safe migrations: ✓ Always backup first ✓ Test rollback ✓ Make backwards compatible ✓ Separate schema vs data migrations ✓ Add indexes CONCURRENTLY ✓ Avoid NOT NULL without default ✓ Use transactions ✓ Monitor during deploy ✓ Have recovery plan',
          tags: ['database', 'migration', 'safety', 'checklist'],
          importance: 5
        }
      ];

      const stmt = this.db.prepare(`
        INSERT INTO concepts (id, title, body, tags, importance, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      const now = Date.now();
      for (const concept of initialConcepts) {
        stmt.run(
          concept.id,
          concept.title,
          concept.body,
          JSON.stringify(concept.tags),
          concept.importance,
          now,
          now
        );
      }

      logger.info(`Seeded ${initialConcepts.length} initial concepts`);
    }
  }

  search(params: {
    q: string;
    k?: number;
    allowlist?: string[];
    projectId?: string;
  }): ConceptSearchResult[] {
    const k = params.k || 10;
    
    // Handle special queries
    const searchQuery = this.normalizeSearchQuery(params.q);
    
    // Use different query based on whether we have a search term
    let query: string;
    let queryParams: any[];
    
    if (searchQuery === '*' || !searchQuery.trim()) {
      // Return all concepts when wildcard or empty query
      query = `
        SELECT 
          c.*,
          1.0 as fts_score,
          '' as snippet
        FROM concepts c
      `;
      queryParams = [];
    } else {
      // Normal FTS search
      query = `
        SELECT 
          c.*,
          bm25(concept_fts) as fts_score,
          snippet(concept_fts, 0, '[', ']', '...', 32) as snippet
        FROM concepts c
        JOIN concept_fts ON c.rowid = concept_fts.rowid
        WHERE concept_fts MATCH ?
      `;
      queryParams = [searchQuery];
    }

    // Apply allowlist filter if project specified
    if (params.projectId) {
      if (searchQuery === '*') {
        query += ` WHERE c.id IN (
          SELECT concept_id FROM project_allowlists WHERE project_id = ?
        )`;
      } else {
        query += ` AND c.id IN (
          SELECT concept_id FROM project_allowlists WHERE project_id = ?
        )`;
      }
      queryParams.push(params.projectId);
    } else if (params.allowlist && params.allowlist.length > 0) {
      if (searchQuery === '*') {
        query += ` WHERE c.id IN (${params.allowlist.map(() => '?').join(',')})`;
      } else {
        query += ` AND c.id IN (${params.allowlist.map(() => '?').join(',')})`;
      }
      queryParams.push(...params.allowlist);
    }

    // Add appropriate ordering and limit
    if (searchQuery === '*') {
      query += ' ORDER BY c.importance DESC, c.created_at DESC LIMIT ?';
    } else {
      query += ' ORDER BY fts_score DESC, c.importance DESC LIMIT ?';
    }
    queryParams.push(k);

    const stmt = this.db.prepare(query);
    const results = stmt.all(...queryParams) as any[];

    return results.map(row => ({
      concept: this.rowToConcept(row),
      score: -row.fts_score,
      snippet: row.snippet
    }));
  }

  get(id: string): Concept | null {
    const stmt = this.db.prepare('SELECT * FROM concepts WHERE id = ?');
    const row = stmt.get(id) as any;
    
    return row ? this.rowToConcept(row) : null;
  }

  save(params: {
    id?: string;
    title: string;
    body: string;
    tags?: string[];
    importance?: number;
  }): { id: string } {
    const now = Date.now();
    const id = params.id || this.generateConceptId(params.title);
    
    // Check body length constraint (600-900 chars recommended)
    if (params.body.length > 1200) {
      logger.warn(`Concept body exceeds recommended length: ${params.body.length} chars`);
    }

    const existing = this.get(id);
    
    if (existing) {
      // Update existing
      const stmt = this.db.prepare(`
        UPDATE concepts 
        SET title = ?, body = ?, tags = ?, importance = ?, updated_at = ?
        WHERE id = ?
      `);
      
      stmt.run(
        params.title,
        params.body,
        JSON.stringify(params.tags || []),
        params.importance || existing.importance,
        now,
        id
      );
    } else {
      // Insert new
      const stmt = this.db.prepare(`
        INSERT INTO concepts (id, title, body, tags, importance, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run(
        id,
        params.title,
        params.body,
        JSON.stringify(params.tags || []),
        params.importance || 3,
        now,
        now
      );
    }

    logger.info(`Concept saved: ${id} - ${params.title}`);
    return { id };
  }

  updateAllowlist(params: {
    projectId: string;
    add?: string[];
    remove?: string[];
    list?: boolean;
  }): { allowlist?: string[]; added?: string[]; removed?: string[] } {
    const result: any = {};

    if (params.add && params.add.length > 0) {
      const stmt = this.db.prepare(`
        INSERT OR IGNORE INTO project_allowlists (project_id, concept_id, added_at)
        VALUES (?, ?, ?)
      `);
      
      const now = Date.now();
      const added = [];
      
      for (const conceptId of params.add) {
        // Verify concept exists
        if (this.get(conceptId)) {
          const res = stmt.run(params.projectId, conceptId, now);
          if (res.changes > 0) {
            added.push(conceptId);
          }
        }
      }
      
      result.added = added;
    }

    if (params.remove && params.remove.length > 0) {
      const stmt = this.db.prepare(`
        DELETE FROM project_allowlists 
        WHERE project_id = ? AND concept_id = ?
      `);
      
      const removed = [];
      
      for (const conceptId of params.remove) {
        const res = stmt.run(params.projectId, conceptId);
        if (res.changes > 0) {
          removed.push(conceptId);
        }
      }
      
      result.removed = removed;
    }

    if (params.list) {
      const stmt = this.db.prepare(`
        SELECT concept_id FROM project_allowlists 
        WHERE project_id = ? 
        ORDER BY added_at DESC
      `);
      
      const rows = stmt.all(params.projectId) as any[];
      result.allowlist = rows.map(r => r.concept_id);
    }

    return result;
  }

  linkToProject(conceptId: string, projectId: string): { memoryId: string } {
    const concept = this.get(conceptId);
    if (!concept) {
      throw new Error(`Concept not found: ${conceptId}`);
    }

    // This would call the project's memory.save with the concept data
    // For now, we'll return a placeholder
    const memoryId = `mem_linked_${conceptId}_${Date.now()}`;
    
    logger.info(`Linked concept ${conceptId} to project ${projectId} as ${memoryId}`);
    return { memoryId };
  }

  private generateConceptId(title: string): string {
    // Generate readable ID from title
    const base = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 30);
    
    return `${base}-v${Date.now() % 1000}`;
  }

  private normalizeSearchQuery(query: string): string {
    // Handle empty or whitespace-only queries
    if (!query || !query.trim()) {
      return '*';
    }
    
    // Handle wildcard queries
    if (query.trim() === '*' || query.trim() === '**') {
      return '*';
    }
    
    // Escape FTS5 special characters and return
    return this.escapeQuery(query.trim());
  }

  private escapeQuery(query: string): string {
    return query.replace(/["]/g, '""');
  }

  private rowToConcept(row: any): Concept {
    return {
      id: row.id,
      title: row.title,
      body: row.body,
      tags: JSON.parse(row.tags),
      importance: row.importance,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }

  close() {
    this.db.close();
  }
}