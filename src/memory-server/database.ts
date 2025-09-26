import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs-extra';
import crypto from 'crypto';
import { MCPLogger as Logger } from '../utils/mcp-logger.js';

const logger = new Logger('MemoryDB');

export interface Memory {
  id: string;
  project_id: string;
  summary: string;
  text: string;
  tags: string[];
  paths: string[];
  importance: number;
  created_at: number;
  updated_at: number;
  ttl?: number;
  expires_at?: number;
}

export interface SearchResult {
  memory: Memory;
  score: number;
  snippet?: string;
}

export interface EnhancedSearchResult {
  results: SearchResult[];
  debug_info: {
    original_query: string;
    queries_tried: string[];
    fallback_used?: string;
    total_memories_scanned: number;
    search_time_ms: number;
  };
}

export class MemoryDatabase {
  private db: Database.Database;
  private projectId: string;
  private projectRoot: string;

  constructor(projectRoot: string, projectId: string) {
    this.projectRoot = projectRoot;
    this.projectId = projectId;
    
    // CRITICAL: Each project gets COMPLETELY ISOLATED database
    // Path: ~/.kratos/projects/{project_id}/databases/memories.db
    // This ensures NO cross-contamination between projects
    const kratosHome = path.join(process.env.HOME || process.env.USERPROFILE || '', '.kratos');
    const dbPath = path.join(kratosHome, 'projects', projectId, 'databases', 'memories.db');
    fs.ensureDirSync(path.dirname(dbPath));
    
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    
    this.initializeSchema();
    this.setupTriggers();
    logger.info(`Memory database ISOLATED for project: ${projectId} at ${dbPath}`);
  }

  private initializeSchema() {
    // Main memories table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS memories (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        summary TEXT NOT NULL,
        text TEXT NOT NULL,
        tags TEXT DEFAULT '[]',
        paths TEXT DEFAULT '[]',
        importance INTEGER DEFAULT 3 CHECK(importance >= 1 AND importance <= 5),
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        ttl INTEGER,
        expires_at INTEGER,
        dedupe_hash TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_mem_project ON memories(project_id);
      CREATE INDEX IF NOT EXISTS idx_mem_expires ON memories(expires_at) WHERE expires_at IS NOT NULL;
      CREATE INDEX IF NOT EXISTS idx_mem_importance ON memories(importance DESC, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_mem_dedupe ON memories(dedupe_hash);
    `);

    // Full-text search virtual table - INCLUDING TAGS for better search
    this.db.exec(`
      CREATE VIRTUAL TABLE IF NOT EXISTS mem_fts USING fts5(
        summary, 
        text,
        tags,
        content='memories', 
        content_rowid='rowid',
        tokenize='porter unicode61'
      );

      -- Triggers to keep FTS in sync - now including tags
      CREATE TRIGGER IF NOT EXISTS mem_fts_insert AFTER INSERT ON memories BEGIN
        INSERT INTO mem_fts(rowid, summary, text, tags) 
        VALUES (new.rowid, new.summary, new.text, 
                CASE WHEN json_array_length(new.tags) > 0 
                     THEN (SELECT group_concat(value, ' ') FROM json_each(new.tags))
                     ELSE ''
                END);
      END;

      CREATE TRIGGER IF NOT EXISTS mem_fts_delete AFTER DELETE ON memories BEGIN
        DELETE FROM mem_fts WHERE rowid = old.rowid;
      END;

      CREATE TRIGGER IF NOT EXISTS mem_fts_update AFTER UPDATE ON memories BEGIN
        DELETE FROM mem_fts WHERE rowid = old.rowid;
        INSERT INTO mem_fts(rowid, summary, text, tags) 
        VALUES (new.rowid, new.summary, new.text,
                CASE WHEN json_array_length(new.tags) > 0 
                     THEN (SELECT group_concat(value, ' ') FROM json_each(new.tags))
                     ELSE ''
                END);
      END;
    `);
  }

  private setupTriggers() {
    // Auto-cleanup expired memories
    setInterval(() => {
      this.cleanupExpired();
    }, 60 * 60 * 1000); // Every hour
  }

  save(params: {
    summary: string;
    text: string;
    tags?: string[];
    paths?: string[];
    importance?: number;
    ttl?: number;
  }): { id: string } {
    // Project isolation is enforced by the database path itself
    // Each project has its own database file, so no cross-contamination is possible

    const now = Date.now();
    const id = this.generateId();
    
    // Compute dedupe hash
    const dedupeHash = this.computeDedupeHash(params.summary, params.paths || []);
    
    // Check for duplicates
    const existing = this.db.prepare(
      'SELECT id FROM memories WHERE dedupe_hash = ? AND project_id = ?'
    ).get(dedupeHash, this.projectId);
    
    if (existing && typeof existing === 'object' && 'id' in existing) {
      logger.info(`Duplicate memory detected, updating existing: ${(existing as any).id}`);
      return this.update((existing as any).id as string, params);
    }

    // Calculate expiration
    const expires_at = params.ttl ? now + (params.ttl * 1000) : null;

    const stmt = this.db.prepare(`
      INSERT INTO memories (
        id, project_id, summary, text, tags, paths, 
        importance, created_at, updated_at, ttl, expires_at, dedupe_hash
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      this.projectId,
      params.summary,
      params.text,
      JSON.stringify(params.tags || []),
      JSON.stringify(params.paths || []),
      params.importance || 3,
      now,
      now,
      params.ttl || null,
      expires_at,
      dedupeHash
    );

    logger.info(`Memory saved: ${id} - ${params.summary}`);
    
    // Return the complete memory object
    const memory: Memory = {
      id,
      project_id: this.projectId,
      summary: params.summary,
      text: params.text,
      tags: params.tags || [],
      paths: params.paths || [],
      importance: params.importance || 3,
      created_at: now,
      updated_at: now,
      ttl: params.ttl,
      expires_at: expires_at || undefined
    };
    
    return memory;
  }

  search(params: {
    q: string;
    k?: number;
    require_path_match?: boolean;
    tags?: string[];
    include_expired?: boolean;
  }): SearchResult[] {
    const k = params.k || 10;

    // Try primary search
    try {
      const results = this.executeSearch(params);
      if (results.length > 0) {
        return results;
      }
    } catch (error) {
      // Primary search failed, try fallbacks
      console.warn('Primary search failed, trying fallbacks:', error);
    }

    // Fallback 1: Try without special characters
    if (params.q.match(/[^\w\s]/)) {
      try {
        const fallbackQuery = params.q.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
        const results = this.executeSearch({...params, q: fallbackQuery});
        if (results.length > 0) {
          return results;
        }
      } catch (error) {
        console.warn('Fallback 1 failed:', error);
      }
    }

    // Fallback 2: Try individual words (OR search)
    const words = params.q.split(/\s+/).filter(word => word.length > 2);
    if (words.length > 1) {
      try {
        const orQuery = words.join(' OR ');
        const results = this.executeSearch({...params, q: orQuery});
        if (results.length > 0) {
          return results;
        }
      } catch (error) {
        console.warn('Fallback 2 failed:', error);
      }
    }

    // Fallback 3: Try broader search with just the first word
    if (words.length > 0) {
      try {
        const results = this.executeSearch({...params, q: words[0]});
        return results; // Return whatever we get, even if empty
      } catch (error) {
        console.warn('All fallbacks failed:', error);
      }
    }

    return []; // No results found
  }

  searchWithDebug(params: {
    q: string;
    k?: number;
    require_path_match?: boolean;
    tags?: string[];
    include_expired?: boolean;
  }): EnhancedSearchResult {
    const startTime = Date.now();
    const queries_tried: string[] = [];
    let fallback_used: string | undefined;

    // Try primary search
    queries_tried.push(params.q);
    try {
      const results = this.executeSearch(params);
      if (results.length > 0) {
        return {
          results,
          debug_info: {
            original_query: params.q,
            queries_tried,
            search_time_ms: Date.now() - startTime,
            total_memories_scanned: this.getTotalMemoryCount()
          }
        };
      }
    } catch (error) {
      // Continue to fallbacks
    }

    // Fallback 1: Try without special characters
    if (params.q.match(/[^\w\s]/)) {
      const fallbackQuery = params.q.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
      queries_tried.push(fallbackQuery);
      try {
        const results = this.executeSearch({...params, q: fallbackQuery});
        if (results.length > 0) {
          return {
            results,
            debug_info: {
              original_query: params.q,
              queries_tried,
              fallback_used: 'removed_special_chars',
              search_time_ms: Date.now() - startTime,
              total_memories_scanned: this.getTotalMemoryCount()
            }
          };
        }
      } catch (error) {
        // Continue to next fallback
      }
    }

    // Fallback 2: Try individual words (OR search)
    const words = params.q.split(/\s+/).filter(word => word.length > 2);
    if (words.length > 1) {
      const orQuery = words.join(' OR ');
      queries_tried.push(orQuery);
      try {
        const results = this.executeSearch({...params, q: orQuery});
        if (results.length > 0) {
          return {
            results,
            debug_info: {
              original_query: params.q,
              queries_tried,
              fallback_used: 'or_search',
              search_time_ms: Date.now() - startTime,
              total_memories_scanned: this.getTotalMemoryCount()
            }
          };
        }
      } catch (error) {
        // Continue to next fallback
      }
    }

    // Fallback 3: Try broader search with just the first word
    if (words.length > 0) {
      queries_tried.push(words[0]);
      try {
        const results = this.executeSearch({...params, q: words[0]});
        return {
          results,
          debug_info: {
            original_query: params.q,
            queries_tried,
            fallback_used: 'broad_search',
            search_time_ms: Date.now() - startTime,
            total_memories_scanned: this.getTotalMemoryCount()
          }
        };
      } catch (error) {
        // All fallbacks failed
      }
    }

    return {
      results: [],
      debug_info: {
        original_query: params.q,
        queries_tried,
        fallback_used: 'all_failed',
        search_time_ms: Date.now() - startTime,
        total_memories_scanned: this.getTotalMemoryCount()
      }
    };
  }

  private getTotalMemoryCount(): number {
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM memories WHERE project_id = ?');
    const result = stmt.get(this.projectId) as any;
    return result.count;
  }

  private executeSearch(params: {
    q: string;
    k?: number;
    require_path_match?: boolean;
    tags?: string[];
    include_expired?: boolean;
  }): SearchResult[] {
    const k = params.k || 10;
    const now = Date.now();

    // Build FTS query
    let query = `
      SELECT
        m.*,
        bm25(mem_fts) as fts_score,
        snippet(mem_fts, 0, '[', ']', '...', 32) as snippet
      FROM memories m
      JOIN mem_fts ON m.rowid = mem_fts.rowid
      WHERE mem_fts MATCH ?
        AND m.project_id = ?
    `;

    const queryParams: any[] = [this.escapeQuery(params.q), this.projectId];

    // Add expiration filter
    if (!params.include_expired) {
      query += ' AND (m.expires_at IS NULL OR m.expires_at > ?)';
      queryParams.push(now);
    }

    // Add tag filter
    if (params.tags && params.tags.length > 0) {
      query += ' AND EXISTS (SELECT 1 FROM json_each(m.tags) WHERE value IN (' +
        params.tags.map(() => '?').join(',') + '))';
      queryParams.push(...params.tags);
    }

    // Add path matching filter
    if (params.require_path_match) {
      // Extract likely file paths from search query
      const pathTerms = params.q.split(/\s+/).filter(term =>
        term.includes('/') || term.includes('\\') || term.includes('.')
      );

      if (pathTerms.length > 0) {
        // Look for any path term in the paths JSON array
        const pathConditions = pathTerms.map(() =>
          'EXISTS (SELECT 1 FROM json_each(m.paths) WHERE value LIKE ?)'
        ).join(' OR ');
        query += ` AND (${pathConditions})`;

        // Add wildcard patterns for each path term
        pathTerms.forEach(term => {
          queryParams.push(`%${term}%`);
        });
      } else {
        // If no path-like terms found but path match required, return empty
        return [];
      }
    }

    query += ' ORDER BY fts_score DESC, m.importance DESC, m.created_at DESC LIMIT ?';
    queryParams.push(k);

    const stmt = this.db.prepare(query);
    const results = stmt.all(...queryParams) as any[];

    return results.map(row => ({
      memory: this.rowToMemory(row),
      score: -row.fts_score, // BM25 returns negative scores
      snippet: row.snippet
    }));
  }

  getRecent(params: {
    k?: number;
    path_prefix?: string;
    include_expired?: boolean;
  }): Memory[] {
    const k = params.k || 10;
    const now = Date.now();
    
    let query = `
      SELECT * FROM memories 
      WHERE project_id = ?
    `;
    const queryParams: any[] = [this.projectId];

    if (!params.include_expired) {
      query += ' AND (expires_at IS NULL OR expires_at > ?)';
      queryParams.push(now);
    }

    if (params.path_prefix) {
      query += ` AND EXISTS (
        SELECT 1 FROM json_each(paths) 
        WHERE value LIKE ? || '%'
      )`;
      queryParams.push(params.path_prefix);
    }

    query += ' ORDER BY created_at DESC LIMIT ?';
    queryParams.push(k);

    const stmt = this.db.prepare(query);
    const results = stmt.all(...queryParams) as any[];
    
    return results.map(row => this.rowToMemory(row));
  }

  // Get a single memory by ID with full text
  get(id: string): Memory | null {
    const stmt = this.db.prepare(`
      SELECT * FROM memories
      WHERE id = ? AND project_id = ?
    `);

    const result = stmt.get(id, this.projectId) as any;

    if (!result) {
      return null;
    }

    return this.rowToMemory(result);
  }

  // Get multiple memories by IDs (bulk operation)
  getMultiple(ids: string[]): { [id: string]: Memory | null } {
    const result: { [id: string]: Memory | null } = {};

    if (ids.length === 0) {
      return result;
    }

    // Build query with placeholders for all IDs
    const placeholders = ids.map(() => '?').join(',');
    const stmt = this.db.prepare(`
      SELECT * FROM memories
      WHERE id IN (${placeholders}) AND project_id = ?
    `);

    const queryParams = [...ids, this.projectId];
    const results = stmt.all(...queryParams) as any[];

    // Initialize all IDs as null (not found)
    ids.forEach(id => {
      result[id] = null;
    });

    // Fill in found memories
    results.forEach(row => {
      const memory = this.rowToMemory(row);
      result[memory.id] = memory;
    });

    return result;
  }

  forget(id: string): { ok: boolean; message?: string } {
    try {
      // Project isolation is enforced - each project has its own database

      // Check if memory exists first
      const checkStmt = this.db.prepare('SELECT id FROM memories WHERE id = ? AND project_id = ?');
      const exists = checkStmt.get(id, this.projectId);
      
      if (!exists) {
        return { 
          ok: false, 
          message: `Memory ${id} not found in project ${this.projectId}` 
        };
      }

      // Delete from main table
      const stmt = this.db.prepare('DELETE FROM memories WHERE id = ? AND project_id = ?');
      const result = stmt.run(id, this.projectId);
      
      // Try to delete from FTS index if it exists
      try {
        const ftsExists = this.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='memories_fts'").get();
        if (ftsExists) {
          const ftsStmt = this.db.prepare('DELETE FROM memories_fts WHERE rowid = (SELECT rowid FROM memories WHERE id = ?)');
          ftsStmt.run(id);
        }
      } catch (ftsError) {
        // FTS table might not exist, that's okay
        logger.debug('FTS deletion skipped:', ftsError);
      }
      
      logger.info(`Memory deleted: ${id}`);
      return { 
        ok: result.changes > 0,
        message: result.changes > 0 ? 'Memory deleted successfully' : 'Memory not found'
      };
    } catch (error: any) {
      logger.error(`Failed to delete memory ${id}:`, error);
      return { 
        ok: false, 
        message: `Error: ${error.message}` 
      };
    }
  }

  private update(id: string, params: Partial<Memory>): { id: string } {
    const now = Date.now();
    const updates: string[] = ['updated_at = ?'];
    const values: any[] = [now];

    if (params.summary !== undefined) {
      updates.push('summary = ?');
      values.push(params.summary);
    }
    if (params.text !== undefined) {
      updates.push('text = ?');
      values.push(params.text);
    }
    if (params.tags !== undefined) {
      updates.push('tags = ?');
      values.push(JSON.stringify(params.tags));
    }
    if (params.paths !== undefined) {
      updates.push('paths = ?');
      values.push(JSON.stringify(params.paths));
    }
    if (params.importance !== undefined) {
      updates.push('importance = ?');
      values.push(params.importance);
    }

    values.push(id, this.projectId);

    const stmt = this.db.prepare(`
      UPDATE memories 
      SET ${updates.join(', ')}
      WHERE id = ? AND project_id = ?
    `);
    
    stmt.run(...values);
    return { id };
  }

  private cleanupExpired() {
    const now = Date.now();
    const stmt = this.db.prepare('DELETE FROM memories WHERE expires_at < ?');
    const result = stmt.run(now);
    
    if (result.changes > 0) {
      logger.info(`Cleaned up ${result.changes} expired memories`);
    }
  }

  searchPreview(params: {
    q: string;
    k?: number;
    require_path_match?: boolean;
    tags?: string[];
    include_expired?: boolean;
  }): {
    preview: {
      would_return: number;
      search_explanation: string;
      query_breakdown: {
        original: string;
        processed: string;
        terms: string[];
        filters_applied: string[];
      };
      match_examples: Array<{
        summary: string;
        match_reason: string;
        score_estimate: string;
      }>;
    };
    suggestions: string[];
  } {
    const startTime = Date.now();
    const now = Date.now();
    const k = params.k || 10;

    // Process query the same way as real search
    const escapedQuery = this.escapeQuery(params.q);
    const terms = params.q.toLowerCase().split(/\s+/).filter(t => t.length > 0);

    let filtersApplied: string[] = [];
    let baseQuery = `
      SELECT COUNT(*) as total_matches,
             m.summary,
             bm25(mem_fts) as fts_score,
             snippet(mem_fts, 0, '[', ']', '...', 32) as snippet
      FROM memories m
      JOIN mem_fts ON m.rowid = mem_fts.rowid
      WHERE mem_fts MATCH ?
        AND m.project_id = ?
    `;

    let queryParams: any[] = [escapedQuery, this.projectId];

    // Apply filters same as real search
    if (!params.include_expired) {
      baseQuery += ' AND (m.expires_at IS NULL OR m.expires_at > ?)';
      queryParams.push(now);
      filtersApplied.push('Excluding expired memories');
    }

    if (params.tags && params.tags.length > 0) {
      const tagConditions = params.tags.map(() => 'json_extract(m.tags, ?) IS NOT NULL').join(' AND ');
      baseQuery += ` AND (${tagConditions})`;
      params.tags.forEach((tag, i) => queryParams.push(`$[${i}]`));
      filtersApplied.push(`Filtering by tags: ${params.tags.join(', ')}`);
    }

    if (params.require_path_match) {
      const cwd = process.cwd();
      const relativeCwd = cwd.replace(process.env.HOME || '', '~');
      baseQuery += ` AND (
        json_extract(m.paths, '$') LIKE '%' || ? || '%' OR
        json_extract(m.paths, '$') LIKE '%' || ? || '%'
      )`;
      queryParams.push(cwd, relativeCwd);
      filtersApplied.push(`Requiring path match for current directory`);
    }

    // Build separate queries for count and samples
    let countQuery = `
      SELECT COUNT(*) as total_matches
      FROM memories m
      JOIN mem_fts ON m.rowid = mem_fts.rowid
      WHERE mem_fts MATCH ?
        AND m.project_id = ?
    `;

    let sampleQuery = `
      SELECT m.summary,
             bm25(mem_fts) as fts_score,
             snippet(mem_fts, 0, '[', ']', '...', 32) as snippet
      FROM memories m
      JOIN mem_fts ON m.rowid = mem_fts.rowid
      WHERE mem_fts MATCH ?
        AND m.project_id = ?
    `;

    // Apply the same filters to both queries
    const countParams = [...queryParams];
    const sampleParams = [...queryParams];

    if (!params.include_expired) {
      countQuery += ' AND (m.expires_at IS NULL OR m.expires_at > ?)';
      sampleQuery += ' AND (m.expires_at IS NULL OR m.expires_at > ?)';
    }

    if (params.tags && params.tags.length > 0) {
      const tagConditions = params.tags.map(() => 'json_extract(m.tags, ?) IS NOT NULL').join(' AND ');
      countQuery += ` AND (${tagConditions})`;
      sampleQuery += ` AND (${tagConditions})`;
    }

    if (params.require_path_match) {
      const cwd = process.cwd();
      const relativeCwd = cwd.replace(process.env.HOME || '', '~');
      countQuery += ` AND (
        json_extract(m.paths, '$') LIKE '%' || ? || '%' OR
        json_extract(m.paths, '$') LIKE '%' || ? || '%'
      )`;
      sampleQuery += ` AND (
        json_extract(m.paths, '$') LIKE '%' || ? || '%' OR
        json_extract(m.paths, '$') LIKE '%' || ? || '%'
      )`;
    }

    sampleQuery += ` ORDER BY bm25(mem_fts) LIMIT 3`;

    const countStmt = this.db.prepare(countQuery);
    const sampleStmt = this.db.prepare(sampleQuery);

    let totalMatches = 0;
    let sampleResults: any[] = [];

    try {
      const countResult = countStmt.get(...countParams) as any;
      totalMatches = countResult?.total_matches || 0;

      if (totalMatches > 0) {
        sampleResults = sampleStmt.all(...sampleParams) as any[];
      }
    } catch (error) {
      // Query failed - try fallback explanations
      const suggestions = [
        'Try removing special characters or using simpler terms',
        'Check if memories exist with: memory_get_recent',
        `Query failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      ];

      return {
        preview: {
          would_return: 0,
          search_explanation: `Search would fail with error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          query_breakdown: {
            original: params.q,
            processed: escapedQuery,
            terms: terms,
            filters_applied: filtersApplied
          },
          match_examples: []
        },
        suggestions: suggestions
      };
    }

    // Create explanation
    let explanation = `Search for "${params.q}" would return ${Math.min(totalMatches, k)} of ${totalMatches} total matches.`;
    if (filtersApplied.length > 0) {
      explanation += ` Filters: ${filtersApplied.join(', ')}.`;
    }

    const matchExamples = sampleResults.map((r, i) => ({
      summary: r.summary || 'No summary',
      match_reason: `Matched terms: ${terms.filter(term =>
        r.summary?.toLowerCase().includes(term) || r.snippet?.toLowerCase().includes(term)
      ).join(', ') || 'FTS match'}`,
      score_estimate: r.fts_score > -1 ? 'High relevance' : r.fts_score > -3 ? 'Medium relevance' : 'Low relevance'
    }));

    const suggestions: string[] = [];
    if (totalMatches === 0) {
      suggestions.push('Try removing special characters or using broader terms');
      suggestions.push('Check if memories exist with: memory_get_recent');
      if (params.require_path_match) {
        suggestions.push('Try without require_path_match to search all memories');
      }
      if (params.tags && params.tags.length > 0) {
        suggestions.push('Try without tag filters to broaden search');
      }
    } else if (totalMatches < k) {
      suggestions.push(`Consider using broader terms to find more than ${totalMatches} results`);
    }

    return {
      preview: {
        would_return: Math.min(totalMatches, k),
        search_explanation: explanation,
        query_breakdown: {
          original: params.q,
          processed: escapedQuery,
          terms: terms,
          filters_applied: filtersApplied
        },
        match_examples: matchExamples
      },
      suggestions: suggestions
    };
  }

  private generateId(): string {
    return `mem_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  }

  private computeDedupeHash(summary: string, paths: string[]): string {
    const normalized = summary.toLowerCase().trim() + '|' + paths.sort().join('|');
    return crypto.createHash('md5').update(normalized).digest('hex');
  }

  private escapeQuery(query: string): string {
    // Escape FTS5 special characters and wrap in double quotes for phrase search
    // This prevents "grably-desktop" from being interpreted as "grably MINUS desktop"
    const cleaned = query
      .replace(/["]/g, '""')           // Escape existing quotes
      .replace(/[^\w\s]/g, ' ')        // Replace special chars with spaces
      .replace(/\s+/g, ' ')            // Normalize whitespace
      .trim();

    // If query contains spaces or was modified, wrap in quotes for phrase search
    if (cleaned !== query || cleaned.includes(' ')) {
      return `"${cleaned}"`;
    }

    return cleaned;
  }

  private rowToMemory(row: any): Memory {
    return {
      id: row.id,
      project_id: row.project_id,
      summary: row.summary,
      text: row.text,
      tags: JSON.parse(row.tags),
      paths: JSON.parse(row.paths),
      importance: row.importance,
      created_at: row.created_at,
      updated_at: row.updated_at,
      ttl: row.ttl,
      expires_at: row.expires_at
    };
  }

  private getActiveProjectId(): string {
    // Always use the projectId passed to constructor - ensures true isolation
    // No environment variable dependency - each database instance is bound to its project
    return this.projectId;
  }

  close() {
    this.db.close();
  }
}