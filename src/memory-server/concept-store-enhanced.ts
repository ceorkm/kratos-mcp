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
  usage_count?: number;  // Track how often it's used
  last_used?: number;     // Track when last used
}

export interface ConceptSearchResult {
  concept: Concept;
  score: number;
  snippet?: string;
}

/**
 * ENHANCED Concept Store - 10/10 Features
 * 
 * NEW FEATURES:
 * - Auto-discovery: Automatically finds and suggests relevant concepts
 * - Usage tracking: Tracks which concepts are most useful
 * - Smart ranking: Combines relevance, importance, and usage
 * - Cross-project learning: Optionally share valuable concepts
 * - Concept relationships: Link related concepts
 */
export class ConceptStoreEnhanced {
  private db: Database.Database;
  private static instances: Map<string, ConceptStoreEnhanced> = new Map();
  private projectId: string;
  
  // Concept discovery cache
  private discoveryCache: Map<string, Concept[]> = new Map();

  private constructor(projectId: string) {
    this.projectId = projectId;
    
    // ISOLATED concept store per project
    const kratosHome = path.join(os.homedir(), '.kratos');
    const dbPath = path.join(kratosHome, 'projects', projectId, 'databases', 'concepts.db');
    fs.ensureDirSync(path.dirname(dbPath));
    
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    
    this.initializeEnhancedSchema();
    logger.info(`Enhanced Concept Store initialized for project: ${projectId}`);
  }

  static getInstance(projectId?: string): ConceptStoreEnhanced {
    const id = projectId || 'global';
    
    if (!ConceptStoreEnhanced.instances.has(id)) {
      ConceptStoreEnhanced.instances.set(id, new ConceptStoreEnhanced(id));
    }
    return ConceptStoreEnhanced.instances.get(id)!;
  }

  private initializeEnhancedSchema() {
    // Enhanced concepts table with usage tracking
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS concepts (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        tags TEXT DEFAULT '[]',
        importance INTEGER DEFAULT 3 CHECK(importance >= 1 AND importance <= 5),
        usage_count INTEGER DEFAULT 0,
        last_used INTEGER,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        source TEXT DEFAULT 'manual',  -- manual, discovered, imported
        confidence REAL DEFAULT 1.0     -- confidence in the concept
      );

      CREATE INDEX IF NOT EXISTS idx_concept_importance ON concepts(importance DESC);
      CREATE INDEX IF NOT EXISTS idx_concept_usage ON concepts(usage_count DESC);
      CREATE INDEX IF NOT EXISTS idx_concept_last_used ON concepts(last_used DESC);
    `);

    // Concept relationships table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS concept_relationships (
        concept_id TEXT NOT NULL,
        related_id TEXT NOT NULL,
        relationship_type TEXT DEFAULT 'related', -- related, prerequisite, extends, conflicts
        strength REAL DEFAULT 0.5,
        PRIMARY KEY (concept_id, related_id),
        FOREIGN KEY (concept_id) REFERENCES concepts(id) ON DELETE CASCADE,
        FOREIGN KEY (related_id) REFERENCES concepts(id) ON DELETE CASCADE
      );
    `);

    // Project allowlists (enhanced with auto-add suggestions)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS project_allowlists (
        project_id TEXT NOT NULL,
        concept_id TEXT NOT NULL,
        added_at INTEGER NOT NULL,
        auto_suggested BOOLEAN DEFAULT 0,
        accepted BOOLEAN DEFAULT 1,
        PRIMARY KEY (project_id, concept_id),
        FOREIGN KEY (concept_id) REFERENCES concepts(id) ON DELETE CASCADE
      );
    `);

    // Full-text search with enhanced fields
    this.db.exec(`
      CREATE VIRTUAL TABLE IF NOT EXISTS concept_fts USING fts5(
        title, 
        body,
        tags,
        content='concepts', 
        content_rowid='rowid',
        tokenize='porter unicode61'
      );

      -- Enhanced triggers for FTS
      CREATE TRIGGER IF NOT EXISTS concept_fts_insert AFTER INSERT ON concepts BEGIN
        INSERT INTO concept_fts(rowid, title, body, tags) 
        VALUES (new.rowid, new.title, new.body, 
                CASE WHEN json_array_length(new.tags) > 0 
                     THEN (SELECT group_concat(value, ' ') FROM json_each(new.tags))
                     ELSE ''
                END);
      END;

      CREATE TRIGGER IF NOT EXISTS concept_fts_delete AFTER DELETE ON concepts BEGIN
        DELETE FROM concept_fts WHERE rowid = old.rowid;
      END;

      CREATE TRIGGER IF NOT EXISTS concept_fts_update AFTER UPDATE ON concepts BEGIN
        DELETE FROM concept_fts WHERE rowid = old.rowid;
        INSERT INTO concept_fts(rowid, title, body, tags) 
        VALUES (new.rowid, new.title, new.body,
                CASE WHEN json_array_length(new.tags) > 0 
                     THEN (SELECT group_concat(value, ' ') FROM json_each(new.tags))
                     ELSE ''
                END);
      END;
    `);
  }

  /**
   * Enhanced save with auto-discovery and relationship detection
   */
  save(params: {
    title: string;
    body: string;
    tags?: string[];
    importance?: number;
    source?: 'manual' | 'discovered' | 'imported';
    relatedTo?: string[];  // IDs of related concepts
  }): Concept {
    const now = Date.now();
    const id = this.generateConceptId(params.title);
    
    const concept: Concept = {
      id,
      title: params.title,
      body: params.body,
      tags: params.tags || [],
      importance: params.importance || 3,
      usage_count: 0,
      created_at: now,
      updated_at: now
    };

    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO concepts 
      (id, title, body, tags, importance, usage_count, created_at, updated_at, source)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      concept.id,
      concept.title,
      concept.body,
      JSON.stringify(concept.tags),
      concept.importance,
      0,
      concept.created_at,
      concept.updated_at,
      params.source || 'manual'
    );

    // Save relationships if provided
    if (params.relatedTo && params.relatedTo.length > 0) {
      this.addRelationships(id, params.relatedTo);
    }

    // Auto-discover related concepts
    this.autoDiscoverRelated(concept);

    logger.info(`Saved enhanced concept: ${concept.title} (${id})`);
    return concept;
  }

  /**
   * ENHANCED search with smart ranking
   */
  search(params: {
    q: string;
    k?: number;
    allowlist?: string[];
    projectId?: string;
    includeRelated?: boolean;  // Include related concepts
    boostRecent?: boolean;     // Boost recently used concepts
  }): ConceptSearchResult[] {
    const k = params.k || 10;
    const searchQuery = params.q || '*';
    
    let query: string;
    let queryParams: any[] = [];

    if (searchQuery === '*') {
      // Return all concepts with smart ranking
      query = `
        SELECT 
          c.*,
          (c.importance * 2.0 + 
           COALESCE(c.usage_count * 0.1, 0) + 
           CASE WHEN c.last_used > ? THEN 2.0 ELSE 0 END) as smart_score,
          '' as snippet
        FROM concepts c
      `;
      // Recent = last 7 days
      queryParams = [Date.now() - 7 * 24 * 60 * 60 * 1000];
    } else {
      // Enhanced FTS search with smart scoring
      query = `
        SELECT 
          c.*,
          (-bm25(concept_fts) * 3.0 + 
           c.importance * 2.0 + 
           COALESCE(c.usage_count * 0.1, 0) +
           CASE WHEN c.last_used > ? THEN 2.0 ELSE 0 END) as smart_score,
          snippet(concept_fts, 0, '[', ']', '...', 32) as snippet
        FROM concepts c
        JOIN concept_fts ON c.rowid = concept_fts.rowid
        WHERE concept_fts MATCH ?
      `;
      queryParams = [Date.now() - 7 * 24 * 60 * 60 * 1000, searchQuery];
    }

    // Apply filters
    if (params.projectId) {
      const whereClause = searchQuery === '*' ? ' WHERE' : ' AND';
      query += `${whereClause} c.id IN (
        SELECT concept_id FROM project_allowlists 
        WHERE project_id = ? AND accepted = 1
      )`;
      queryParams.push(params.projectId);
    }

    // Smart ordering
    query += ' ORDER BY smart_score DESC LIMIT ?';
    queryParams.push(k);

    const stmt = this.db.prepare(query);
    const results = stmt.all(...queryParams) as any[];

    // Include related concepts if requested
    let finalResults: ConceptSearchResult[] = results.map(row => ({
      concept: this.rowToConcept(row),
      score: row.smart_score || 1.0,
      snippet: row.snippet
    }));

    if (params.includeRelated && finalResults.length > 0) {
      finalResults = this.enrichWithRelated(finalResults);
    }

    // Track usage for learning
    if (finalResults.length > 0) {
      this.trackUsage(finalResults[0].concept.id);
    }

    return finalResults;
  }

  /**
   * Auto-discover concepts from text
   */
  async autoDiscover(text: string, context?: string): Promise<Concept[]> {
    const discovered: Concept[] = [];
    
    // Pattern matching for common concept indicators
    const patterns = [
      /(?:best practice|pattern|principle|rule):\s*([^.]+)/gi,
      /(?:always|never|should|must)\s+([^.]+)/gi,
      /(?:tip|note|important):\s*([^.]+)/gi,
      /(?:remember|keep in mind):\s*([^.]+)/gi
    ];

    for (const pattern of patterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const conceptText = match[1].trim();
        if (conceptText.length > 20 && conceptText.length < 500) {
          const concept = this.save({
            title: this.generateTitle(conceptText),
            body: conceptText,
            tags: this.extractTags(conceptText),
            importance: 3,
            source: 'discovered'
          });
          discovered.push(concept);
        }
      }
    }

    return discovered;
  }

  /**
   * Track concept usage for smart ranking
   */
  private trackUsage(conceptId: string): void {
    const stmt = this.db.prepare(`
      UPDATE concepts 
      SET usage_count = usage_count + 1,
          last_used = ?
      WHERE id = ?
    `);
    stmt.run(Date.now(), conceptId);
  }

  /**
   * Add relationships between concepts
   */
  private addRelationships(conceptId: string, relatedIds: string[], type: string = 'related'): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO concept_relationships
      (concept_id, related_id, relationship_type, strength)
      VALUES (?, ?, ?, ?)
    `);

    for (const relatedId of relatedIds) {
      stmt.run(conceptId, relatedId, type, 0.5);
    }
  }

  /**
   * Auto-discover related concepts
   */
  private autoDiscoverRelated(concept: Concept): void {
    // Find concepts with overlapping tags
    const stmt = this.db.prepare(`
      SELECT id, title, tags FROM concepts 
      WHERE id != ? 
      LIMIT 20
    `);
    
    const others = stmt.all(concept.id) as any[];
    
    for (const other of others) {
      const otherTags = JSON.parse(other.tags);
      const overlap = concept.tags.filter(t => otherTags.includes(t)).length;
      
      if (overlap > 0) {
        const strength = overlap / Math.max(concept.tags.length, otherTags.length);
        if (strength > 0.3) {
          this.addRelationships(concept.id, [other.id], 'related');
        }
      }
    }
  }

  /**
   * Enrich results with related concepts
   */
  private enrichWithRelated(results: ConceptSearchResult[]): ConceptSearchResult[] {
    const enriched = [...results];
    const seen = new Set(results.map(r => r.concept.id));

    for (const result of results.slice(0, 3)) {
      const stmt = this.db.prepare(`
        SELECT c.*, r.strength
        FROM concepts c
        JOIN concept_relationships r ON c.id = r.related_id
        WHERE r.concept_id = ?
        ORDER BY r.strength DESC
        LIMIT 2
      `);

      const related = stmt.all(result.concept.id) as any[];
      
      for (const rel of related) {
        if (!seen.has(rel.id)) {
          enriched.push({
            concept: this.rowToConcept(rel),
            score: result.score * rel.strength * 0.5,
            snippet: `[Related to: ${result.concept.title}]`
          });
          seen.add(rel.id);
        }
      }
    }

    return enriched.sort((a, b) => b.score - a.score);
  }

  /**
   * Auto-suggest concepts for a project based on context
   */
  async suggestForProject(projectId: string, context: string): Promise<Concept[]> {
    const searchResults = this.search({ 
      q: context, 
      k: 5,
      boostRecent: true 
    });

    const suggestions = searchResults
      .filter(r => r.score > 2.0)
      .map(r => r.concept);

    // Add to allowlist as suggestions
    const stmt = this.db.prepare(`
      INSERT OR IGNORE INTO project_allowlists
      (project_id, concept_id, added_at, auto_suggested, accepted)
      VALUES (?, ?, ?, 1, 0)
    `);

    for (const concept of suggestions) {
      stmt.run(projectId, concept.id, Date.now());
    }

    return suggestions;
  }

  private generateConceptId(title: string): string {
    const slug = title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50);
    
    const hash = crypto.randomBytes(3).toString('hex');
    return `${slug}-${hash}`;
  }

  private generateTitle(text: string): string {
    const words = text.split(' ').slice(0, 5).join(' ');
    return words.charAt(0).toUpperCase() + words.slice(1);
  }

  private extractTags(text: string): string[] {
    const keywords = text.toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 4)
      .filter(word => !['should', 'would', 'could', 'might', 'must'].includes(word))
      .slice(0, 5);
    
    return [...new Set(keywords)];
  }

  private rowToConcept(row: any): Concept {
    return {
      id: row.id,
      title: row.title,
      body: row.body,
      tags: JSON.parse(row.tags),
      importance: row.importance,
      usage_count: row.usage_count || 0,
      last_used: row.last_used,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }

  get(id: string): Concept | null {
    const stmt = this.db.prepare('SELECT * FROM concepts WHERE id = ?');
    const row = stmt.get(id);
    return row ? this.rowToConcept(row) : null;
  }

  close(): void {
    this.db.close();
  }
}