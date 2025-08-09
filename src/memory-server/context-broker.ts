import { MemoryDatabase, Memory, SearchResult } from './database.js';
import { ConceptStore, Concept } from './concept-store.js';
import { MCPLogger as Logger } from '../utils/mcp-logger.js';
import path from 'path';

const logger = new Logger('ContextBroker');

export interface ContextInjection {
  id: string;
  type: 'memory' | 'concept';
  summary: string;
  content: string;
  score: number;
  source: string;
  byteSize: number;
}

export interface ContextPreview {
  injections: ContextInjection[];
  budgetUsed: number;
  budgetLimit: number;
  topK: number;
  stats: {
    projectMatches: number;
    pathMatches: number;
    conceptMatches: number;
    totalCandidates: number;
  };
}

export class ContextBroker {
  private memoryDb: MemoryDatabase;
  private conceptStore: ConceptStore;
  private projectId: string;
  private projectRoot: string;

  constructor(projectRoot: string, projectId: string) {
    this.projectRoot = projectRoot;
    this.projectId = projectId;
    this.memoryDb = new MemoryDatabase(projectRoot, projectId);
    this.conceptStore = ConceptStore.getInstance(projectId);
  }

  async preview(params: {
    open_files?: string[];
    task: string;
    budget_bytes?: number;
    top_k?: number;
    mode?: 'hard' | 'soft' | 'smart';
  }): Promise<ContextPreview> {
    // Normalize parameter names and provide defaults
    const {
      task,
      open_files = [],
      budget_bytes = 2048,
      top_k = 10,
      mode = 'smart'
    } = params;
    
    // Extract path prefixes from open files
    const pathPrefixes = this.inferPathPrefixes(open_files);
    
    // Extract keywords from task for better search
    const searchQuery = this.extractSearchTerms(task);
    
    // Search memories with improved query
    // For single words or short queries, also search in tags
    let memoryResults = this.memoryDb.search({
      q: searchQuery,
      k: 50, // Get more candidates for scoring
      require_path_match: false
    });
    
    // If we get no results with wildcard, try without wildcard
    if (memoryResults.length === 0 && searchQuery.endsWith('*')) {
      memoryResults = this.memoryDb.search({
        q: searchQuery.slice(0, -1),
        k: 50,
        require_path_match: false
      });
    }

    // Search concepts (based on mode)
    let conceptResults: Array<{ concept: Concept; score: number }> = [];
    if (mode === 'smart' || mode === 'soft') {
      // In smart mode: use allowlist
      // In soft mode: include all relevant concepts
      const allowlist = mode === 'smart' ? await this.getProjectAllowlist() : undefined;
      
      const concepts = this.conceptStore.search({
        q: searchQuery, // Use the same improved query
        k: 20,
        allowlist,
        projectId: mode === 'smart' ? this.projectId : undefined
      });
      
      // Filter by minimum score threshold
      conceptResults = concepts
        .filter(c => c.score > 0.5) // Only include relevant concepts
        .map(c => ({ concept: c.concept, score: c.score }));
    }

    // Score and rank all candidates
    const scoredCandidates = [
      ...this.scoreMemories(memoryResults, pathPrefixes, task),
      ...this.scoreConcepts(conceptResults, task)
    ].sort((a, b) => b.score - a.score);

    // Apply budget and topK constraints
    const selected = this.selectByBudget(scoredCandidates, budget_bytes, top_k);
    
    // Calculate stats
    const stats = {
      projectMatches: memoryResults.filter(r => r.memory.project_id === this.projectId).length,
      pathMatches: memoryResults.filter(r => this.hasPathMatch(r.memory.paths, pathPrefixes)).length,
      conceptMatches: conceptResults.length,
      totalCandidates: scoredCandidates.length
    };

    return {
      injections: selected,
      budgetUsed: selected.reduce((sum, inj) => sum + inj.byteSize, 0),
      budgetLimit: budget_bytes,
      topK: top_k,
      stats
    };
  }

  private scoreMemories(
    results: SearchResult[],
    pathPrefixes: string[],
    task: string
  ): ContextInjection[] {
    return results.map(result => {
      const memory = result.memory;
      
      // Base scoring formula from senior dev's spec
      let score = 0;
      
      // Project match bonus
      score += 1.5 * +(memory.project_id === this.projectId);
      
      // Check if single-word query for special handling
      const words = task.toLowerCase().split(/\s+/).filter(w => w.length > 2);
      const isSingleWord = words.length === 1;
      
      // Path match bonus - SUPER STRONG for single-word queries
      const pathScore = this.pathMatchStrength(memory.paths, pathPrefixes);
      
      if (isSingleWord && pathScore > 0) {
        // For single-word queries with path match, make path DOMINANT
        score += 10.0 * pathScore;  // Massive boost
      } else {
        // Normal path boost for multi-word queries
        score += 2.0 * pathScore;
        
        // Extra boost for strong path matches
        if (pathScore > 0.5) {
          score += 2.0; // Additional boost for strong path alignment
        }
      }
      
      // Task relevance (tag matching)
      const tagScore = this.taskMatchStrength(memory.tags, task);
      score += 0.8 * tagScore;
      
      // Single-word query boost if tag matches
      if (isSingleWord && tagScore > 0) {
        score += 3.0; // Strong boost for single-word matches
      }
      
      // Recency bonus (decay over time)
      score += 0.6 * this.recencyScore(memory.created_at);
      
      // Importance weight
      score += 0.6 * (memory.importance || 3);
      
      // Cross-project penalty
      score -= 1.0 * +(memory.project_id !== this.projectId);
      
      // FTS score integration
      score += Math.min(result.score / 10, 1.0); // Normalize and cap FTS contribution

      const content = this.formatMemoryForInjection(memory);
      
      return {
        id: memory.id,
        type: 'memory' as const,
        summary: memory.summary,
        content,
        score,
        source: `${memory.project_id}:${memory.id}`,
        byteSize: Buffer.byteLength(content, 'utf8')
      };
    });
  }

  private scoreConcepts(
    results: Array<{ concept: Concept; score: number }>,
    task: string
  ): ContextInjection[] {
    return results.map(({ concept, score: ftsScore }) => {
      let score = 0;
      
      // Concept base score (global knowledge value)
      score += 2.0; // Concepts are valuable
      
      // Task relevance
      score += 0.8 * this.taskMatchStrength(concept.tags, task);
      
      // Importance
      score += 0.6 * concept.importance;
      
      // FTS score
      score += Math.min(ftsScore / 10, 1.0);
      
      // No recency penalty for concepts (timeless knowledge)

      const content = this.formatConceptForInjection(concept);
      
      return {
        id: concept.id,
        type: 'concept' as const,
        summary: concept.title,
        content,
        score,
        source: `global:${concept.id}`,
        byteSize: Buffer.byteLength(content, 'utf8')
      };
    });
  }

  private selectByBudget(
    candidates: ContextInjection[],
    budgetLimit: number,
    topK: number
  ): ContextInjection[] {
    const selected: ContextInjection[] = [];
    let budgetUsed = 0;
    
    // Greedy selection with deduplication
    const seen = new Set<string>();
    
    for (const candidate of candidates) {
      if (selected.length >= topK) break;
      if (budgetUsed + candidate.byteSize > budgetLimit) break;
      
      // Dedupe by normalized summary
      const dedupeKey = this.normalizeForDedupe(candidate.summary);
      if (seen.has(dedupeKey)) continue;
      
      selected.push(candidate);
      budgetUsed += candidate.byteSize;
      seen.add(dedupeKey);
    }
    
    return selected;
  }

  private inferPathPrefixes(openFiles: string[]): string[] {
    const prefixes = new Set<string>();
    
    for (const file of openFiles) {
      // Use the file path directly (don't make it relative)
      // Split by / to handle both absolute and relative paths
      const parts = file.split('/').filter(p => p);
      
      // Build prefixes as absolute-style paths
      for (let i = 1; i <= parts.length; i++) {
        const prefix = '/' + parts.slice(0, i).join('/');
        prefixes.add(prefix);
        
        // Also add with wildcard for glob matching
        if (i < parts.length) {
          prefixes.add(prefix + '/*');
        }
      }
    }
    
    return Array.from(prefixes);
  }

  private pathMatchStrength(memoryPaths: string[], prefixes: string[]): number {
    if (memoryPaths.length === 0 || prefixes.length === 0) return 0;
    
    let maxMatch = 0;
    
    for (const memPath of memoryPaths) {
      // Remove wildcard from memory path for comparison
      const memPathClean = memPath.replace(/\*$/, '');
      
      for (const prefix of prefixes) {
        // Remove wildcard from prefix for comparison
        const prefixClean = prefix.replace(/\*$/, '');
        
        // Check for exact match or prefix match
        if (memPathClean === prefixClean) {
          // Exact match is perfect
          maxMatch = 1.0;
        } else if (prefixClean.startsWith(memPathClean) || memPathClean.startsWith(prefixClean)) {
          // Partial match based on overlap
          const overlap = Math.min(memPathClean.length, prefixClean.length);
          const longer = Math.max(memPathClean.length, prefixClean.length);
          const score = overlap / longer;
          maxMatch = Math.max(maxMatch, score);
        }
      }
    }
    
    return maxMatch;
  }

  private hasPathMatch(memoryPaths: string[], prefixes: string[]): boolean {
    return this.pathMatchStrength(memoryPaths, prefixes) > 0.3;
  }

  /**
   * Extract meaningful search terms from a task description
   * This improves FTS search by focusing on key terms
   */
  private extractSearchTerms(task: string): string {
    // Remove common stop words that don't help search
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during',
      'how', 'when', 'where', 'why', 'what', 'which', 'who', 'whom', 'this',
      'that', 'these', 'those', 'am', 'is', 'are', 'was', 'were', 'be', 'been',
      'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
      'should', 'could', 'may', 'might', 'must', 'can', 'need', 'new', 'create',
      'implement', 'fix', 'update', 'add', 'remove', 'change', 'modify'
    ]);
    
    // Extract meaningful words
    const words = task.toLowerCase()
      .split(/\s+/)
      .filter(word => {
        // Keep word if it's not a stop word and has meaningful length
        return word.length > 2 && !stopWords.has(word);
      })
      .slice(0, 5); // Limit to top 5 keywords to avoid dilution
    
    // For single-word queries, use wildcard to catch partial matches
    if (words.length === 1) {
      return `${words[0]}*`;  // Use wildcard for broader matching
    }
    
    // If we have keywords, join them with OR for FTS
    // If no keywords extracted, fallback to original task
    return words.length > 0 ? words.join(' OR ') : task;
  }

  private taskMatchStrength(tags: string[], task: string): number {
    const taskWords = task.toLowerCase().split(/\s+/);
    let matches = 0;
    
    for (const tag of tags) {
      const tagLower = tag.toLowerCase();
      for (const word of taskWords) {
        // More lenient matching: check if either contains the other
        // or if they share at least 3 characters in common
        if (tagLower.includes(word) || word.includes(tagLower)) {
          matches++;
          break;
        }
        // Additional check for partial matches (e.g., "auth" matches "authentication")
        if (word.length >= 3 && tagLower.length >= 3) {
          const minLen = Math.min(word.length, tagLower.length);
          if (word.substring(0, minLen) === tagLower.substring(0, minLen)) {
            matches++;
            break;
          }
        }
      }
    }
    
    return tags.length > 0 ? matches / tags.length : 0;
  }

  private recencyScore(createdAt: number): number {
    const ageHours = (Date.now() - createdAt) / (1000 * 60 * 60);
    
    // Decay function: full score for < 24h, half at 7 days, minimal after 30 days
    if (ageHours < 24) return 1.0;
    if (ageHours < 168) return 0.8; // 7 days
    if (ageHours < 720) return 0.5; // 30 days
    return 0.2;
  }

  private formatMemoryForInjection(memory: Memory): string {
    const parts = [
      `## ${memory.summary}`,
      memory.text
    ];
    
    if (memory.paths.length > 0) {
      parts.push(`**Paths:** ${memory.paths.join(', ')}`);
    }
    
    if (memory.tags.length > 0) {
      parts.push(`**Tags:** ${memory.tags.join(', ')}`);
    }
    
    return parts.join('\n\n');
  }

  private formatConceptForInjection(concept: Concept): string {
    return `## ${concept.title}\n\n${concept.body}\n\n**Tags:** ${concept.tags.join(', ')}`;
  }

  private normalizeForDedupe(summary: string): string {
    return summary
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private async getProjectAllowlist(): Promise<string[]> {
    try {
      const result = this.conceptStore.updateAllowlist({
        projectId: this.projectId,
        list: true
      });
      return result.allowlist || [];
    } catch (error) {
      logger.warn(`Failed to get allowlist for project ${this.projectId}:`, error);
      return [];
    }
  }

  // Context rules management
  private contextRules = {
    maxMemoryAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    minImportance: 2,
    pathBoostMultiplier: 2.0,
    conceptImportanceThreshold: 3,
    dedupeThreshold: 0.8
  };

  getRules() {
    return { ...this.contextRules };
  }

  setRules(rules: Partial<typeof this.contextRules>) {
    Object.assign(this.contextRules, rules);
    logger.info('Context rules updated:', rules);
  }

  close() {
    this.memoryDb.close();
  }
}